/**
 * Fetch with timeout utility
 * Prevents infinite loading states by aborting requests that take too long
 */

export class FetchTimeoutError extends Error {
  constructor(message: string = "Request timeout") {
    super(message);
    this.name = "FetchTimeoutError";
  }
}

/**
 * Fetch with automatic timeout
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 10000ms = 10s)
 * @returns Response or throws error
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abortOnExternalSignal = () => controller.abort();
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeout);

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", abortOnExternalSignal, {
        once: true,
      });
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortOnExternalSignal);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortOnExternalSignal);

    // Check if error was due to abort (timeout)
    if (error instanceof Error && error.name === "AbortError" && didTimeout) {
      throw new FetchTimeoutError("Request timed out. Please check your connection and try again.");
    }

    // Re-throw other errors
    throw error;
  }
}
