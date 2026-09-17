/**
 * Turnstile Test Keys Validation
 * Tests that verify test keys behave correctly with expected error codes
 */

import { verifyTurnstileToken, shouldBlockRequest } from "@/src/lib/turnstile";

// Mock fetch globally
global.fetch = jest.fn();

describe("Turnstile Test Keys Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Test Key: Always Pass (1x0000...AA)", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    });

    it("should always pass validation with test key 1x0000...AA", async () => {
      const mockResponse = {
        success: true,
        challenge_ts: "2025-12-24T15:14:30.096Z",
        hostname: "localhost",
        "error-codes": [],
        action: "test",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "192.168.1.1");

      expect(result.success).toBe(true);
      expect(result["error-codes"]).toEqual([]);
      expect(shouldBlockRequest(result)).toBe(false);
    });
  });

  describe("Test Key: Always Fail (2x0000...AA)", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "2x0000000000000000000000000000000AA";
    });

    it("should always fail validation with test key 2x0000...AA", async () => {
      const mockResponse = {
        success: false,
        "error-codes": ["invalid-input-response"],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "192.168.1.1");

      expect(result.success).toBe(false);
      expect(result["error-codes"]).toContain("invalid-input-response");
      expect(shouldBlockRequest(result)).toBe(true);
    });

    it("should block request when using always-fail test key", async () => {
      const mockResponse = {
        success: false,
        "error-codes": ["invalid-input-response"],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "192.168.1.1");

      // Verify the request should be blocked
      expect(shouldBlockRequest(result)).toBe(true);
      expect(result.failedOpen).toBeUndefined();
    });
  });

  describe("Test Key: Duplicate Token (3x0000...AA)", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "3x0000000000000000000000000000000AA";
    });

    it("should return timeout-or-duplicate error with test key 3x0000...AA", async () => {
      const mockResponse = {
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "192.168.1.1");

      expect(result.success).toBe(false);
      expect(result["error-codes"]).toContain("timeout-or-duplicate");
      expect(shouldBlockRequest(result)).toBe(true);
    });
  });

  describe("Production Key Validation", () => {
    // NOTE: the key used below is a deliberately fake placeholder. A real
    // Turnstile secret must never be committed. verifyTurnstileToken() does not
    // validate key shape and fetch is mocked here, so the assertions below are
    // unaffected by using a placeholder.
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "0x4AAFAKEfakeFAKEfakeFAKEfakeFAKE";
    });

    it("should reject dummy token when using production secret key", async () => {
      // Production keys reject dummy tokens from test sitekeys
      const mockResponse = {
        success: false,
        "error-codes": ["invalid-input-response"],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "192.168.1.1");

      expect(result.success).toBe(false);
      expect(result["error-codes"]).toContain("invalid-input-response");
    });
  });

  describe("Domain Mismatch Error (110200)", () => {
    it("should fail when sitekey domain doesn't match request origin", async () => {
      // Simulate 400 error response from Cloudflare (domain not allowed)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          "error-codes": ["invalid-domain"],
        }),
      });

      const result = await verifyTurnstileToken("real-token-from-wrong-domain", "192.168.1.1");

      // Should fail open (allow request but log warning)
      expect(result.success).toBe(true);
      expect(result.failedOpen).toBe(true);
    });
  });

  describe("Invalid Secret Key", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "invalid-secret-key-format";
    });

    it("should return error for invalid secret key format", async () => {
      const mockResponse = {
        success: false,
        "error-codes": ["invalid-input-secret"],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "192.168.1.1");

      expect(result.success).toBe(false);
      expect(result["error-codes"]).toContain("invalid-input-secret");
      expect(shouldBlockRequest(result)).toBe(true);
    });
  });

  describe("Error Code Interpretation", () => {
    it("should correctly identify bot detection vs system errors", async () => {
      const botDetected = {
        success: false,
        "error-codes": ["invalid-input-response"],
      };

      const systemError = {
        success: true,
        failedOpen: true,
      };

      expect(shouldBlockRequest(botDetected)).toBe(true); // Block bot
      expect(shouldBlockRequest(systemError)).toBe(false); // Allow during system error
    });

    it("should block expired/duplicate tokens", async () => {
      const expiredToken = {
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      };

      expect(shouldBlockRequest(expiredToken)).toBe(true);
    });

    it("should not block on network failures (fail-open)", async () => {
      const networkFailure = {
        success: true,
        failedOpen: true,
      };

      expect(shouldBlockRequest(networkFailure)).toBe(false);
    });
  });

  describe("Test Keys vs Production Keys Behavior", () => {
    it("test keys should accept dummy tokens", async () => {
      process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

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

      const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "127.0.0.1");

      expect(result.success).toBe(true);
    });

    it("production keys should reject dummy tokens", async () => {
      process.env.TURNSTILE_SECRET_KEY = "0x4AAFAKEfakeFAKEfakeFAKEfakeFAKE";

      const mockResponse = {
        success: false,
        "error-codes": ["invalid-input-response"],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "127.0.0.1");

      expect(result.success).toBe(false);
      expect(result["error-codes"]).toContain("invalid-input-response");
    });
  });

  describe("All Error Codes Coverage", () => {
    const errorCodeTests = [
      {
        code: "missing-input-secret",
        description: "Secret key not provided",
        shouldBlock: true,
      },
      {
        code: "invalid-input-secret",
        description: "Invalid or expired secret key",
        shouldBlock: true,
      },
      {
        code: "missing-input-response",
        description: "Token not provided",
        shouldBlock: true,
      },
      {
        code: "invalid-input-response",
        description: "Invalid, malformed, or expired token",
        shouldBlock: true,
      },
      {
        code: "bad-request",
        description: "Request is malformed",
        shouldBlock: true,
      },
      {
        code: "timeout-or-duplicate",
        description: "Token already validated or expired",
        shouldBlock: true,
      },
      {
        code: "internal-error",
        description: "Cloudflare internal error",
        shouldBlock: true,
      },
    ];

    errorCodeTests.forEach(({ code, description, shouldBlock }) => {
      it(`should handle error code: ${code} (${description})`, async () => {
        const mockResponse = {
          success: false,
          "error-codes": [code],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", "192.168.1.1");

        expect(result.success).toBe(false);
        expect(result["error-codes"]).toContain(code);
        expect(shouldBlockRequest(result)).toBe(shouldBlock);
      });
    });
  });
});
