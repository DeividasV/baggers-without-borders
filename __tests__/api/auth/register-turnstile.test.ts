/**
 * Registration API with Turnstile CAPTCHA tests
 * Tests bot protection integration in the registration flow
 */

import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import * as turnstile from "@/src/lib/turnstile";

// Mock dependencies
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    hallOfFame: {
      findMany: jest.fn(),
    },
    year: {
      findMany: jest.fn(),
    },
    consentType: {
      findMany: jest.fn(),
    },
    userHofParticipation: {
      createMany: jest.fn(),
    },
    userYearParticipation: {
      createMany: jest.fn(),
    },
    userConsent: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock("@/src/lib/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/src/lib/turnstile");

describe("POST /api/auth/register - Turnstile Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock: Turnstile passes
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: true,
      challenge_ts: new Date().toISOString(),
      hostname: "localhost",
      "error-codes": [],
    });

    (turnstile.getClientIp as jest.Mock).mockReturnValue("192.168.1.1");
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(false);

    // Mock Prisma responses
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "test-user-id",
      email: "test@example.com",
      username: "testuser",
      displayName: "Test User",
      status: "NEW",
      emailVerified: null,
      emailVerificationToken: "test-token",
      emailVerificationExpires: new Date(Date.now() + 3600000),
    });
    (prisma.hallOfFame.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.year.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.consentType.findMany as jest.Mock).mockResolvedValue([
      { id: "consent-1", title: "Privacy Policy", status: "ACTIVE" },
      { id: "consent-2", title: "Terms of Service", status: "ACTIVE" },
    ]);
    (prisma.userConsent.createMany as jest.Mock).mockResolvedValue({ count: 2 });
  });

  it("should successfully register with valid Turnstile token", async () => {
    const request = new NextRequest("http://localhost:1345/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123",
        displayName: "Test User",
        turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toContain("Registration successful");
    expect(turnstile.verifyTurnstileToken).toHaveBeenCalledWith(
      "XXXX.DUMMY.TOKEN.XXXX",
      "192.168.1.1"
    );
  });

  it("should reject registration with missing Turnstile token", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: false,
      "error-codes": ["missing-input-response"],
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(true);

    const request = new NextRequest("http://localhost:1345/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123",
        displayName: "Test User",
        // turnstileToken missing
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("CAPTCHA verification failed");
  });

  it("should reject registration with invalid Turnstile token", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: false,
      "error-codes": ["invalid-input-response"],
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(true);

    const request = new NextRequest("http://localhost:1345/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123",
        displayName: "Test User",
        turnstileToken: "invalid-token",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("CAPTCHA verification failed");
  });

  it("should reject registration with expired/duplicate Turnstile token", async () => {
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: false,
      "error-codes": ["timeout-or-duplicate"],
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(true);

    const request = new NextRequest("http://localhost:1345/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123",
        displayName: "Test User",
        turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("CAPTCHA verification failed");
  });

  it("should allow registration when Turnstile fails open (network timeout)", async () => {
    // Simulate Turnstile API timeout - fail open
    (turnstile.verifyTurnstileToken as jest.Mock).mockResolvedValue({
      success: true,
      failedOpen: true,
    });
    (turnstile.shouldBlockRequest as jest.Mock).mockReturnValue(false);

    const request = new NextRequest("http://localhost:1345/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123",
        displayName: "Test User",
        turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    // Should succeed despite Turnstile timeout (fail-open strategy)
    expect(response.status).toBe(201);
    expect(data.message).toContain("Registration successful");
  });

  it("should extract IP from headers for Turnstile verification", async () => {
    const request = new NextRequest("http://localhost:1345/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123",
        displayName: "Test User",
        turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
      }),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.42",
      },
    });

    await POST(request);

    expect(turnstile.getClientIp).toHaveBeenCalledWith(expect.any(Headers));
  });
});
