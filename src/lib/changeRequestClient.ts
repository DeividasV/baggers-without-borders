import { FetchTimeoutError, fetchWithTimeout } from "@/src/lib/fetchWithTimeout";

const DEFAULT_CHANGE_REQUEST_TIMEOUT_MS = 12000;
const DEFAULT_RETRY_DELAY_MS = 600;

type RequestChangeJsonOptions = {
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  fallbackMessage?: string;
};

class ChangeRequestClientError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, options?: { status?: number; retryable?: boolean }) {
    super(message);
    this.name = "ChangeRequestClientError";
    this.status = options?.status;
    this.retryable = options?.retryable ?? false;
  }
}

function isJsonResponse(response: Response): boolean {
  const headerValue =
    typeof response.headers?.get === "function" ? response.headers.get("content-type") : null;

  if (!headerValue) {
    return true;
  }

  return headerValue.includes("application/json");
}

async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  if (!isJsonResponse(response)) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function getErrorMessage(
  response: Response,
  payload: unknown,
  fallbackMessage: string
): ChangeRequestClientError {
  const data =
    payload && typeof payload === "object"
      ? (payload as { error?: string; details?: string; message?: string })
      : null;

  const message = data?.error || data?.message || data?.details || fallbackMessage;
  const retryable = response.status === 408 || response.status === 429 || response.status >= 500;

  return new ChangeRequestClientError(message, {
    status: response.status,
    retryable,
  });
}

function shouldRetry(error: unknown, attemptsLeft: number): boolean {
  if (attemptsLeft <= 0) {
    return false;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return false;
  }

  if (error instanceof FetchTimeoutError) {
    return true;
  }

  if (error instanceof ChangeRequestClientError) {
    return error.retryable;
  }

  return error instanceof Error;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getChangeRequestErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof FetchTimeoutError) {
    return error.message;
  }

  if (error instanceof ChangeRequestClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export async function requestChangeRequestJson<T>(
  url: string,
  init: RequestInit = {},
  options: RequestChangeJsonOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_CHANGE_REQUEST_TIMEOUT_MS;
  const retryCount = options.retryCount ?? 0;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const fallbackMessage = options.fallbackMessage || "Unable to complete this request right now.";

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs);
      const payload = await parseJsonSafely<
        T | { error?: string; details?: string; message?: string }
      >(response);

      if (!response.ok) {
        throw getErrorMessage(response, payload, fallbackMessage);
      }

      return (payload ?? ({} as T)) as T;
    } catch (error) {
      if (!shouldRetry(error, retryCount - attempt)) {
        throw error;
      }

      await delay(retryDelayMs * (attempt + 1));
    }
  }

  throw new ChangeRequestClientError(fallbackMessage);
}
