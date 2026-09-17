jest.mock("@/src/lib/fetchWithTimeout", () => {
  class MockFetchTimeoutError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "FetchTimeoutError";
    }
  }

  return {
    FetchTimeoutError: MockFetchTimeoutError,
    fetchWithTimeout: jest.fn(),
  };
});

import { requestChangeRequestJson } from "@/src/lib/changeRequestClient";
import { fetchWithTimeout, FetchTimeoutError } from "@/src/lib/fetchWithTimeout";

describe("changeRequestClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not retry caller abort errors", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    (fetchWithTimeout as jest.Mock).mockRejectedValueOnce(abortError);

    await expect(
      requestChangeRequestJson("/api/change-requests", {}, { retryCount: 1, retryDelayMs: 0 })
    ).rejects.toBe(abortError);

    expect(fetchWithTimeout).toHaveBeenCalledTimes(1);
  });

  it("retries timeout failures once", async () => {
    (fetchWithTimeout as jest.Mock)
      .mockRejectedValueOnce(new FetchTimeoutError("Timed out"))
      .mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "application/json",
        },
        json: async () => ({ data: "ok" }),
      });

    await expect(
      requestChangeRequestJson<{ data: string }>(
        "/api/change-requests",
        {},
        { retryCount: 1, retryDelayMs: 0 }
      )
    ).resolves.toEqual({ data: "ok" });

    expect(fetchWithTimeout).toHaveBeenCalledTimes(2);
  });
});
