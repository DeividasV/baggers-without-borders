/**
 * Cloudflare Turnstile CAPTCHA Integration
 *
 * Server-side token verification utility with fail-open error handling
 * to prevent blocking legitimate users during API outages.
 *
 * Test keys for CI/CD:
 * - Always pass: 1x0000000000000000000000000000000AA
 * - Always fail: 2x0000000000000000000000000000000AA
 * - Duplicate error: 3x0000000000000000000000000000000AA
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VALIDATION_TIMEOUT = 10000; // 10 seconds

export interface TurnstileValidationResult {
  success: boolean;
  failedOpen?: boolean; // True if validation failed due to network/timeout (fail-open strategy)
  error?: string;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Verify Turnstile token with Cloudflare Siteverify API
 *
 * @param token - The token from cf-turnstile-response
 * @param remoteip - Visitor's IP address (optional but recommended)
 * @returns Validation result with fail-open behavior for network errors
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<TurnstileValidationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY is not configured");
    return {
      success: false,
      error: "Turnstile is not configured",
      "error-codes": ["missing-secret-key"],
    };
  }

  // Input validation
  if (!token || typeof token !== "string") {
    return {
      success: false,
      error: "Invalid token format",
      "error-codes": ["missing-input-response"],
    };
  }

  if (token.length > 2048) {
    return {
      success: false,
      error: "Token too long",
      "error-codes": ["invalid-input-response"],
    };
  }

  // Prepare request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT);

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);

    if (remoteip) {
      formData.append("remoteip", remoteip);
    }

    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      // Network/HTTP error - fail open
      console.warn(
        `Turnstile API returned ${response.status}: Failing open to allow request`
      );
      return {
        success: true,
        failedOpen: true,
      };
    }

    const result = await response.json();

    // Log failures for monitoring
    if (!result.success) {
      console.warn("Turnstile validation failed:", {
        "error-codes": result["error-codes"],
        hostname: result.hostname,
        action: result.action,
      });
    }

    return result;
  } catch (error) {
    // Network timeout or fetch error - fail open with logging
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.warn(
          "Turnstile validation timeout: Failing open to allow request"
        );
      } else {
        console.error("Turnstile validation error:", error.message);
      }
    }

    // Fail open: Allow the request when Turnstile API is unreachable
    return {
      success: true,
      failedOpen: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract IP address from Next.js request headers
 * Checks multiple headers commonly used by proxies/CDNs
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-forwarded-for")?.split(",")[0].trim() || // Standard proxy header
    headers.get("x-real-ip") || // Nginx proxy
    "unknown"
  );
}

/**
 * Helper to check if Turnstile validation should block the request
 * Returns true if request should be blocked (explicit bot detection)
 * Returns false if request should be allowed (valid token or fail-open)
 */
export function shouldBlockRequest(result: TurnstileValidationResult): boolean {
  // Allow requests that failed open (network issues)
  if (result.failedOpen) {
    return false;
  }

  // Block requests with explicit validation failures
  return !result.success;
}
