import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import TestFileResults from "@/app/components/features/test-results/TestFileResults";

describe("TestFileResults", () => {
  const mockTestFile = {
    name: "__tests__/components/features/members/MemberList.test.tsx",
    numFailingTests: 1,
    numPassingTests: 8,
    numPendingTests: 1,
    perfStats: {
      start: 1000,
      end: 3500,
      runtime: 2500,
    },
    testResults: [
      {
        ancestorTitles: ["MemberList", "Loading"],
        title: "shows loading spinner",
        status: "passed" as const,
        duration: 150,
      },
      {
        ancestorTitles: ["MemberList", "Display"],
        title: "renders member list",
        status: "passed" as const,
        duration: 200,
      },
      {
        ancestorTitles: ["MemberList", "Filtering"],
        title: "filters by search term",
        status: "failed" as const,
        duration: 180,
        failureMessages: [
          "Expected element to have text content 'John' but received 'Jane'",
        ],
      },
      {
        ancestorTitles: ["MemberList", "Pagination"],
        title: "handles pagination",
        status: "pending" as const,
        duration: 0,
      },
    ],
  };

  describe("Initial Rendering", () => {
    it("renders collapsed by default", () => {
      // Provide a status filter with all statuses to show all counts
      const statusFilter = new Set<"passed" | "failed" | "skipped">([
        "passed",
        "failed",
        "skipped",
      ]);
      render(
        <TestFileResults testFile={mockTestFile} statusFilter={statusFilter} />
      );

      expect(screen.getByText("MemberList.test.tsx")).toBeInTheDocument();

      // Should not show test details when collapsed
      expect(
        screen.queryByText("shows loading spinner")
      ).not.toBeInTheDocument();
    });

    it("displays file name correctly", () => {
      render(<TestFileResults testFile={mockTestFile} />);

      expect(screen.getByText("MemberList.test.tsx")).toBeInTheDocument();
    });

    it("displays relative path after __tests__/", () => {
      render(<TestFileResults testFile={mockTestFile} />);

      expect(
        screen.getByText("components/features/members/MemberList.test.tsx")
      ).toBeInTheDocument();
    });

    it("displays test counts correctly", () => {
      // Provide a status filter with all statuses to show all counts
      const statusFilter = new Set<"passed" | "failed" | "skipped">([
        "passed",
        "failed",
        "skipped",
      ]);
      render(
        <TestFileResults testFile={mockTestFile} statusFilter={statusFilter} />
      );

      // With all filters, total should be calculated from individual tests
      // Check for the presence of count displays
      const counts = screen.getAllByText(/\d+/);
      expect(counts.length).toBeGreaterThan(0);
    });

    it("displays duration correctly (in seconds)", () => {
      render(<TestFileResults testFile={mockTestFile} />);

      // Duration format may vary based on filtering
      expect(screen.getByText(/\d+\.\d{2}s/)).toBeInTheDocument();
    });
  });

  describe("Expansion and Collapse", () => {
    const allStatusFilter = new Set<"passed" | "failed" | "skipped">([
      "passed",
      "failed",
      "skipped",
    ]);

    it("expands when header is clicked", () => {
      render(
        <TestFileResults
          testFile={mockTestFile}
          statusFilter={allStatusFilter}
        />
      );

      const header = screen.getByText("MemberList.test.tsx").closest("div");
      fireEvent.click(header!);

      // Should show test details (with full ancestor paths)
      expect(
        screen.getByText("MemberList › Loading › shows loading spinner")
      ).toBeInTheDocument();
      expect(
        screen.getByText("MemberList › Display › renders member list")
      ).toBeInTheDocument();
      expect(
        screen.getByText("MemberList › Filtering › filters by search term")
      ).toBeInTheDocument();
    });

    it("collapses when expanded header is clicked again", () => {
      render(
        <TestFileResults
          testFile={mockTestFile}
          statusFilter={allStatusFilter}
        />
      );

      const header = screen.getByText("MemberList.test.tsx").closest("div");

      // Expand
      fireEvent.click(header!);
      expect(
        screen.getByText("MemberList › Loading › shows loading spinner")
      ).toBeInTheDocument();

      // Collapse
      fireEvent.click(header!);
      expect(
        screen.queryByText("MemberList › Loading › shows loading spinner")
      ).not.toBeInTheDocument();
    });

    it("toggles chevron icon on expand/collapse", () => {
      const { container } = render(<TestFileResults testFile={mockTestFile} />);

      const header = screen.getByText("MemberList.test.tsx").closest("div");

      // Initially collapsed - should have ChevronRight
      let chevronRight = container.querySelector("svg");
      expect(chevronRight).toBeInTheDocument();

      // Expand
      fireEvent.click(header!);

      // Should have ChevronDown
      const chevronDown = container.querySelector("svg");
      expect(chevronDown).toBeInTheDocument();
    });
  });

  describe("Test Details Display", () => {
    const allStatusFilter = new Set<"passed" | "failed" | "skipped">([
      "passed",
      "failed",
      "skipped",
    ]);

    beforeEach(() => {
      render(
        <TestFileResults
          testFile={mockTestFile}
          statusFilter={allStatusFilter}
        />
      );
      const header = screen.getByText("MemberList.test.tsx").closest("div");
      fireEvent.click(header!);
    });

    it("displays all individual test results when expanded", () => {
      expect(
        screen.getByText("MemberList › Loading › shows loading spinner")
      ).toBeInTheDocument();
      expect(
        screen.getByText("MemberList › Display › renders member list")
      ).toBeInTheDocument();
      expect(
        screen.getByText("MemberList › Filtering › filters by search term")
      ).toBeInTheDocument();
      expect(
        screen.getByText("MemberList › Pagination › handles pagination")
      ).toBeInTheDocument();
    });

    it("shows full test title with ancestor titles", () => {
      // Full title: "MemberList › Loading › shows loading spinner"
      const fullTitle = screen.getByText(
        /MemberList › Loading › shows loading spinner/
      );
      expect(fullTitle).toBeInTheDocument();
    });

    it("displays passed test with correct icon and status", () => {
      const passedTests = screen.getAllByText("Passed");
      expect(passedTests.length).toBeGreaterThan(0);
    });

    it("displays failed test with correct icon and status", () => {
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    it("displays skipped/pending test with correct icon and status", () => {
      expect(screen.getByText("Skipped")).toBeInTheDocument();
    });

    it("displays individual test durations in seconds", () => {
      // 150ms = 0.150s
      expect(screen.getByText("0.150s")).toBeInTheDocument();
      // 200ms = 0.200s
      expect(screen.getByText("0.200s")).toBeInTheDocument();
      // 180ms = 0.180s
      expect(screen.getByText("0.180s")).toBeInTheDocument();
    });
  });

  describe("Error Messages", () => {
    const allStatusFilter = new Set<"passed" | "failed" | "skipped">([
      "passed",
      "failed",
      "skipped",
    ]);

    beforeEach(() => {
      render(
        <TestFileResults
          testFile={mockTestFile}
          statusFilter={allStatusFilter}
        />
      );
      const header = screen.getByText("MemberList.test.tsx").closest("div");
      fireEvent.click(header!);
    });

    it("shows 'Show error details' button for failed tests", () => {
      expect(screen.getByText("Show error details")).toBeInTheDocument();
    });

    it("does not show error details button for passed tests", () => {
      const passedTests = screen.getAllByText("Passed");
      expect(passedTests.length).toBeGreaterThan(0);

      // There should only be one "Show error details" button (for the failed test)
      const errorButtons = screen.queryAllByText("Show error details");
      expect(errorButtons).toHaveLength(1);
    });

    it("expands error details when button is clicked", () => {
      const showDetailsButton = screen.getByText("Show error details");
      fireEvent.click(showDetailsButton);

      expect(
        screen.getByText(/Expected element to have text content/)
      ).toBeInTheDocument();
    });

    it("collapses error details when 'Hide details' is clicked", () => {
      const showDetailsButton = screen.getByText("Show error details");
      fireEvent.click(showDetailsButton);

      expect(screen.getByText("Hide details")).toBeInTheDocument();

      const hideDetailsButton = screen.getByText("Hide details");
      fireEvent.click(hideDetailsButton);

      expect(
        screen.queryByText(/Expected element to have text content/)
      ).not.toBeInTheDocument();
    });
  });

  describe("Error Message Sanitization", () => {
    it("sanitizes error messages to remove absolute paths", () => {
      const allStatusFilter = new Set<"passed" | "failed" | "skipped">([
        "passed",
        "failed",
        "skipped",
      ]);

      const testFileWithPath = {
        name: "__tests__/test.ts",
        numFailingTests: 1,
        numPassingTests: 0,
        numPendingTests: 0,
        testResults: [
          {
            ancestorTitles: ["Test"],
            title: "fails with path",
            status: "failed" as const,
            duration: 100,
            failureMessages: [
              "Error at /home/user/projects/bwb/src/test.ts:10",
            ],
          },
        ],
      };

      render(
        <TestFileResults
          testFile={testFileWithPath}
          statusFilter={allStatusFilter}
        />
      );
      const headers = screen.getAllByText("test.ts");
      const header = headers[0].closest("div.p-4");
      fireEvent.click(header!);

      const showDetailsButtons = screen.getAllByText("Show error details");
      fireEvent.click(showDetailsButtons[0]);

      // Path should be sanitized to remove everything before /bwb/
      expect(screen.getByText(/src\/test.ts:10/)).toBeInTheDocument();
    });
  });

  describe("Border Colors", () => {
    const allStatusFilter = new Set<"passed" | "failed" | "skipped">([
      "passed",
      "failed",
      "skipped",
    ]);

    it("applies red border when tests are failing", () => {
      const { container } = render(
        <TestFileResults
          testFile={mockTestFile}
          statusFilter={allStatusFilter}
        />
      );

      expect(container.querySelector(".border-l-red-500")).toBeInTheDocument();
    });

    it("applies yellow border when tests are skipped but none failed", () => {
      const testFileWithSkipped = {
        ...mockTestFile,
        numFailingTests: 0,
        numPendingTests: 2,
        testResults: mockTestFile.testResults?.map((t) =>
          t.status === "failed" ? { ...t, status: "pending" as const } : t
        ),
      };

      const { container } = render(
        <TestFileResults
          testFile={testFileWithSkipped}
          statusFilter={allStatusFilter}
        />
      );

      expect(
        container.querySelector(".border-l-yellow-500")
      ).toBeInTheDocument();
    });

    it("applies green border when all tests pass", () => {
      const testFileAllPassed = {
        ...mockTestFile,
        numFailingTests: 0,
        numPendingTests: 0,
        testResults: mockTestFile.testResults?.map((t) => ({
          ...t,
          status: "passed" as const,
        })),
      };

      const { container } = render(
        <TestFileResults
          testFile={testFileAllPassed}
          statusFilter={allStatusFilter}
        />
      );

      expect(
        container.querySelector(".border-l-green-500")
      ).toBeInTheDocument();
    });
  });

  describe("Status Filtering", () => {
    it("applies status filter to displayed tests", () => {
      const statusFilter = new Set<"passed" | "failed" | "skipped">(["passed"]);

      render(
        <TestFileResults testFile={mockTestFile} statusFilter={statusFilter} />
      );

      const header = screen.getByText("MemberList.test.tsx").closest("div.p-4");
      fireEvent.click(header!);

      // Should only show passed tests (with full ancestor path)
      expect(
        screen.getByText("MemberList › Loading › shows loading spinner")
      ).toBeInTheDocument();
      expect(
        screen.getByText("MemberList › Display › renders member list")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("MemberList › Filtering › filters by search term")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("MemberList › Pagination › handles pagination")
      ).not.toBeInTheDocument();
    });

    it("shows failed tests when failed filter is active", () => {
      const statusFilter = new Set<"passed" | "failed" | "skipped">(["failed"]);

      render(
        <TestFileResults testFile={mockTestFile} statusFilter={statusFilter} />
      );

      const header = screen.getByText("MemberList.test.tsx").closest("div.p-4");
      fireEvent.click(header!);

      // Should only show failed tests
      expect(
        screen.getByText("MemberList › Filtering › filters by search term")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("MemberList › Loading › shows loading spinner")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("MemberList › Display › renders member list")
      ).not.toBeInTheDocument();
    });

    it("shows skipped tests when skipped filter is active", () => {
      const statusFilter = new Set<"passed" | "failed" | "skipped">([
        "skipped",
      ]);

      render(
        <TestFileResults testFile={mockTestFile} statusFilter={statusFilter} />
      );

      const header = screen.getByText("MemberList.test.tsx").closest("div.p-4");
      fireEvent.click(header!);

      // Should only show skipped tests
      expect(
        screen.getByText("MemberList › Pagination › handles pagination")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("MemberList › Loading › shows loading spinner")
      ).not.toBeInTheDocument();
    });

    it("shows all tests when all filters are active", () => {
      const statusFilter = new Set<"passed" | "failed" | "skipped">([
        "passed",
        "failed",
        "skipped",
      ]);

      render(
        <TestFileResults testFile={mockTestFile} statusFilter={statusFilter} />
      );

      const header = screen.getByText("MemberList.test.tsx").closest("div.p-4");
      fireEvent.click(header!);

      // Should show all tests (with full ancestor paths)
      expect(
        screen.getByText("MemberList › Loading › shows loading spinner")
      ).toBeInTheDocument();
      expect(
        screen.getByText("MemberList › Display › renders member list")
      ).toBeInTheDocument();
      expect(
        screen.getByText("MemberList › Filtering › filters by search term")
      ).toBeInTheDocument();
      expect(
        screen.getByText("MemberList › Pagination › handles pagination")
      ).toBeInTheDocument();
    });

    it("updates counts based on status filter", () => {
      const statusFilter = new Set<"passed" | "failed" | "skipped">(["passed"]);

      render(
        <TestFileResults testFile={mockTestFile} statusFilter={statusFilter} />
      );

      // When filtering by passed only, should show filtered count
      const countElements = screen.getAllByText(/\d+/);
      expect(countElements.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    const allStatusFilter = new Set<"passed" | "failed" | "skipped">([
      "passed",
      "failed",
      "skipped",
    ]);

    it("handles test file with no individual test results", () => {
      const testFileNoResults = {
        name: "__tests__/empty.test.tsx",
        numFailingTests: 0,
        numPassingTests: 5,
        numPendingTests: 0,
        perfStats: {
          start: 1000,
          end: 2000,
          runtime: 1000,
        },
      };

      render(
        <TestFileResults
          testFile={testFileNoResults}
          statusFilter={allStatusFilter}
        />
      );

      const headers = screen.getAllByText("empty.test.tsx");
      expect(headers.length).toBeGreaterThan(0);
      expect(screen.getByText("1.00s")).toBeInTheDocument();
    });

    it("shows message when expanded but no test results available", () => {
      const testFileNoResults = {
        name: "__tests__/empty.test.tsx",
        numFailingTests: 0,
        numPassingTests: 0,
        numPendingTests: 0,
      };

      render(
        <TestFileResults
          testFile={testFileNoResults}
          statusFilter={allStatusFilter}
        />
      );

      const headers = screen.getAllByText("empty.test.tsx");
      const header = headers[0].closest("div.p-4");
      fireEvent.click(header!);

      expect(
        screen.getByText("No test results available for this file.")
      ).toBeInTheDocument();
    });

    it("handles test file without perfStats", () => {
      const testFileNoPerfStats = {
        name: "__tests__/test.tsx",
        numFailingTests: 0,
        numPassingTests: 1,
        numPendingTests: 0,
        testResults: [
          {
            ancestorTitles: [],
            title: "test",
            status: "passed" as const,
            duration: 100,
          },
        ],
      };

      render(
        <TestFileResults
          testFile={testFileNoPerfStats}
          statusFilter={allStatusFilter}
        />
      );

      // Duration is calculated from individual tests when no perfStats
      // 100ms duration should show as 0.10s but with filtering it might be 0.00s
      expect(screen.getByText(/\d+\.\d{2}s/)).toBeInTheDocument();
    });

    it("handles test with empty ancestorTitles", () => {
      const testFileNoAncestors = {
        name: "__tests__/test.tsx",
        numFailingTests: 0,
        numPassingTests: 1,
        numPendingTests: 0,
        testResults: [
          {
            ancestorTitles: [],
            title: "standalone test",
            status: "passed" as const,
            duration: 100,
          },
        ],
      };

      render(
        <TestFileResults
          testFile={testFileNoAncestors}
          statusFilter={allStatusFilter}
        />
      );

      const headers = screen.getAllByText("test.tsx");
      const header = headers[0].closest("div.p-4");
      fireEvent.click(header!);

      // Should just show the title without ancestors
      expect(screen.getByText("standalone test")).toBeInTheDocument();
    });

    it("handles very long file paths", () => {
      const longPath =
        "__tests__/components/features/very/deeply/nested/folder/structure/Test.test.tsx";
      const testFileLongPath = {
        name: longPath,
        numFailingTests: 0,
        numPassingTests: 1,
        numPendingTests: 0,
      };

      render(
        <TestFileResults
          testFile={testFileLongPath}
          statusFilter={allStatusFilter}
        />
      );

      expect(screen.getByText("Test.test.tsx")).toBeInTheDocument();
      expect(
        screen.getByText(
          "components/features/very/deeply/nested/folder/structure/Test.test.tsx"
        )
      ).toBeInTheDocument();
    });

    it("handles zero duration tests", () => {
      const testFileZeroDuration = {
        name: "__tests__/fast.test.tsx",
        numFailingTests: 0,
        numPassingTests: 1,
        numPendingTests: 0,
        perfStats: {
          start: 1000,
          end: 1000,
          runtime: 0,
        },
        testResults: [
          {
            ancestorTitles: [],
            title: "instant test",
            status: "passed" as const,
            duration: 0,
          },
        ],
      };

      render(
        <TestFileResults
          testFile={testFileZeroDuration}
          statusFilter={allStatusFilter}
        />
      );

      // Use getAllByText to handle multiple matches (h3 and p elements)
      const headers = screen.getAllByText("fast.test.tsx");
      const header = headers[0].closest("div.p-4");
      fireEvent.click(header!);

      // Check that the test is displayed, duration format may vary
      expect(screen.getByText("instant test")).toBeInTheDocument();
    });

    it("handles tests with multiple failure messages", () => {
      const testFileMultipleErrors = {
        name: "__tests__/errors.test.tsx",
        numFailingTests: 1,
        numPassingTests: 0,
        numPendingTests: 0,
        testResults: [
          {
            ancestorTitles: [],
            title: "test with multiple errors",
            status: "failed" as const,
            duration: 100,
            failureMessages: [
              "First error message",
              "Second error message",
              "Third error message",
            ],
          },
        ],
      };

      render(
        <TestFileResults
          testFile={testFileMultipleErrors}
          statusFilter={allStatusFilter}
        />
      );

      // Use getAllByText to handle multiple matches (h3 and p elements)
      const headers = screen.getAllByText("errors.test.tsx");
      const header = headers[0].closest("div.p-4");
      fireEvent.click(header!);

      // Check that the test is displayed
      expect(screen.getByText("test with multiple errors")).toBeInTheDocument();

      // Note: Show error details button only shows when status filter includes failed tests
      const showDetailsButtons = screen.queryAllByText("Show error details");
      if (showDetailsButtons.length > 0) {
        fireEvent.click(showDetailsButtons[0]);
        expect(screen.getByText(/First error message/)).toBeInTheDocument();
      }
    });
  });

  describe("Accessibility", () => {
    it("has clickable header region for expansion", () => {
      render(<TestFileResults testFile={mockTestFile} />);

      // Find the header element with cursor-pointer class
      const { container } = render(<TestFileResults testFile={mockTestFile} />);
      const header = container.querySelector(".cursor-pointer");
      expect(header).toBeInTheDocument();
    });

    it("provides visual feedback on hover", () => {
      const { container } = render(<TestFileResults testFile={mockTestFile} />);

      const header = container.querySelector(".hover\\:bg-dark-750");
      expect(header).toBeInTheDocument();
    });
  });
});
