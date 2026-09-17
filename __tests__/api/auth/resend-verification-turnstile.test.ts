/**
 * Resend Verification API with Turnstile CAPTCHA tests
 * Tests bot protection integration in the resend-verification flow
 */

import { POST } from "@/app/api/auth/resend-verification/route";
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

describe("POST /api/auth/resend-verification - Turnstile Integration", () => {
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
      emailVerified: null,
      emailVerificationResendCount: 0,
    });

    (prisma.user.update as jest.Mock).mockResolvedValue(true);
  });

  it("should resend verification with valid Turnstile token", async () => {
    const request = new NextRequest(
      "http://localhost:1345/api/auth/resend-verification",
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
    expect(data.message).toContain("Verification email sent");
    expect(turnstile.verifyTurnstileToken).toHaveBeenCalledWith(
      "XXXX.DUMMY.TOKEN.XXXX",
      "192.168.1.1"
    );
  });

  it("should reject resend-verification with missing Turnstile token", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: false,
      "error-codes": ["missing-input-response"],
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(true);

    const request = new NextRequest(
      "http://localhost:1345/api/auth/resend-verification",
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

  it("should reject resend-verification with invalid Turnstile token", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: false,
      "error-codes": ["invalid-input-response"],
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(true);

    const request = new NextRequest(
      "http://localhost:1345/api/auth/resend-verification",
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

  it("should allow resend-verification when Turnstile fails open (network timeout)", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: true,
      failedOpen: true,
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(false);

    const request = new NextRequest(
      "http://localhost:1345/api/auth/resend-verification",
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
      "http://localhost:1345/api/auth/resend-verification",
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
    expect(turnstile.getClientIp).toHaveBeenCalled();
  });
});
