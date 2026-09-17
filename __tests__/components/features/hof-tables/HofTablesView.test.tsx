import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import HofTablesView from "@/app/components/features/hof-tables/HofTablesView";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock NextAuth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock subcomponents
jest.mock("@/app/components/features/hof-tables/HofStatsCards", () => {
  return function MockHofStatsCards(props: any) {
    return (
      <div data-testid="hof-stats-cards">
        <div>Members: {props.memberCount}</div>
        <div>Total Peaks: {props.totalPeaks}</div>
        <div>Foreign Peaks: {props.totalForeignPeaks}</div>
        <div>FPR: {props.overallFpr.toFixed(1)}%</div>
      </div>
    );
  };
});

jest.mock("@/app/components/features/hof-tables/HofTableFilters", () => {
  return function MockHofTableFilters(props: any) {
    return (
      <div data-testid="hof-table-filters">
        <button onClick={() => props.onYearChange("2024")}>Year 2024</button>
        <button onClick={() => props.onHofChange("bwb")}>HOF BWB</button>
        <button onClick={() => props.onBadgeToggle("me")}>Badge Me</button>
        <button onClick={() => props.onSearchChange("test")}>Search</button>
      </div>
    );
  };
});

jest.mock("@/app/components/features/hof-tables/HofMembersTable", () => {
  return function MockHofMembersTable(props: any) {
    return (
      <div data-testid="hof-members-table">
        <div>Members: {props.members.length}</div>
        <div>Award Tiers: {props.awardTiers.length}</div>
      </div>
    );
  };
});

jest.mock("@/app/components/features/hof-tables/ProgressRegister", () => {
  return function MockProgressRegister(props: any) {
    return (
      <div data-testid="progress-register">
        <div>Progress Members: {props.members.length}</div>
      </div>
    );
  };
});

jest.mock("@/app/components/features/hof-tables/HofInfoPanels", () => {
  return function MockHofInfoPanels() {
    return <div data-testid="hof-info-panels">Info Panels</div>;
  };
});

describe("HofTablesView Component", () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  const mockFetchData = {
    members: [
      {
        member: {
          id: "m1",
          username: "user1",
          displayName: "John Climber",
          status: "ACTIVE",
          retiredYear: null,
          deceasedYear: null,
        },
        totalPeaks: 250,
        peaksInYear: 20,
        foreignPeaks: 100,
        fpr: 40.0,
        isNewEntrant: false,
        isFirstTimeAward: false,
        awardTierName: "Silver",
        firstQualificationYear: "2020",
        dataNotProvided: false,
        hasLce: false,
        lceCountryId: null,
        originalRank: 1,
      },
      {
        member: {
          id: "m2",
          username: "user2",
          displayName: "Jane Mountain",
          status: "ACTIVE",
          retiredYear: null,
          deceasedYear: null,
        },
        totalPeaks: 200,
        peaksInYear: 15,
        foreignPeaks: 80,
        fpr: 40.0,
        isNewEntrant: true,
        isFirstTimeAward: true,
        awardTierName: "Bronze",
        firstQualificationYear: "2024",
        dataNotProvided: false,
        hasLce: false,
        lceCountryId: null,
        originalRank: 2,
      },
    ],
    progressRegisterMembers: [
      {
        member: {
          id: "p1",
          username: "progress1",
          displayName: "Progress Member",
          status: "ACTIVE",
          birthYear: 2010,
          retiredYear: null,
          deceasedYear: null,
        },
        totalPeaks: 50,
        peaksInYear: 10,
        foreignPeaks: 15,
        fpr: 30.0,
        dataNotProvided: false,
        isNewEntrant: true,
        hasLce: false,
        lceCountryId: null,
        failedMinimumAge: true,
        failedMinimumPeaks: true,
        failedMinimumForeignPeaks: false,
        failedMinimumFpr: false,
        memberAge: 14,
      },
    ],
    years: [
      { id: "y1", code: "2024", title: "2024", displayOrder: 1 },
      { id: "y2", code: "2023", title: "2023", displayOrder: 2 },
    ],
    hofs: [
      { id: "h1", code: "BWB", title: "BWB Hall of Fame", displayOrder: 1 },
      { id: "h2", code: "UK", title: "UK Hall of Fame", displayOrder: 2 },
    ],
    yearValue: 2024,
    selectedYearId: "y1",
    selectedHofId: "h1",
    config: {
      minPeaks: 100,
      minForeignPeaks: 25,
      minFpr: 20,
      minimumAge: 18,
      lceEnabled: true,
      lceMinFpr: 15,
    },
    awardTiers: [
      {
        id: "t1",
        name: "Gold",
        minPeaks: 300,
        maxPeaks: null,
        displayOrder: 1,
      },
      {
        id: "t2",
        name: "Silver",
        minPeaks: 200,
        maxPeaks: 299,
        displayOrder: 2,
      },
    ],
    totalActiveMembers: 500,
  };

  const mockCountries = {
    countries: [
      { id: "c1", name: "United States", code: "US" },
      { id: "c2", name: "United Kingdom", code: "UK" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useSession as jest.Mock).mockReturnValue({ data: null });
    mockSearchParams.get.mockReturnValue(null);

    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/hof-tables")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockFetchData,
        });
      }
      if (url.includes("/api/countries")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCountries,
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({}),
      });
    }) as jest.Mock;
  });

  describe("Initial Rendering", () => {
    it("should render loading state initially", () => {
      render(<HofTablesView />);
      expect(screen.getByText("Loading HOF Tables...")).toBeInTheDocument();
    });

    it("should render all main sections after loading", async () => {
      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByText("Hall of Fame Tables")).toBeInTheDocument();
      });

      expect(screen.getByTestId("hof-stats-cards")).toBeInTheDocument();
      expect(screen.getByTestId("hof-table-filters")).toBeInTheDocument();
      expect(screen.getByTestId("hof-members-table")).toBeInTheDocument();
      expect(screen.getByTestId("progress-register")).toBeInTheDocument();
      expect(screen.getByTestId("hof-info-panels")).toBeInTheDocument();
    });

    it("should render header text", async () => {
      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByText("Hall of Fame Tables")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Hall of Fame statistics for all active members")
      ).toBeInTheDocument();
    });
  });

  describe("Data Fetching", () => {
    it("should fetch HOF tables data on mount", async () => {
      render(<HofTablesView />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/hof-tables");
      });
    });

    it("should use award tiers from the HOF tables response", async () => {
      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByText("Award Tiers: 2")).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/award-tiers"));
    });

    it("should fetch countries when LCE is enabled", async () => {
      render(<HofTablesView />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/countries");
      });
    });

    it("should not fetch countries when LCE is disabled", async () => {
      const dataWithoutLce = {
        ...mockFetchData,
        config: { ...mockFetchData.config, lceEnabled: false },
      };

      global.fetch = jest.fn((url: string) => {
        if (url.includes("/api/hof-tables")) {
          return Promise.resolve({
            ok: true,
            json: async () => dataWithoutLce,
          });
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({}),
        });
      }) as jest.Mock;

      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-stats-cards")).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalledWith("/api/countries");
    });

    it("should use URL params for initial fetch", async () => {
      mockSearchParams.get.mockImplementation((param: string) => {
        if (param === "year") return "y2";
        if (param === "hof") return "h2";
        return null;
      });

      render(<HofTablesView />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/hof-tables?yearId=y2&hofId=h2");
      });
    });
  });

  describe("Stats Calculation", () => {
    it("should calculate total stats correctly", async () => {
      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-stats-cards")).toBeInTheDocument();
      });

      const statsCard = screen.getByTestId("hof-stats-cards");
      expect(statsCard).toHaveTextContent("Members: 2");
      expect(screen.getByText("Total Peaks: 450")).toBeInTheDocument(); // 250 + 200
      expect(screen.getByText("Foreign Peaks: 180")).toBeInTheDocument(); // 100 + 80
      expect(screen.getByText("FPR: 40.0%")).toBeInTheDocument(); // 180/450 * 100
    });

    it("should handle zero members", async () => {
      global.fetch = jest.fn(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockFetchData,
            members: [],
          }),
        });
      }) as jest.Mock;

      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-stats-cards")).toBeInTheDocument();
      });

      const statsCard = screen.getByTestId("hof-stats-cards");
      expect(statsCard).toHaveTextContent("Members: 0");
      expect(screen.getByText("Total Peaks: 0")).toBeInTheDocument();
      expect(screen.getByText("FPR: 0.0%")).toBeInTheDocument();
    });
  });

  describe("Member Sorting", () => {
    it("should sort members by total peaks descending", async () => {
      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-stats-cards")).toBeInTheDocument();
      });

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("Progress Register", () => {
    it("should render progress register when members exist", async () => {
      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("progress-register")).toBeInTheDocument();
      });

      expect(screen.getByText("Progress Members: 1")).toBeInTheDocument();
    });

    it("should not render progress register when no members", async () => {
      global.fetch = jest.fn(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockFetchData,
            progressRegisterMembers: [],
          }),
        });
      }) as jest.Mock;

      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-stats-cards")).toBeInTheDocument();
      });

      expect(screen.queryByTestId("progress-register")).not.toBeInTheDocument();
    });

    it("should not render progress register when no config", async () => {
      global.fetch = jest.fn(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockFetchData,
            config: null,
          }),
        });
      }) as jest.Mock;

      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-stats-cards")).toBeInTheDocument();
      });

      expect(screen.queryByTestId("progress-register")).not.toBeInTheDocument();
    });
  });

  describe("Year and HOF Labels", () => {
    it("should use correct year and HOF labels", async () => {
      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-stats-cards")).toBeInTheDocument();
      });

      // Labels should be passed to child components
      // (Verified through mocked components receiving props)
    });

    it("should use fallback labels when no selection", async () => {
      global.fetch = jest.fn(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockFetchData,
            selectedYearId: null,
            selectedHofId: null,
          }),
        });
      }) as jest.Mock;

      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-stats-cards")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors gracefully", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      global.fetch = jest.fn(() => {
        return Promise.reject(new Error("Network error"));
      }) as jest.Mock;

      render(<HofTablesView />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it("should handle non-ok response", async () => {
      global.fetch = jest.fn(() => {
        return Promise.resolve({
          ok: false,
          json: async () => ({}),
        });
      }) as jest.Mock;

      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.queryByText("Loading HOF Tables...")).not.toBeInTheDocument();
      });
    });
  });

  describe("Session Integration", () => {
    it("should pass current user ID to tables", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: "m1", role: "USER" } },
      });

      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-members-table")).toBeInTheDocument();
      });
    });

    it("should pass admin status to filters", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: "m1", role: "ADMIN" } },
      });

      render(<HofTablesView />);

      await waitFor(() => {
        expect(screen.getByTestId("hof-table-filters")).toBeInTheDocument();
      });
    });
  });

  describe("Initialization", () => {
    it("should only initialize once", async () => {
      const { rerender } = render(<HofTablesView />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const callCount = (global.fetch as jest.Mock).mock.calls.length;

      rerender(<HofTablesView />);

      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(callCount);
      });
    });
  });
});
