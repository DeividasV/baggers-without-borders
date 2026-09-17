/**
 * Mock Fetch Utilities
 * Provides consistent fetch mocking for component tests
 */

type MockResponse = {
  data?: any;
  total?: number;
  pages?: number;
  backups?: any[];
  stats?: any;
  [key: string]: any;
};

type MockOptions = {
  status?: number;
  ok?: boolean;
  delay?: number;
};

/**
 * Mock a successful API response
 */
export function mockApiSuccess(
  endpoint: string | RegExp,
  responseData: MockResponse,
  options: MockOptions = {}
) {
  const { status = 200, ok = true, delay = 0 } = options;

  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    const matches =
      typeof endpoint === "string"
        ? url.includes(endpoint)
        : endpoint.test(url);

    if (matches) {
      const response = Promise.resolve({
        ok,
        status,
        json: async () => responseData,
        text: async () => JSON.stringify(responseData),
      });

      return delay > 0
        ? new Promise((resolve) => setTimeout(() => resolve(response), delay))
        : response;
    }

    // Return unhandled fetch error
    return Promise.reject(new Error(`Unmocked fetch call: ${url}`));
  });
}

/**
 * Mock an API error response
 */
export function mockApiError(
  endpoint: string | RegExp,
  error: string | Error = "Network error",
  options: MockOptions = {}
) {
  const { delay = 0 } = options;

  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    const matches =
      typeof endpoint === "string"
        ? url.includes(endpoint)
        : endpoint.test(url);

    if (matches) {
      const rejection = Promise.reject(
        typeof error === "string" ? new Error(error) : error
      );

      return delay > 0
        ? new Promise((_, reject) => setTimeout(() => reject(rejection), delay))
        : rejection;
    }

    return Promise.reject(new Error(`Unmocked fetch call: ${url}`));
  });
}

/**
 * Mock multiple endpoints with different responses
 */
export function mockMultipleEndpoints(
  endpoints: Array<{
    endpoint: string | RegExp;
    response: MockResponse;
    options?: MockOptions;
  }>
) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    for (const { endpoint, response, options = {} } of endpoints) {
      const matches =
        typeof endpoint === "string"
          ? url.includes(endpoint)
          : endpoint.test(url);

      if (matches) {
        const { status = 200, ok = true, delay = 0 } = options;

        const mockResponse = Promise.resolve({
          ok,
          status,
          json: async () => response,
          text: async () => JSON.stringify(response),
        });

        return delay > 0
          ? new Promise((resolve) =>
              setTimeout(() => resolve(mockResponse), delay)
            )
          : mockResponse;
      }
    }

    return Promise.reject(new Error(`Unmocked fetch call: ${url}`));
  });
}

/**
 * Mock a paginated API response
 */
export function mockPaginatedResponse(
  endpoint: string | RegExp,
  data: any[],
  options: {
    page?: number;
    limit?: number;
    total?: number;
    status?: number;
  } = {}
) {
  const { page = 1, limit = 20, total = data.length, status = 200 } = options;

  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);

  mockApiSuccess(
    endpoint,
    {
      data: paginatedData,
      total,
      pages,
    },
    { status }
  );
}

/**
 * Setup fetch mock to track calls but return default success
 */
export function setupFetchMock() {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0 }),
      text: async () => JSON.stringify({ data: [], total: 0 }),
    } as Response)
  );
}

/**
 * Reset fetch mock between tests
 */
export function resetFetchMock() {
  if (global.fetch && typeof global.fetch === "function") {
    (global.fetch as jest.Mock).mockReset();
  }
}

/**
 * Verify fetch was called with URL containing substring
 */
export function expectFetchCalledWith(urlSubstring: string) {
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining(urlSubstring)
  );
}

/**
 * Verify fetch was called with URL matching pattern
 */
export function expectFetchCalledWithPattern(pattern: RegExp) {
  const calls = (global.fetch as jest.Mock).mock.calls;
  const matchingCall = calls.some((call) => pattern.test(call[0]));
  expect(matchingCall).toBe(true);
}
