/**
 * Turnstile utility tests
 * Tests bot protection verification with mock Siteverify API responses
 */

import {
  verifyTurnstileToken,
  getClientIp,
  shouldBlockRequest,
} from "@/src/lib/turnstile";

// Mock fetch globally
global.fetch = jest.fn();

describe("Turnstile Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment variables
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("verifyTurnstileToken", () => {
    it("should successfully validate a valid token", async () => {
      const mockResponse = {
        success: true,
        challenge_ts: "2025-12-24T15:14:30.096Z",
        hostname: "localhost",
        "error-codes": [],
        action: "login",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken(
        "XXXX.DUMMY.TOKEN.XXXX",
        "192.168.1.1"
      );

      expect(result.success).toBe(true);
      expect(result.failedOpen).toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      );
    });

    it("should reject an invalid token", async () => {
      const mockResponse = {
        success: false,
        "error-codes": ["invalid-input-response"],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken("invalid-token", "192.168.1.1");

      expect(result.success).toBe(false);
      expect(result["error-codes"]).toContain("invalid-input-response");
    });

    it("should reject a duplicate/expired token", async () => {
      const mockResponse = {
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken(
        "XXXX.DUMMY.TOKEN.XXXX",
        "192.168.1.1"
      );

      expect(result.success).toBe(false);
      expect(result["error-codes"]).toContain("timeout-or-duplicate");
    });

    it("should fail open on network timeout", async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AbortError")), 100)
          )
      );

      const result = await verifyTurnstileToken(
        "XXXX.DUMMY.TOKEN.XXXX",
        "192.168.1.1"
      );

      expect(result.success).toBe(true);
      expect(result.failedOpen).toBe(true);
    });

    it("should fail open on HTTP error (5xx)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await verifyTurnstileToken(
        "XXXX.DUMMY.TOKEN.XXXX",
        "192.168.1.1"
      );

      expect(result.success).toBe(true);
      expect(result.failedOpen).toBe(true);
    });

    it("should fail open on network error", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      const result = await verifyTurnstileToken(
        "XXXX.DUMMY.TOKEN.XXXX",
        "192.168.1.1"
      );

      expect(result.success).toBe(true);
      expect(result.failedOpen).toBe(true);
    });

    it("should return error if secret key is not configured", async () => {
      delete process.env.TURNSTILE_SECRET_KEY;

      const result = await verifyTurnstileToken(
        "XXXX.DUMMY.TOKEN.XXXX",
        "192.168.1.1"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Turnstile is not configured");
      expect(result["error-codes"]).toContain("missing-secret-key");
    });

    it("should validate token input", async () => {
      let result = await verifyTurnstileToken("", "192.168.1.1");
      expect(result.success).toBe(false);
      expect(result["error-codes"]).toContain("missing-input-response");

      result = await verifyTurnstileToken("a".repeat(2049), "192.168.1.1");
      expect(result.success).toBe(false);
      expect(result["error-codes"]).toContain("invalid-input-response");
    });

    it("should include IP address in request when provided", async () => {
      const mockResponse = {
        success: true,
        challenge_ts: "2025-12-24T15:14:30.096Z",
        hostname: "localhost",
        "error-codes": [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "203.0.113.42");

      const formData = (global.fetch as jest.Mock).mock.calls[0][1]
        .body as FormData;
      expect(formData.get("remoteip")).toBe("203.0.113.42");
    });
  });

  describe("getClientIp", () => {
    it("should extract IP from CF-Connecting-IP header (Cloudflare)", () => {
      const headers = new Headers({
        "cf-connecting-ip": "203.0.113.42",
        "x-forwarded-for": "198.51.100.1, 192.0.2.1",
      });

      expect(getClientIp(headers)).toBe("203.0.113.42");
    });

    it("should extract IP from X-Forwarded-For header", () => {
      const headers = new Headers({
        "x-forwarded-for": "198.51.100.1, 192.0.2.1",
      });

      expect(getClientIp(headers)).toBe("198.51.100.1");
    });

    it("should extract IP from X-Real-IP header", () => {
      const headers = new Headers({
        "x-real-ip": "203.0.113.42",
      });

      expect(getClientIp(headers)).toBe("203.0.113.42");
    });

    it("should return 'unknown' if no IP headers present", () => {
      const headers = new Headers({});
      expect(getClientIp(headers)).toBe("unknown");
    });
  });

  describe("shouldBlockRequest", () => {
    it("should not block if token validation succeeds", () => {
      const result = {
        success: true,
        challenge_ts: "2025-12-24T15:14:30.096Z",
        hostname: "localhost",
        "error-codes": [],
      };

      expect(shouldBlockRequest(result)).toBe(false);
    });

    it("should not block if failed open (network issue)", () => {
      const result = {
        success: true,
        failedOpen: true,
      };

      expect(shouldBlockRequest(result)).toBe(false);
    });

    it("should block if token validation fails", () => {
      const result = {
        success: false,
        "error-codes": ["invalid-input-response"],
      };

      expect(shouldBlockRequest(result)).toBe(true);
    });

    it("should block if token is expired/duplicate", () => {
      const result = {
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      };

      expect(shouldBlockRequest(result)).toBe(true);
    });
  });
});
