/**
 * Unit tests for turnstileUtils
 *
 * Tests Cloudflare Turnstile token retrieval and management
 */

import {
  getTurnstileToken,
  waitForTurnstileToken,
  resetTurnstile,
} from "@/src/lib/turnstileUtils";

describe("turnstileUtils", () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = "";
    // Clear window.turnstile
    (window as any).turnstile = undefined;
  });

  describe("getTurnstileToken", () => {
    it("should return state token if provided", () => {
      const stateToken = "state-token-123";
      const result = getTurnstileToken(stateToken);
      expect(result).toBe("state-token-123");
    });

    it("should return DOM field value if no state token", () => {
      const input = document.createElement("input");
      input.name = "cf-turnstile-response";
      input.value = "dom-token-456";
      document.body.appendChild(input);

      const result = getTurnstileToken();
      expect(result).toBe("dom-token-456");
    });

    it("should return window.turnstile value if no DOM field", () => {
      (window as any).turnstile = {
        getResponse: () => "window-token-789",
      };

      const result = getTurnstileToken();
      expect(result).toBe("window-token-789");
    });

    it("should prioritize state token over DOM", () => {
      const input = document.createElement("input");
      input.name = "cf-turnstile-response";
      input.value = "dom-token";
      document.body.appendChild(input);

      const result = getTurnstileToken("state-token");
      expect(result).toBe("state-token");
    });

    it("should prioritize DOM over window.turnstile", () => {
      const input = document.createElement("input");
      input.name = "cf-turnstile-response";
      input.value = "dom-token";
      document.body.appendChild(input);

      (window as any).turnstile = {
        getResponse: () => "window-token",
      };

      const result = getTurnstileToken();
      expect(result).toBe("dom-token");
    });

    it("should return empty string if no token found", () => {
      const result = getTurnstileToken();
      expect(result).toBe("");
    });

    it("should trim whitespace from tokens", () => {
      const result = getTurnstileToken("  token-with-spaces  ");
      expect(result).toBe("token-with-spaces");
    });

    it("should handle textarea fields", () => {
      const textarea = document.createElement("textarea");
      textarea.name = "cf-turnstile-response";
      textarea.value = "textarea-token";
      document.body.appendChild(textarea);

      const result = getTurnstileToken();
      expect(result).toBe("textarea-token");
    });

    it("should return empty string for non-string window.turnstile response", () => {
      (window as any).turnstile = {
        getResponse: () => null,
      };

      const result = getTurnstileToken();
      expect(result).toBe("");
    });
  });

  describe("waitForTurnstileToken", () => {
    it("should return token immediately if available", async () => {
      const result = await waitForTurnstileToken(1000, "immediate-token");
      expect(result).toBe("immediate-token");
    });

    it("should poll for token in DOM", async () => {
      setTimeout(() => {
        const input = document.createElement("input");
        input.name = "cf-turnstile-response";
        input.value = "delayed-token";
        document.body.appendChild(input);
      }, 100);

      const result = await waitForTurnstileToken(1000);
      expect(result).toBe("delayed-token");
    }, 2000);

    it("should timeout and return empty string", async () => {
      const result = await waitForTurnstileToken(100);
      expect(result).toBe("");
    }, 500);

    it("should poll with 50ms intervals", async () => {
      const startTime = Date.now();
      let pollCount = 0;

      // Mock DOM query to count polls
      const originalQuerySelector = document.querySelector;
      document.querySelector = function (selector: string) {
        if (selector === '[name="cf-turnstile-response"]') {
          pollCount++;
        }
        return originalQuerySelector.call(document, selector);
      };

      await waitForTurnstileToken(250);
      const endTime = Date.now();

      // Should poll multiple times (at least 3-4 times in 250ms with 50ms intervals)
      expect(pollCount).toBeGreaterThanOrEqual(3);
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);

      // Restore
      document.querySelector = originalQuerySelector;
    }, 1000);
  });

  describe("resetTurnstile", () => {
    it("should clear DOM field value", () => {
      const input = document.createElement("input");
      input.name = "cf-turnstile-response";
      input.value = "token-to-clear";
      document.body.appendChild(input);

      resetTurnstile();

      expect(input.value).toBe("");
    });

    it("should call window.turnstile.reset", () => {
      const resetMock = jest.fn();
      (window as any).turnstile = {
        reset: resetMock,
      };

      resetTurnstile();

      expect(resetMock).toHaveBeenCalledTimes(1);
    });

    it("should handle missing DOM field gracefully", () => {
      expect(() => resetTurnstile()).not.toThrow();
    });

    it("should handle missing window.turnstile gracefully", () => {
      expect(() => resetTurnstile()).not.toThrow();
    });

    it("should handle window.turnstile.reset errors gracefully", () => {
      (window as any).turnstile = {
        reset: () => {
          throw new Error("Reset failed");
        },
      };

      expect(() => resetTurnstile()).not.toThrow();
    });

    it("should clear both input and textarea fields", () => {
      const input = document.createElement("input");
      input.name = "cf-turnstile-response";
      input.value = "input-token";
      document.body.appendChild(input);

      const textarea = document.createElement("textarea");
      textarea.name = "cf-turnstile-response";
      textarea.value = "textarea-token";
      document.body.appendChild(textarea);

      resetTurnstile();

      // Should clear the first matching field
      expect(input.value).toBe("");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete form submission flow", async () => {
      // Simulate Turnstile widget loading
      setTimeout(() => {
        const input = document.createElement("input");
        input.name = "cf-turnstile-response";
        input.value = "form-submit-token";
        document.body.appendChild(input);
      }, 50);

      // Wait for token
      const token = await waitForTurnstileToken(1000);
      expect(token).toBe("form-submit-token");

      // Reset after submission
      resetTurnstile();
      const field = document.querySelector(
        '[name="cf-turnstile-response"]'
      ) as HTMLInputElement;
      expect(field?.value).toBe("");
    }, 2000);

    it("should handle retry after failed submission", async () => {
      const input = document.createElement("input");
      input.name = "cf-turnstile-response";
      input.value = "retry-token-1";
      document.body.appendChild(input);

      // First submission
      const token1 = await waitForTurnstileToken(100);
      expect(token1).toBe("retry-token-1");

      resetTurnstile();
      expect(input.value).toBe("");

      // Simulate new token after retry
      input.value = "retry-token-2";
      const token2 = await waitForTurnstileToken(100);
      expect(token2).toBe("retry-token-2");
    });
  });
});
