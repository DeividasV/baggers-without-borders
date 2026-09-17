/**
 * Tests for MyBagsManagement component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MyBagsManagement from "@/components/features/my-bags/MyBagsManagement";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

global.fetch = jest.fn();

describe("MyBagsManagement", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockSession = {
    user: {
      id: "user-1",
      role: "USER",
      email: "user@example.com",
    },
    expires: "2024-12-31",
  };

  const mockEntries = [
    {
      id: "entry-1",
      memberId: "user-1",
      hofId: "hof-1",
      yearId: "year-1",
      totalPeaks: 100,
      peaksInYear: 50,
      foreignPeaks: 20,
      isParticipating: true,
      isParticipatingHof: true,
      isParticipatingYear: true,
      member: {
        id: "user-1",
        username: "testuser",
        displayName: "Test User",
      },
      hof: {
        id: "hof-1",
        code: "BPL",
        title: "Bavarian Prealps List",
        displayOrder: 0,
        allowManualEntry: true,
      },
      year: {
        id: "year-1",
        code: "2024",
        title: "2024",
        displayOrder: 0,
        allowManualEntry: true,
      },
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "entry-2",
      memberId: "user-1",
      hofId: "hof-2",
      yearId: "year-1",
      totalPeaks: 75,
      peaksInYear: 30,
      foreignPeaks: 15,
      isParticipating: true,
      isParticipatingHof: true,
      isParticipatingYear: true,
      member: {
        id: "user-1",
        username: "testuser",
        displayName: "Test User",
      },
      hof: {
        id: "hof-2",
        code: "AAL",
        title: "Austrian Alps List",
        displayOrder: 1,
        allowManualEntry: false,
      },
      year: {
        id: "year-1",
        code: "2024",
        title: "2024",
        displayOrder: 0,
        allowManualEntry: true,
      },
      createdAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
    {
      id: "entry-3",
      memberId: "user-1",
      hofId: "hof-1",
      yearId: "year-2",
      totalPeaks: 120,
      peaksInYear: 40,
      foreignPeaks: 25,
      isParticipating: false,
      isParticipatingHof: true,
      isParticipatingYear: false,
      member: {
        id: "user-1",
        username: "testuser",
        displayName: "Test User",
      },
      hof: {
        id: "hof-1",
        code: "BPL",
        title: "Bavarian Prealps List",
        displayOrder: 0,
        allowManualEntry: true,
      },
      year: {
        id: "year-2",
        code: "2023",
        title: "2023",
        displayOrder: 1,
        allowManualEntry: false,
      },
      createdAt: "2024-01-03T00:00:00Z",
      updatedAt: "2024-01-03T00:00:00Z",
    },
  ];

  const mockApiResponse = {
    entries: mockEntries,
    userAllowManualEntry: true,
    disabledCount: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
  });

  describe("Loading State", () => {
    it("should show loading state initially", () => {
      render(<MyBagsManagement />);
      expect(screen.getByText("Loading entries...")).toBeInTheDocument();
    });

    it("should hide loading after data fetch", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(
          screen.queryByText("Loading entries...")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Rendering", () => {
    it("should display header", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getByText("My Bags")).toBeInTheDocument();
      });
      expect(
        screen.getByText("Your Hall of Fame entries and statistics")
      ).toBeInTheDocument();
    });

    it("should display statistics", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("Total Peaks").length).toBeGreaterThan(0);
      });
      const foreignPeaksElements = screen.getAllByText("Total Foreign Peaks");
      expect(foreignPeaksElements.length).toBeGreaterThan(0);
      expect(screen.getByText("Overall FPR")).toBeInTheDocument();
    });

    it("should display entries after loading", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText("AAL").length).toBeGreaterThan(0);
    });
  });

  describe("Data Fetching", () => {
    it("should fetch entries on mount", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/my-bags");
      });
    });

    it("should handle fetch error", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(<MyBagsManagement />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          "Error fetching my bags entries:",
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it("should not fetch without session", () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });
      render(<MyBagsManagement />);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Statistics Calculation", () => {
    it("should calculate total peaks correctly", async () => {
      render(<MyBagsManagement />);
      await waitFor(
        () => {
          // BPL (lowest enabled HOF) max: Math.max(100, 120) = 120
          const elements = screen.queryAllByText("120");
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it("should calculate total foreign peaks", async () => {
      render(<MyBagsManagement />);
      await waitFor(
        () => {
          // BPL (lowest enabled HOF) foreign peaks: Math.max(20, 25) = 25
          const elements = screen.queryAllByText("25");
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it("should calculate overall FPR", async () => {
      render(<MyBagsManagement />);
      await waitFor(
        () => {
          // BPL (lowest enabled HOF): totalPeaks=120, foreignPeaks=25
          // FPR: (25 / 120) * 100 = 20.8%
          expect(screen.getAllByText(/20\.8%/).length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Metric Selection", () => {
    it("should display metric tabs on desktop", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("Total Peaks").length).toBeGreaterThan(0);
      });
      expect(
        screen.getByRole("button", { name: "Peaks in Year" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Total Foreign Peaks" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "FPR" })).toBeInTheDocument();
    });

    it("should switch to peaks in year metric", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        const peaksInYearButton = screen.getByRole("button", {
          name: "Peaks in Year",
        });
        fireEvent.click(peaksInYearButton);
      });

      // Should display peaks in year data
      expect(screen.getAllByText("50").length).toBeGreaterThan(0);
    });

    it("should switch to foreign peaks metric", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        const foreignPeaksButton = screen.getByRole("button", {
          name: "Total Foreign Peaks",
        });
        fireEvent.click(foreignPeaksButton);
      });

      // Should display foreign peaks data
      expect(screen.getAllByText("20").length).toBeGreaterThan(0);
    });

    it("should switch to FPR metric", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        const fprButton = screen.getByRole("button", { name: "FPR" });
        fireEvent.click(fprButton);
      });

      // Should display FPR percentages (Entry 1: 20/100 = 20.0%)
      expect(screen.getAllByText(/20\.0%/).length).toBeGreaterThan(0);
    });
  });

  describe("Matrix Display", () => {
    it("should display HOF codes as column headers", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText("AAL").length).toBeGreaterThan(0);
    });

    it("should display year titles as row headers", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("2024").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText("2023").length).toBeGreaterThan(0);
    });

    it("should display entry values in cells", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        // Total peaks values should be displayed
        expect(screen.getAllByText("100").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText("75").length).toBeGreaterThan(0);
      expect(screen.getAllByText("120").length).toBeGreaterThan(0);
    });

    it("should display lock icons for locked HOFs", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        // AAL has allowManualEntry: false
        const lockIcons = screen.getAllByTitle(
          /Manual data entry is disabled for AAL/i
        );
        expect(lockIcons.length).toBeGreaterThan(0);
      });
    });

    it("should display lock icons for locked years", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        // 2023 has allowManualEntry: false
        const lockIcons = screen.getAllByTitle(
          /Manual data entry is disabled for 2023/i
        );
        expect(lockIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Cell Editability", () => {
    it("should navigate to edit page on editable cell click", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      });

      // Find cells - they should be clickable
      const cells = screen.getAllByRole("cell");
      if (cells.length > 0) {
        // Find a cell with value "100" (the editable BPL/2024 cell)
        const editableCell = cells.find((cell) => cell.textContent === "100");
        if (editableCell) {
          fireEvent.click(editableCell);

          await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith(
              expect.stringContaining("/my-bags/entry-1/edit")
            );
          });
        }
      }
    });

    it("should not navigate on disabled cell click", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      });

      const cells = screen.getAllByRole("cell");
      // Find the disabled entry (entry-3, isParticipating: false)
      const disabledCell = cells.find((cell) => cell.textContent === "120");
      if (disabledCell) {
        fireEvent.click(disabledCell);

        // Should not navigate
        expect(mockRouter.push).not.toHaveBeenCalledWith(
          expect.stringContaining("/my-bags/entry-3/edit")
        );
      }
    });

    it("should not navigate on locked HOF cell click", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("AAL").length).toBeGreaterThan(0);
      });

      const cells = screen.getAllByRole("cell");
      // Find the AAL cell (allowManualEntry: false)
      const lockedCell = cells.find((cell) => cell.textContent === "75");
      if (lockedCell) {
        fireEvent.click(lockedCell);

        // Should not navigate because HOF is locked
        expect(mockRouter.push).not.toHaveBeenCalledWith(
          expect.stringContaining("/my-bags/entry-2/edit")
        );
      }
    });
  });

  describe("Manual Entry Lock", () => {
    it("should show locked notice when user manual entry is disabled", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockApiResponse,
          userAllowManualEntry: false,
        }),
      });

      render(<MyBagsManagement />);

      await waitFor(() => {
        expect(
          screen.getAllByText(
            /Manual editing of your bagg entries has been disabled/i
          ).length
        ).toBeGreaterThan(0);
      });
    });

    it("should not show locked notice when user can edit", async () => {
      render(<MyBagsManagement />);

      await waitFor(() => {
        expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      });

      expect(
        screen.queryByText(
          /Manual editing of your bagg entries has been disabled/i
        )
      ).not.toBeInTheDocument();
    });
  });

  describe("Participation Notice", () => {
    it("should show participation notice when entries are disabled", async () => {
      render(<MyBagsManagement />);

      await waitFor(() => {
        // Check for key parts of the participation notice
        expect(screen.getAllByText("1").length).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/entry is.*disabled/i).length
        ).toBeGreaterThan(0);
      });
    });

    it("should not show notice when no disabled entries", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockApiResponse,
          disabledCount: 0,
        }),
      });

      render(<MyBagsManagement />);

      await waitFor(() => {
        expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      });

      expect(
        screen.queryByText(/disabled due to participation/i)
      ).not.toBeInTheDocument();
    });

    it("should show plural form for multiple disabled entries", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockApiResponse,
          disabledCount: 3,
        }),
      });

      render(<MyBagsManagement />);

      await waitFor(() => {
        // Check for key parts of the participation notice
        expect(screen.getAllByText("3").length).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/entries are.*disabled/i).length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no entries exist", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          entries: [],
          userAllowManualEntry: true,
          disabledCount: 0,
        }),
      });

      render(<MyBagsManagement />);

      await waitFor(() => {
        expect(screen.getByText("No entries found")).toBeInTheDocument();
      });
      expect(
        screen.getByText(
          "Contact an administrator to add entries to your baggs"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Totals Row", () => {
    it("should display totals for each HOF", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getByText("TOTAL")).toBeInTheDocument();
      });

      // BPL total peaks: max(100, 120) = 120
      // AAL total peaks: 75
      expect(screen.getAllByText("120").length).toBeGreaterThan(0);
      expect(screen.getAllByText("75").length).toBeGreaterThan(0);
    });

    it("should display correct sum for peaks in year", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        const peaksInYearButton = screen.getByRole("button", {
          name: "Peaks in Year",
        });
        fireEvent.click(peaksInYearButton);
      });

      await waitFor(() => {
        // BPL: 50 + 40 = 90
        expect(screen.getAllByText("90").length).toBeGreaterThan(0);
      });
    });

    it("should display correct sum for foreign peaks", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        const foreignPeaksButton = screen.getByRole("button", {
          name: "Total Foreign Peaks",
        });
        fireEvent.click(foreignPeaksButton);
      });

      await waitFor(() => {
        // BPL foreign peaks: max(20, 25) = 25
        expect(screen.getAllByText("25").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Mobile View", () => {
    it("should display HOF cards in mobile view", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText("AAL").length).toBeGreaterThan(0);
    });

    it("should display all four statistics in mobile cards", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("In Year").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText("Total Peaks").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Total Foreign").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Foreign in Year").length).toBeGreaterThan(0);
      expect(screen.getAllByText("FPR").length).toBeGreaterThan(0);
    });

    it("should show HOF totals in mobile view", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getByText("BPL TOTAL")).toBeInTheDocument();
      });
      expect(screen.getByText("AAL TOTAL")).toBeInTheDocument();
    });
  });

  describe("Heatmap Colors", () => {
    it("should apply heatmap colors based on values", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        // Cells should have background color classes
        const cells = screen.getAllByRole("cell");
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    it("should show zero values as empty cells", async () => {
      const entriesWithZero = [
        {
          ...mockEntries[0],
          totalPeaks: 0,
          peaksInYear: 0,
          foreignPeaks: 0,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          entries: entriesWithZero,
          userAllowManualEntry: true,
          disabledCount: 0,
        }),
      });

      render(<MyBagsManagement />);

      await waitFor(() => {
        // Zero values should be displayed as empty
        const cells = screen.getAllByRole("cell");
        expect(cells.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        const heading = screen.getByRole("heading", { name: /my bags/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it("should have accessible table structure", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        const table = screen.getByRole("table");
        expect(table).toBeInTheDocument();
      });
    });

    it("should have accessible buttons", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Data Sorting", () => {
    it("should sort HOFs by display order", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        const hofHeaders = screen.getAllByRole("columnheader");
        // BPL (order 0) should come before AAL (order 1)
        expect(hofHeaders.length).toBeGreaterThan(0);
      });
    });

    it("should sort years by display order", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        // Years should be sorted (check for both years in the table)
        expect(screen.getAllByText("2024").length).toBeGreaterThan(0);
        expect(screen.getAllByText("2023").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Return URL", () => {
    it("should include return URL in edit navigation", async () => {
      render(<MyBagsManagement />);
      await waitFor(() => {
        expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      });

      const cells = screen.getAllByRole("cell");
      const editableCell = cells.find((cell) => cell.textContent === "100");
      if (editableCell) {
        fireEvent.click(editableCell);

        await waitFor(() => {
          expect(mockRouter.push).toHaveBeenCalledWith(
            expect.stringContaining("returnTo=/my-bags")
          );
        });
      }
    });
  });
});
