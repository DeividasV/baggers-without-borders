/**
 * Forgot Password API with Turnstile CAPTCHA tests
 * Tests bot protection integration in the forgot-password flow
 */

import { POST } from "@/app/api/auth/forgot-password/route";
import { prisma } from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import * as turnstile from "@/src/lib/turnstile";

jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/src/lib/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/src/lib/turnstile");

describe("POST /api/auth/forgot-password - Turnstile Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: true,
      challenge_ts: new Date().toISOString(),
      hostname: "localhost",
      "error-codes": [],
    });

    (turnstile.getClientIp as jest.Mock).mockReturnValue("192.168.1.1");
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(false);

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-id",
      email: "test@example.com",
      displayName: "Test User",
      emailVerified: new Date(),
    });

    (prisma.user.update as jest.Mock).mockResolvedValue(true);
  });

  it("should allow forgot-password with valid Turnstile token", async () => {
    const request = new NextRequest(
      "http://localhost:1345/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
        }),
        headers: { "content-type": "application/json" },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain("password reset link");
    expect(turnstile.verifyTurnstileToken).toHaveBeenCalledWith(
      "XXXX.DUMMY.TOKEN.XXXX",
      "192.168.1.1"
    );
  });

  it("should reject forgot-password with missing Turnstile token", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: false,
      "error-codes": ["missing-input-response"],
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(true);

    const request = new NextRequest(
      "http://localhost:1345/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
        }),
        headers: { "content-type": "application/json" },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("CAPTCHA verification failed");
  });

  it("should reject forgot-password with invalid Turnstile token", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: false,
      "error-codes": ["invalid-input-response"],
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(true);

    const request = new NextRequest(
      "http://localhost:1345/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          turnstileToken: "invalid-token",
        }),
        headers: { "content-type": "application/json" },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("CAPTCHA verification failed");
  });

  it("should allow forgot-password when Turnstile fails open (network timeout)", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: true,
      failedOpen: true,
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(false);

    const request = new NextRequest(
      "http://localhost:1345/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
        }),
        headers: { "content-type": "application/json" },
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("should extract IP from headers for Turnstile verification", async () => {
    const request = new NextRequest(
      "http://localhost:1345/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
        }),
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.42",
        },
      }
    );

    await POST(request);

    // In this unit test file, getClientIp is mocked.
    expect(turnstile.getClientIp).toHaveBeenCalled();
  });
});
