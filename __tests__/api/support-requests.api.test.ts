/**
 * Support Requests API Tests
 * Tests for /api/support-requests endpoints including Turnstile, Rate Limiting, and Email
 */

import { NextRequest, NextResponse } from "next/server";

// Mock dependencies
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    supportRequest: {
      create: jest.fn(),
    },
    supportRequestAttachment: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock("@/src/lib/email", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("@/src/lib/api-auth", () => ({
  getOptionalSession: jest.fn(),
}));

jest.mock("@/src/lib/rateLimit", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/src/lib/turnstile", () => ({
  verifyTurnstileToken: jest.fn(),
}));

jest.mock("fs/promises", () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

// Import after mocking
import { prisma } from "@/src/lib/prisma";
import { sendEmail } from "@/src/lib/email";
import { getOptionalSession } from "@/src/lib/api-auth";
import { checkRateLimit } from "@/src/lib/rateLimit";
import { verifyTurnstileToken } from "@/src/lib/turnstile";
import { POST } from "@/app/api/support-requests/route";

describe("Support Requests API", () => {
  let mockRequest: any;
  let mockFormData: Map<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup FormData mock
    mockFormData = new Map();
    const headersMap = new Map();

    mockRequest = {
      headers: {
        get: jest.fn((key) => headersMap.get(key)),
      },
      formData: jest.fn().mockResolvedValue(mockFormData),
    };

    // Default successful responses
    (getOptionalSession as jest.Mock).mockResolvedValue(null);
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
    (verifyTurnstileToken as jest.Mock).mockResolvedValue({ success: true });
    (sendEmail as jest.Mock).mockResolvedValue({ success: true });
    (prisma.supportRequest.create as jest.Mock).mockResolvedValue({
      id: "req-123",
      category: "GENERAL",
    });

    // Default form data
    mockFormData.set("name", "John Doe");
    mockFormData.set("email", "john@example.com");
    mockFormData.set("subject", "Test Subject");
    mockFormData.set("message", "Test Message");
    mockFormData.set("category", "GENERAL");
    mockFormData.set("turnstileToken", "valid-token");
    mockFormData.getAll = (key: string) => {
      if (key === "files") return [];
      const val = mockFormData.get(key);
      return val ? [val] : [];
    };
  });

  describe("POST /api/support-requests", () => {
    it("should create request successfully for public user with valid token", async () => {
      const resp = await POST(mockRequest as NextRequest);
      const data = await resp.json();

      expect(resp.status).toBe(201);
      expect(verifyTurnstileToken).toHaveBeenCalledWith("valid-token");
      expect(prisma.supportRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "john@example.com",
            category: "GENERAL",
          }),
        })
      );
      expect(sendEmail).toHaveBeenCalledTimes(2); // Notification + Confirmation
      expect(data.data.id).toBe("req-123");
    });

    it("should fail for public user without turnstile token", async () => {
      mockFormData.set("turnstileToken", "");

      const resp = await POST(mockRequest as NextRequest);
      const data = await resp.json();

      expect(resp.status).toBe(403);
      expect(data.error).toContain("Security verification required");
      expect(prisma.supportRequest.create).not.toHaveBeenCalled();
    });

    it("should fail for public user with invalid turnstile token", async () => {
      (verifyTurnstileToken as jest.Mock).mockResolvedValue({ success: false });

      const resp = await POST(mockRequest as NextRequest);
      const data = await resp.json();

      expect(resp.status).toBe(403);
      expect(data.error).toContain("Security verification failed");
    });

    it("should skip turnstile for authenticated user", async () => {
      (getOptionalSession as jest.Mock).mockResolvedValue({
        user: { id: "user-123", email: "user@example.com" },
      });
      mockFormData.set("turnstileToken", ""); // No token needed

      const resp = await POST(mockRequest as NextRequest);

      expect(resp.status).toBe(201);
      expect(verifyTurnstileToken).not.toHaveBeenCalled();
    });

    it("should enforce rate limiting", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);

      const resp = await POST(mockRequest as NextRequest);
      const data = await resp.json();

      expect(resp.status).toBe(429);
      expect(data.error).toContain("Too many requests");
      expect(prisma.supportRequest.create).not.toHaveBeenCalled();
    });

    it("should validate required fields", async () => {
      mockFormData.delete("email");

      const resp = await POST(mockRequest as NextRequest);
      const data = await resp.json();

      expect(resp.status).toBe(400);
      expect(data.error).toContain("Missing required fields");
    });

    it("should use correct rate limit action type", async () => {
      await POST(mockRequest as NextRequest);

      expect(checkRateLimit).toHaveBeenCalledWith(
        expect.stringContaining("john@example.com"),
        "support-request" // Important: Verify correct bucket used
      );
    });
  });
});
