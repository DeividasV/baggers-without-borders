/**
 * Turnstile token retrieval utilities
 *
 * Client-side helpers for extracting Cloudflare Turnstile tokens
 * from various sources (state, DOM, window.turnstile API).
 */

/**
 * Get Turnstile token from multiple sources
 *
 * Checks in order:
 * 1. Provided state token
 * 2. DOM hidden input field
 * 3. Window.turnstile API
 *
 * @param stateToken - Optional token from component state
 * @returns Turnstile token string or empty string if not found
 */
export function getTurnstileToken(stateToken?: string): string {
  // Check state token first
  const trimmedStateToken = stateToken?.trim();
  if (trimmedStateToken) return trimmedStateToken;

  // Check DOM field
  const responseField = document.querySelector(
    '[name="cf-turnstile-response"]'
  ) as HTMLInputElement | HTMLTextAreaElement | null;

  const fieldValue = responseField?.value?.trim();
  if (fieldValue) return fieldValue;

  // Check window.turnstile API
  const turnstile = (window as any)?.turnstile;
  const response = turnstile?.getResponse?.();
  return typeof response === "string" && response.trim() ? response : "";
}

/**
 * Wait for Turnstile token with polling
 *
 * @param maxMs - Maximum wait time in milliseconds (default: 10000)
 * @param stateToken - Optional token from component state
 * @returns Promise resolving to token or empty string
 */
export async function waitForTurnstileToken(
  maxMs: number = 10000,
  stateToken?: string
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const token = getTurnstileToken(stateToken);
    if (token) return token;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return "";
}

/**
 * Reset Turnstile widget
 *
 * Clears state, DOM field, and calls widget reset API
 */
export function resetTurnstile(): void {
  // Clear DOM field
  const responseField = document.querySelector(
    '[name="cf-turnstile-response"]'
  ) as HTMLInputElement | HTMLTextAreaElement | null;
  if (responseField) responseField.value = "";

  // Reset widget via API
  try {
    (window as any)?.turnstile?.reset?.();
  } catch {
    // Best-effort reset, ignore errors
  }
}
