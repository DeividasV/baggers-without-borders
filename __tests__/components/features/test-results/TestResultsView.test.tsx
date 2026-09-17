import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@/__tests__/utils/test-utils";
import TestResultsView from "@/app/components/features/test-results/TestResultsView";

// Mock fetch globally
global.fetch = jest.fn();

const mockTestData = {
  data: {
    numTotalTests: 100,
    numPassedTests: 85,
    numFailedTests: 10,
    numPendingTests: 5,
    numTotalTestSuites: 20,
    numPassedTestSuites: 17,
    numFailedTestSuites: 2,
    numPendingTestSuites: 1,
    startTime: Date.now() - 10000,
    testResults: [
      {
        name: "__tests__/components/features/members/MemberList.test.tsx",
        numFailingTests: 2,
        numPassingTests: 8,
        numPendingTests: 0,
        perfStats: {
          start: 1000,
          end: 3500,
          runtime: 2500,
        },
        testResults: [
          {
            ancestorTitles: ["MemberList"],
            title: "renders correctly",
            status: "passed" as const,
            duration: 150,
          },
          {
            ancestorTitles: ["MemberList"],
            title: "handles error",
            status: "failed" as const,
            duration: 200,
            failureMessages: ["Test failed"],
          },
        ],
      },
      {
        name: "__tests__/components/features/hofs/HofList.test.tsx",
        numFailingTests: 0,
        numPassingTests: 15,
        numPendingTests: 2,
        perfStats: {
          start: 4000,
          end: 7000,
          runtime: 3000,
        },
        testResults: [
          {
            ancestorTitles: ["HofList"],
            title: "displays hofs",
            status: "passed" as const,
            duration: 100,
          },
          {
            ancestorTitles: ["HofList"],
            title: "future test",
            status: "pending" as const,
            duration: 0,
          },
        ],
      },
      {
        name: "__tests__/api/members/route.test.tsx",
        numFailingTests: 8,
        numPassingTests: 5,
        numPendingTests: 1,
        perfStats: {
          start: 8000,
          end: 11000,
          runtime: 3000,
        },
        testResults: [
          {
            ancestorTitles: ["API", "Members"],
            title: "returns 200",
            status: "passed" as const,
            duration: 50,
          },
          {
            ancestorTitles: ["API", "Members"],
            title: "validates input",
            status: "failed" as const,
            duration: 75,
            failureMessages: ["Validation failed"],
          },
        ],
      },
    ],
  },
  lastRun: new Date().toISOString(),
};

describe("TestResultsView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTestData,
    });
  });

  describe("Loading State", () => {
    it("shows loading spinner initially", () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockTestData,
                }),
              100
            );
          })
      );

      render(<TestResultsView />);

      expect(screen.getByText("Loading test results...")).toBeInTheDocument();
    });

    it("shows loading icon", () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockTestData,
                }),
              100
            );
          })
      );

      const { container } = render(<TestResultsView />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("fetches test results on mount", async () => {
      render(<TestResultsView />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/admin/test-results");
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message when fetch fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Failed to load test results" }),
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(
          screen.getByText("Error Loading Test Results")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Failed to load test results")
        ).toBeInTheDocument();
      });
    });

    it("displays generic error message when error has no message", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(<TestResultsView />);

      await waitFor(() => {
        expect(
          screen.getByText("Error Loading Test Results")
        ).toBeInTheDocument();
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("shows 'Try Again' button on error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Failed to load test results" }),
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });
    });

    it("retries fetching when 'Try Again' is clicked", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Failed to load test results" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTestData,
        });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText("Try Again");
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByText("Testing Results")).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Data Display", () => {
    beforeEach(async () => {
      render(<TestResultsView />);
      await waitFor(() => {
        expect(screen.getByText("Testing Results")).toBeInTheDocument();
      });
    });

    it("displays page header", () => {
      expect(screen.getByText("Testing Results")).toBeInTheDocument();
      expect(
        screen.getByText("Application quality and test coverage overview")
      ).toBeInTheDocument();
    });

    it("renders TestSummaryCards with correct data", () => {
      // Check for test counts
      expect(screen.getByText("100")).toBeInTheDocument(); // total tests
      expect(screen.getByText("85")).toBeInTheDocument(); // passed
      expect(screen.getByText("10")).toBeInTheDocument(); // failed
      expect(screen.getByText("5")).toBeInTheDocument(); // skipped
    });

    it("displays overall status banner when tests pass", async () => {
      const allPassedData = {
        ...mockTestData,
        data: {
          ...mockTestData.data,
          numFailedTests: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => allPassedData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("All Tests Passing!")).toBeInTheDocument();
      });
    });

    it("displays overall status banner when tests fail", () => {
      expect(screen.getByText(/Tests Need Attention/)).toBeInTheDocument();
    });

    it("displays duration correctly", () => {
      // Total runtime: 2500 + 3000 + 3000 = 8500ms = 8.5s
      expect(screen.getByText("8.5s")).toBeInTheDocument();
    });

    it("displays last run time", () => {
      expect(screen.getByText(/Last run/)).toBeInTheDocument();
      expect(screen.getByText("Just now")).toBeInTheDocument();
    });

    it("displays test file results", () => {
      expect(screen.getByText("MemberList.test.tsx")).toBeInTheDocument();
      expect(screen.getByText("HofList.test.tsx")).toBeInTheDocument();
      expect(screen.getByText("route.test.tsx")).toBeInTheDocument();
    });
  });

  describe("Refresh Functionality", () => {
    it("displays refresh button", async () => {
      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeInTheDocument();
      });
    });

    it("refetches data when refresh button is clicked", async () => {
      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("Testing Results")).toBeInTheDocument();
      });

      const refreshButton = screen.getByText("Refresh");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it("shows loading state during refresh", async () => {
      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("Testing Results")).toBeInTheDocument();
      });

      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockTestData,
                }),
              100
            );
          })
      );

      const refreshButton = screen.getByText("Refresh");
      fireEvent.click(refreshButton);

      expect(screen.getByText("Loading test results...")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    beforeEach(async () => {
      render(<TestResultsView />);
      await waitFor(() => {
        expect(screen.getByText("Testing Results")).toBeInTheDocument();
      });
    });

    it("displays search input", () => {
      expect(
        screen.getByPlaceholderText("Search test files...")
      ).toBeInTheDocument();
    });

    it("filters test files by search text", () => {
      const searchInput = screen.getByPlaceholderText("Search test files...");

      fireEvent.change(searchInput, { target: { value: "members" } });

      // Should show MemberList.test.tsx
      expect(screen.getByText("MemberList.test.tsx")).toBeInTheDocument();

      // Should not show others (HofList might still show if it matches other criteria)
      expect(screen.queryByText("HofList.test.tsx")).not.toBeInTheDocument();
    });

    it("search is case-insensitive", () => {
      const searchInput = screen.getByPlaceholderText("Search test files...");

      fireEvent.change(searchInput, { target: { value: "MEMBERS" } });

      expect(screen.getByText("MemberList.test.tsx")).toBeInTheDocument();
    });

    it("updates displayed count when searching", () => {
      const searchInput = screen.getByPlaceholderText("Search test files...");

      // Check initial state
      const infoText = screen.getByText(/displayed/);
      expect(infoText).toHaveTextContent(/\d+ records.*\d+ displayed/);

      fireEvent.change(searchInput, { target: { value: "members" } });

      // Should show updated displayed count (can be "X records • Y displayed" or just "Y displayed")
      const updatedInfoText = screen.getByText(/displayed/);
      expect(updatedInfoText).toHaveTextContent(/displayed/);
    });

    it("shows message when no results match search", () => {
      const searchInput = screen.getByPlaceholderText("Search test files...");

      fireEvent.change(searchInput, {
        target: { value: "nonexistent" },
      });

      expect(
        screen.getByText("No test suites match the current filter.")
      ).toBeInTheDocument();
    });

    it("clears search when clear button is clicked", () => {
      const searchInput = screen.getByPlaceholderText("Search test files...");

      fireEvent.change(searchInput, { target: { value: "members" } });
      expect(searchInput).toHaveValue("members");

      const clearButton = screen.getByText("Clear");
      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue("");
    });
  });

  describe("Status Filter Functionality", () => {
    beforeEach(async () => {
      render(<TestResultsView />);
      await waitFor(() => {
        expect(screen.getByText("Testing Results")).toBeInTheDocument();
      });
    });

    it("displays status filter badges", () => {
      expect(screen.getByText(/Passed \(/)).toBeInTheDocument();
      expect(screen.getByText(/Failed \(/)).toBeInTheDocument();
      expect(screen.getByText(/Skipped \(/)).toBeInTheDocument();
    });

    it("all status filters are selected by default", () => {
      // All 3 test files should be visible
      expect(screen.getByText("MemberList.test.tsx")).toBeInTheDocument();
      expect(screen.getByText("HofList.test.tsx")).toBeInTheDocument();
      expect(screen.getByText("route.test.tsx")).toBeInTheDocument();
    });

    it("filters by passed status only", () => {
      const passedButton = screen.getByText(/Passed \(/);
      const failedButton = screen.getByText(/Failed \(/);
      const skippedButton = screen.getByText(/Skipped \(/);

      // Deselect failed and skipped
      fireEvent.click(failedButton);
      fireEvent.click(skippedButton);

      // Should only show files with passed tests (all of them have passed tests)
      expect(screen.getByText("MemberList.test.tsx")).toBeInTheDocument();
      expect(screen.getByText("HofList.test.tsx")).toBeInTheDocument();
      expect(screen.getByText("route.test.tsx")).toBeInTheDocument();
    });

    it("filters by failed status only", () => {
      const passedButton = screen.getByText(/Passed \(/);
      const failedButton = screen.getByText(/Failed \(/);
      const skippedButton = screen.getByText(/Skipped \(/);

      // Deselect passed and skipped
      fireEvent.click(passedButton);
      fireEvent.click(skippedButton);

      // Should only show files with failed tests
      expect(screen.getByText("MemberList.test.tsx")).toBeInTheDocument();
      expect(screen.getByText("route.test.tsx")).toBeInTheDocument();
      expect(screen.queryByText("HofList.test.tsx")).not.toBeInTheDocument();
    });

    it("filters by skipped status only", () => {
      const passedButton = screen.getByText(/Passed \(/);
      const failedButton = screen.getByText(/Failed \(/);
      const skippedButton = screen.getByText(/Skipped \(/);

      // Deselect passed and failed
      fireEvent.click(passedButton);
      fireEvent.click(failedButton);

      // Should only show files with skipped tests
      expect(screen.getByText("HofList.test.tsx")).toBeInTheDocument();
      // Note: route.test.tsx has both failed AND skipped, so it might not show with only skipped filter
      expect(screen.queryByText("MemberList.test.tsx")).not.toBeInTheDocument();
    });

    it("shows no results when all filters are deselected", () => {
      const passedButton = screen.getByText(/Passed \(/);
      const failedButton = screen.getByText(/Failed \(/);
      const skippedButton = screen.getByText(/Skipped \(/);

      // Deselect all
      fireEvent.click(passedButton);
      fireEvent.click(failedButton);
      fireEvent.click(skippedButton);

      expect(
        screen.getByText("No test suites match the current filter.")
      ).toBeInTheDocument();
    });

    it("toggles filter status when clicked", () => {
      const passedButton = screen.getByText(/Passed \(/);

      // Initially selected
      expect(passedButton).toHaveClass("border-green-500");

      // Click to deselect
      fireEvent.click(passedButton);
      expect(passedButton).toHaveClass("border-dark-600");

      // Click to select again
      fireEvent.click(passedButton);
      expect(passedButton).toHaveClass("border-green-500");
    });

    it("updates displayed count when filtering by status", () => {
      const failedButton = screen.getByText(/Failed \(/);
      const skippedButton = screen.getByText(/Skipped \(/);

      // Deselect failed and skipped
      fireEvent.click(failedButton);
      fireEvent.click(skippedButton);

      // Count should update - check that displayed count exists
      const infoText = screen.getByText(/displayed/);
      expect(infoText).toBeInTheDocument();
      expect(infoText).toHaveTextContent(/\d+ displayed/);
    });
  });

  describe("Combined Filtering", () => {
    beforeEach(async () => {
      render(<TestResultsView />);
      await waitFor(() => {
        expect(screen.getByText("Testing Results")).toBeInTheDocument();
      });
    });

    it("applies both search and status filters", () => {
      const searchInput = screen.getByPlaceholderText("Search test files...");
      const failedButton = screen.getByText(/Failed \(/);
      const skippedButton = screen.getByText(/Skipped \(/);

      // Filter by passed only
      fireEvent.click(failedButton);
      fireEvent.click(skippedButton);

      // Search for "hof"
      fireEvent.change(searchInput, { target: { value: "hof" } });

      // Should only show HofList with passed tests
      expect(screen.getByText("HofList.test.tsx")).toBeInTheDocument();
      expect(screen.queryByText("MemberList.test.tsx")).not.toBeInTheDocument();
      expect(screen.queryByText("route.test.tsx")).not.toBeInTheDocument();
    });
  });

  describe("Clear Filters", () => {
    beforeEach(async () => {
      render(<TestResultsView />);
      await waitFor(() => {
        expect(screen.getByText("Testing Results")).toBeInTheDocument();
      });
    });

    it("displays clear button", () => {
      expect(screen.getByText("Clear")).toBeInTheDocument();
    });

    it("clear button is disabled when no filters are active", () => {
      const clearButton = screen.getByText("Clear");

      // All filters selected by default, and no search text
      expect(clearButton).toBeDisabled();
    });

    it("clear button is enabled when search is active", () => {
      const searchInput = screen.getByPlaceholderText("Search test files...");
      fireEvent.change(searchInput, { target: { value: "test" } });

      const clearButton = screen.getByText("Clear");
      expect(clearButton).not.toBeDisabled();
    });

    it("clear button is enabled when status filter is changed", () => {
      const failedButton = screen.getByText(/Failed \(/);
      fireEvent.click(failedButton);

      const clearButton = screen.getByText("Clear");
      expect(clearButton).not.toBeDisabled();
    });

    it("clears all filters when clicked", () => {
      const searchInput = screen.getByPlaceholderText("Search test files...");
      const failedButton = screen.getByText(/Failed \(/);

      // Apply filters
      fireEvent.change(searchInput, { target: { value: "test" } });
      fireEvent.click(failedButton);

      // Clear
      const clearButton = screen.getByText("Clear");
      fireEvent.click(clearButton);

      // Search should be cleared
      expect(searchInput).toHaveValue("");

      // All status filters should be selected
      expect(failedButton).toHaveClass("border-red-500");
    });
  });

  describe("Time Display", () => {
    it("displays 'Just now' for very recent runs", async () => {
      const recentData = {
        ...mockTestData,
        lastRun: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => recentData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("Just now")).toBeInTheDocument();
      });
    });

    it("displays minutes for runs within an hour", async () => {
      const minutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentData = {
        ...mockTestData,
        lastRun: minutesAgo.toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => recentData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText(/30 minutes ago/)).toBeInTheDocument();
      });
    });

    it("displays hours for runs within a day", async () => {
      const hoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const recentData = {
        ...mockTestData,
        lastRun: hoursAgo.toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => recentData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText(/5 hours ago/)).toBeInTheDocument();
      });
    });

    it("displays days for older runs", async () => {
      const daysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const recentData = {
        ...mockTestData,
        lastRun: daysAgo.toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => recentData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText(/3 days ago/)).toBeInTheDocument();
      });
    });

    it("displays full date and time", async () => {
      render(<TestResultsView />);

      await waitFor(() => {
        // Should show formatted date (e.g., "Nov 11, 2025")
        const dateElement = screen.getByText(/\d{1,2}:\d{2}:\d{2}/);
        expect(dateElement).toBeInTheDocument();
      });
    });
  });

  describe("Duration Formatting", () => {
    it("displays duration in seconds for short tests", async () => {
      const shortTestData = {
        ...mockTestData,
        data: {
          ...mockTestData.data,
          testResults: [
            {
              name: "__tests__/fast.test.tsx",
              numFailingTests: 0,
              numPassingTests: 1,
              numPendingTests: 0,
              perfStats: {
                start: 1000,
                end: 1500,
                runtime: 500, // 0.5s
              },
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => shortTestData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("0.5s")).toBeInTheDocument();
      });
    });

    it("displays duration in minutes and seconds for long tests", async () => {
      const longTestData = {
        ...mockTestData,
        data: {
          ...mockTestData.data,
          testResults: [
            {
              name: "__tests__/slow.test.tsx",
              numFailingTests: 0,
              numPassingTests: 1,
              numPendingTests: 0,
              perfStats: {
                start: 1000,
                end: 91000,
                runtime: 90000, // 90s = 1m 30s
              },
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => longTestData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("1m 30s")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty test results", async () => {
      const emptyData = {
        data: {
          numTotalTests: 0,
          numPassedTests: 0,
          numFailedTests: 0,
          numPendingTests: 0,
          numTotalTestSuites: 0,
          numPassedTestSuites: 0,
          numFailedTestSuites: 0,
          numPendingTestSuites: 0,
          startTime: Date.now(),
          testResults: [],
        },
        lastRun: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => emptyData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("Testing Results")).toBeInTheDocument();
      });

      expect(
        screen.getByText("No test suites match the current filter.")
      ).toBeInTheDocument();
    });

    it("handles null test results gracefully", async () => {
      const nullData = {
        data: {
          numTotalTests: 10,
          numPassedTests: 10,
          numFailedTests: 0,
          numPendingTests: 0,
          numTotalTestSuites: 2,
          numPassedTestSuites: 2,
          numFailedTestSuites: 0,
          numPendingTestSuites: 0,
          startTime: Date.now(),
          testResults: [
            {
              name: "__tests__/test.tsx",
              numFailingTests: 0,
              numPassingTests: 10,
              numPendingTests: 0,
            },
          ],
        },
        lastRun: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => nullData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        // Use getAllByText since "test.tsx" appears in both h3 and p
        const testFiles = screen.getAllByText("test.tsx");
        expect(testFiles.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Status Messages", () => {
    it("shows success message when all tests pass with no skipped tests", async () => {
      const allPassedData = {
        ...mockTestData,
        data: {
          ...mockTestData.data,
          numFailedTests: 0,
          numPendingTests: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => allPassedData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("All Tests Passing!")).toBeInTheDocument();
        expect(
          screen.getByText("Great job! The application is working as expected.")
        ).toBeInTheDocument();
      });
    });

    it("shows success message with skipped warning", async () => {
      const passedWithSkippedData = {
        ...mockTestData,
        data: {
          ...mockTestData.data,
          numFailedTests: 0,
          numPendingTests: 5,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => passedWithSkippedData,
      });

      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText("All Tests Passing!")).toBeInTheDocument();
        expect(
          screen.getByText(/5 tests are currently skipped/)
        ).toBeInTheDocument();
      });
    });

    it("shows failure message with count", async () => {
      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText(/10 Tests Need Attention/)).toBeInTheDocument();
        expect(screen.getByText(/Some tests are failing/)).toBeInTheDocument();
      });
    });

    it("shows failure message with skipped count", async () => {
      render(<TestResultsView />);

      await waitFor(() => {
        expect(screen.getByText(/10 Tests Need Attention/)).toBeInTheDocument();
        expect(screen.getByText(/\(5 tests skipped\)/)).toBeInTheDocument();
      });
    });
  });
});
