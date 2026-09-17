/**
 * Reset Password API with Turnstile CAPTCHA tests
 * Tests bot protection integration in the reset-password flow
 */

import { POST } from "@/app/api/auth/reset-password/route";
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

jest.mock("@/src/lib/turnstile");

describe("POST /api/auth/reset-password - Turnstile Integration", () => {
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
      passwordResetToken: "reset-token",
      passwordResetExpires: new Date(Date.now() + 60_000),
    });

    (prisma.user.update as jest.Mock).mockResolvedValue(true);
  });

  it("should reset password with valid Turnstile token", async () => {
    const request = new NextRequest(
      "http://localhost:1345/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token: "reset-token",
          newPassword: "Password123",
          turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
        }),
        headers: { "content-type": "application/json" },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain("Password reset successfully");
    expect(turnstile.verifyTurnstileToken).toHaveBeenCalledWith(
      "XXXX.DUMMY.TOKEN.XXXX",
      "192.168.1.1"
    );
  });

  it("should reject reset-password with missing Turnstile token", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: false,
      "error-codes": ["missing-input-response"],
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(true);

    const request = new NextRequest(
      "http://localhost:1345/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token: "reset-token",
          newPassword: "Password123",
        }),
        headers: { "content-type": "application/json" },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("CAPTCHA verification failed");
  });

  it("should reject reset-password with invalid Turnstile token", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: false,
      "error-codes": ["invalid-input-response"],
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(true);

    const request = new NextRequest(
      "http://localhost:1345/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token: "reset-token",
          newPassword: "Password123",
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

  it("should allow reset-password when Turnstile fails open (network timeout)", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: true,
      failedOpen: true,
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(false);

    const request = new NextRequest(
      "http://localhost:1345/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token: "reset-token",
          newPassword: "Password123",
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
      "http://localhost:1345/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token: "reset-token",
          newPassword: "Password123",
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
