/**
 * Unit tests for useUserManagement hook
 *
 * Tests user data fetching, filtering, pagination, and URL synchronization.
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { useUsers, useCountries } from "@/src/lib/hooks/useUserManagement";
import { useSearchParams, useRouter } from "next/navigation";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("useUsers Hook", () => {
  const mockRouter = {
    replace: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  const mockUsersResponse = {
    users: [
      {
        id: "1",
        username: "user1",
        givenName: "John",
        familyName: "Doe",
        email: "john@example.com",
        role: "USER",
        status: "ACTIVE",
      },
      {
        id: "2",
        username: "user2",
        givenName: "Jane",
        familyName: "Smith",
        email: "jane@example.com",
        role: "ADMIN",
        status: "ACTIVE",
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      totalCount: 2,
      totalPages: 1,
      hasMore: false,
    },
    stats: {
      activeCount: 2,
      adminCount: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsersResponse,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize with empty state and fetch users", async () => {
      const { result } = renderHook(() => useUsers());

      expect(result.current.loading).toBe(true);
      expect(result.current.users).toEqual([]);
      expect(result.current.searchMode).toBe("simple");

      // Advance timers to trigger the debounced fetch
      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.users).toHaveLength(2);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users?page=1&limit=20"),
        expect.any(Object)
      );
    });

    it("should initialize basic search from URL params", () => {
      mockSearchParams.get.mockImplementation((key: string) =>
        key === "search" ? "test query" : null
      );

      const { result } = renderHook(() => useUsers());

      expect(result.current.basicSearch).toBe("test query");
      expect(result.current.searchMode).toBe("simple");
    });

    it("should initialize pagination from URL params", () => {
      mockSearchParams.get.mockImplementation((key: string) =>
        key === "page" ? "3" : null
      );

      const { result } = renderHook(() => useUsers());

      expect(result.current.pagination.page).toBe(3);
    });

    it("should auto-set to advanced mode when advanced filters are in URL", () => {
      mockSearchParams.get.mockImplementation((key: string) =>
        key === "givenName" ? "John" : null
      );

      const { result } = renderHook(() => useUsers());

      expect(result.current.searchMode).toBe("advanced");
    });

    it("should initialize advanced filters from URL params", () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        const params: Record<string, string> = {
          givenName: "John",
          familyName: "Doe",
          email: "john@example.com",
          gender: "M",
          role: "ADMIN",
          status: "ACTIVE",
        };
        return params[key] || null;
      });

      const { result } = renderHook(() => useUsers());

      expect(result.current.advancedFilters.givenName).toBe("John");
      expect(result.current.advancedFilters.familyName).toBe("Doe");
      expect(result.current.advancedFilters.email).toBe("john@example.com");
      expect(result.current.advancedFilters.gender).toBe("M");
      expect(result.current.advancedFilters.role).toBe("ADMIN");
      expect(result.current.advancedFilters.status).toBe("ACTIVE");
    });

    it("should initialize country arrays from URL params", () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === "birthCountries") return "GB,US,FR";
        if (key === "residenceCountries") return "DE,IT";
        return null;
      });

      const { result } = renderHook(() => useUsers());

      expect(result.current.advancedFilters.birthCountry).toEqual([
        "GB",
        "US",
        "FR",
      ]);
      expect(result.current.advancedFilters.residenceCountry).toEqual([
        "DE",
        "IT",
      ]);
    });
  });

  describe("Basic Search", () => {
    it("should update basic search and trigger fetch", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setBasicSearch("john");
      });

      // Should trigger a fetch after debounce
      await waitFor(
        () => {
          expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("search=john"),
            expect.any(Object)
          );
        },
        { timeout: 500 }
      );
    });

    it("should debounce text input changes", async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialFetchCount = (fetch as jest.Mock).mock.calls.length;

      act(() => {
        result.current.setBasicSearch("j");
        result.current.setBasicSearch("jo");
        result.current.setBasicSearch("joh");
        result.current.setBasicSearch("john");
      });

      // Should not fetch immediately
      expect((fetch as jest.Mock).mock.calls.length).toBe(initialFetchCount);

      // Fast-forward 300ms
      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect((fetch as jest.Mock).mock.calls.length).toBe(
          initialFetchCount + 1
        );
      });

      jest.useRealTimers();
    });

    it("should trim whitespace from search query", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setBasicSearch("  john  ");
      });

      await waitFor(
        () => {
          expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("search=john"),
            expect.any(Object)
          );
          expect(fetch).not.toHaveBeenCalledWith(
            expect.stringContaining("search=%20%20john"),
            expect.any(Object)
          );
        },
        { timeout: 500 }
      );
    });
  });

  describe("Advanced Filters", () => {
    it("should update advanced filters and trigger fetch", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearchMode("advanced");
        result.current.setAdvancedFilters({
          ...result.current.advancedFilters,
          givenName: "John",
          role: "ADMIN",
        });
      });

      await waitFor(
        () => {
          expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("givenName=John"),
            expect.any(Object)
          );
          expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("role=ADMIN"),
            expect.any(Object)
          );
        },
        { timeout: 500 }
      );
    });

    it("should support function updater for advanced filters", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setAdvancedFilters((prev) => ({
          ...prev,
          givenName: "Jane",
        }));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.advancedFilters.givenName).toBe("Jane");
      });
    });

    it("should send country filters as multiple params", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearchMode("advanced");
        result.current.setAdvancedFilters({
          ...result.current.advancedFilters,
          birthCountry: ["GB", "US"],
        });
      });

      await waitFor(
        () => {
          const lastCall = (fetch as jest.Mock).mock.calls[
            (fetch as jest.Mock).mock.calls.length - 1
          ][0];
          expect(lastCall).toContain("birthCountry=GB");
          expect(lastCall).toContain("birthCountry=US");
        },
        { timeout: 500 }
      );
    });
  });

  describe("Search Mode Switching", () => {
    it("should switch between simple and advanced modes", () => {
      const { result } = renderHook(() => useUsers());

      expect(result.current.searchMode).toBe("simple");

      act(() => {
        result.current.setSearchMode("advanced");
      });

      expect(result.current.searchMode).toBe("advanced");

      act(() => {
        result.current.setSearchMode("simple");
      });

      expect(result.current.searchMode).toBe("simple");
    });

    it("should only send filters from active search mode", async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useUsers());

      // Wait for initial load
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear initial fetch calls
      (fetch as jest.Mock).mockClear();

      // Set simple search
      act(() => {
        result.current.setBasicSearch("simple query");
      });

      // Fast-forward debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Verify simple search was sent
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const simpleSearchCall = (fetch as jest.Mock).mock.calls.find((call) =>
        call[0].includes("search=simple")
      );
      expect(simpleSearchCall).toBeDefined();
      expect(simpleSearchCall![0]).not.toContain("givenName");

      // Clear calls again
      (fetch as jest.Mock).mockClear();

      // Switch to advanced mode with filters
      act(() => {
        result.current.setSearchMode("advanced");
        result.current.setAdvancedFilters({
          ...result.current.advancedFilters,
          givenName: "John",
        });
      });

      // Fast-forward debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should now send advanced filters, not simple search
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const advancedCall = (fetch as jest.Mock).mock.calls.find((call) =>
          call[0].includes("givenName=John")
        );
        expect(advancedCall).toBeDefined();
        expect(advancedCall![0]).not.toContain("search=");
      });

      jest.useRealTimers();
    });
  });

  describe("Pagination", () => {
    it("should update pagination and trigger fetch", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPagination({ ...result.current.pagination, page: 2 });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("page=2"),
          expect.any(Object)
        );
      });
    });

    it("should support function updater for pagination", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPagination((prev) => ({ ...prev, page: 3 }));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(3);
      });
    });

    it("should update pagination state from API response", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 20,
        totalCount: 2,
        totalPages: 1,
        hasMore: false,
      });
    });

    it("should not debounce pagination changes", async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialFetchCount = (fetch as jest.Mock).mock.calls.length;

      act(() => {
        result.current.setPagination({ ...result.current.pagination, page: 2 });
      });

      // Should fetch immediately (no debounce)
      act(() => {
        jest.advanceTimersByTime(0);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect((fetch as jest.Mock).mock.calls.length).toBe(
          initialFetchCount + 1
        );
      });

      jest.useRealTimers();
    });
  });

  describe("URL Synchronization", () => {
    it("should update URL with search params", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setBasicSearch("test");
      });

      // Wait for debounce and URL update
      await waitFor(
        () => {
          expect(mockRouter.replace).toHaveBeenCalledWith(
            expect.stringContaining("search=test"),
            expect.objectContaining({ scroll: false })
          );
        },
        { timeout: 500 }
      );
    });

    it("should update URL with pagination", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPagination({ ...result.current.pagination, page: 3 });
      });

      // Pagination updates should happen immediately
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          expect.stringContaining("page=3"),
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it("should not include page=1 in URL", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial load with page=1 should result in URL without page param
      // The URL should be either "/admin/users" or have params without page=1
      const urlCalls = mockRouter.replace.mock.calls;
      expect(urlCalls.length).toBeGreaterThan(0);
      // Verify that page=1 is not in any URL calls (it should be omitted)
      const hasPage1 = urlCalls.some((call) => call[0].includes("page=1"));
      expect(hasPage1).toBe(false);
    });

    it("should update URL with advanced filters", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearchMode("advanced");
        result.current.setAdvancedFilters({
          ...result.current.advancedFilters,
          givenName: "John",
          role: "ADMIN",
        });
      });

      await waitFor(
        () => {
          const calls = mockRouter.replace.mock.calls;
          const urlsWithFilters = calls
            .map((c) => c[0])
            .filter(
              (url) =>
                url.includes("givenName=John") && url.includes("role=ADMIN")
            );
          expect(urlsWithFilters.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );
    });

    it("should encode country arrays in URL", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearchMode("advanced");
        result.current.setAdvancedFilters({
          ...result.current.advancedFilters,
          birthCountry: ["GB", "US"],
        });
      });

      await waitFor(
        () => {
          const calls = mockRouter.replace.mock.calls;
          const urlsWithCountries = calls
            .map((c) => c[0])
            .filter(
              (url) => url.includes("birthCountries=GB") && url.includes("US")
            );
          expect(urlsWithCountries.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );
    });
  });

  describe("Stats and Response Handling", () => {
    it("should update stats from API response", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        activeCount: 2,
        adminCount: 1,
      });
    });

    it("should handle fetch errors gracefully", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleError).toHaveBeenCalledWith(
        "Error fetching users:",
        expect.any(Error)
      );
      expect(result.current.users).toEqual([]);

      consoleError.mockRestore();
    });

    it("should handle non-ok responses", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.users).toEqual([]);
    });
  });

  describe("Request Cancellation", () => {
    it("should create AbortController for requests", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify that fetch was called with an abort signal
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it("should handle abort errors silently", async () => {
      const consoleLog = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      (fetch as jest.Mock).mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleLog).toHaveBeenCalledWith("Fetch aborted");
      consoleLog.mockRestore();
    });
  });

  describe("refetchUsers", () => {
    it("should manually trigger user fetch", async () => {
      const { result } = renderHook(() => useUsers());

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const fetchCountBefore = (fetch as jest.Mock).mock.calls.length;

      act(() => {
        result.current.refetchUsers();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect((fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
          fetchCountBefore
        );
      });
    });
  });
});

describe("useCountries Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should fetch countries on mount", async () => {
    const mockCountries = [
      { code: "GB", name: "United Kingdom" },
      { code: "US", name: "United States" },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountries,
    });

    const { result } = renderHook(() => useCountries());

    expect(result.current).toEqual([]);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current).toEqual(mockCountries);
    });

    expect(fetch).toHaveBeenCalledWith("/api/countries");
  });

  it("should only fetch countries once", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { rerender } = renderHook(() => useCountries());

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Rerender should not trigger another fetch
    rerender();
    rerender();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle fetch errors", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCountries());

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Error fetching countries:",
        expect.any(Error)
      );
    });

    expect(result.current).toEqual([]);
    consoleError.mockRestore();
  });

  it("should handle non-array response", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: "Invalid response" }),
    });

    const { result } = renderHook(() => useCountries());

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it("should handle non-ok response", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useCountries());

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    consoleError.mockRestore();
  });
});
