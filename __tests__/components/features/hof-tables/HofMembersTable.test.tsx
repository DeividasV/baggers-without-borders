import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HofMembersTable from "@/app/components/features/hof-tables/HofMembersTable";

// Mock the UI components
jest.mock("lucide-react", () => ({
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
}));

// Mock the expanded details component
jest.mock("@/app/components/features/hof-tables/HofMemberExpandedDetails", () => {
  return function MockHofMemberExpandedDetails({ memberData, rank }: any) {
    return (
      <div data-testid={`expanded-details-${memberData.member.id}`}>
        <p>Expanded Details for {memberData.member.displayName}</p>
        <p>Rank: {rank}</p>
      </div>
    );
  };
});

// Mock utils
jest.mock("@/src/lib/utils", () => ({
  formatNumber: (num: number) => num.toLocaleString(),
}));

// Mock hofTierUtils
jest.mock("@/src/lib/hofTierUtils", () => ({
  getMemberTier: (totalPeaks: number, awardTiers: any[]) => {
    const tier = awardTiers.find(
      (t, i) =>
        totalPeaks >= t.minPeaks &&
        (i === awardTiers.length - 1 || totalPeaks < awardTiers[i + 1].minPeaks)
    );
    return tier || null;
  },
  getTierBorderColor: (tierName: string) => {
    if (tierName === "Gold") return "border-l-yellow-500";
    if (tierName === "Silver") return "border-l-gray-300";
    if (tierName === "Bronze") return "border-l-orange-600";
    return "border-l-primary-500";
  },
  getTierGradient: (tierName: string) => {
    if (tierName === "Gold") return "bg-gradient-to-r from-yellow-500/10";
    if (tierName === "Silver") return "bg-gradient-to-r from-gray-300/10";
    if (tierName === "Bronze") return "bg-gradient-to-r from-orange-600/10";
    return "";
  },
  getTierHoverBg: (tierName: string) => {
    if (tierName === "Gold") return "hover:bg-yellow-900/20";
    if (tierName === "Silver") return "hover:bg-gray-900/20";
    if (tierName === "Bronze") return "hover:bg-orange-900/20";
    return "hover:bg-primary-900/20";
  },
  getTierHoverBorder: (tierName: string) => {
    if (tierName === "Gold") return "hover:border-yellow-600/50";
    if (tierName === "Silver") return "hover:border-gray-600/50";
    if (tierName === "Bronze") return "hover:border-orange-600/50";
    return "hover:border-primary-600/50";
  },
  getTierBottomBorder: (tierName: string) => {
    if (tierName === "Gold") return "border-b-yellow-500/30";
    if (tierName === "Silver") return "border-b-gray-300/30";
    if (tierName === "Bronze") return "border-b-orange-600/30";
    return "";
  },
}));

describe("HofMembersTable Component", () => {
  const mockAwardTiers = [
    { id: "t1", name: "Bronze", minPeaks: 100, maxPeaks: 199, displayOrder: 1 },
    { id: "t2", name: "Silver", minPeaks: 200, maxPeaks: 299, displayOrder: 2 },
    {
      id: "t3",
      name: "Gold",
      minPeaks: 300,
      maxPeaks: 999999,
      displayOrder: 3,
    },
  ];

  const mockMembers = [
    {
      member: {
        id: "m1",
        username: "climber1",
        displayName: "Alice Johnson",
        status: "ACTIVE",
        retiredYear: null,
        deceasedYear: null,
      },
      totalPeaks: 350,
      peaksInYear: 50,
      foreignPeaks: 100,
      fpr: 28.6,
      isNewEntrant: false,
      isFirstTimeAward: false,
      awardTierName: "Gold",
      firstQualificationYear: "2020",
      dataNotProvided: false,
      hasLce: true,
      lceCountryId: "c1",
      originalRank: 1,
    },
    {
      member: {
        id: "m2",
        username: "climber2",
        displayName: "Bob Smith",
        status: "ACTIVE",
        retiredYear: null,
        deceasedYear: null,
      },
      totalPeaks: 250,
      peaksInYear: 30,
      foreignPeaks: 80,
      fpr: 32.0,
      isNewEntrant: true,
      isFirstTimeAward: true,
      awardTierName: "Silver",
      firstQualificationYear: "2024",
      dataNotProvided: false,
      hasLce: false,
      lceCountryId: null,
      originalRank: 2,
    },
    {
      member: {
        id: "m3",
        username: "climber3",
        displayName: "Carol Davis",
        status: "RETIRED",
        retiredYear: 2022,
        deceasedYear: null,
      },
      totalPeaks: 150,
      peaksInYear: 0,
      foreignPeaks: 40,
      fpr: 26.7,
      isNewEntrant: false,
      isFirstTimeAward: false,
      awardTierName: "Bronze",
      firstQualificationYear: "2018",
      dataNotProvided: true,
      hasLce: false,
      lceCountryId: null,
    },
  ];

  const defaultProps = {
    members: mockMembers,
    awardTiers: mockAwardTiers,
    yearLabel: "2024",
    hofLabel: "BWB",
    totalActiveMembers: 100,
    totalQualifiedMembers: 3,
    currentUserId: undefined,
  };

  describe("Section Header", () => {
    it("should render section header with title", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getByText("Hall of Fame")).toBeInTheDocument();
    });

    it("should render description with year and HOF labels", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(
        screen.getByText(/Members who meet all qualification requirements for BWB in 2024/)
      ).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no members", () => {
      render(<HofMembersTable {...defaultProps} members={[]} />);
      expect(screen.getByTestId("trophy-icon")).toBeInTheDocument();
      expect(screen.getByText("No members match the selected filters")).toBeInTheDocument();
    });

    it("should suggest adjusting filters in empty state", () => {
      render(<HofMembersTable {...defaultProps} members={[]} />);
      expect(
        screen.getByText("Try adjusting your badge filters to see more results")
      ).toBeInTheDocument();
    });
  });

  describe("Desktop Table - Structure", () => {
    it("should render table with all headers", () => {
      render(<HofMembersTable {...defaultProps} />);
      const table = screen.getAllByRole("table")[0]; // Desktop table
      expect(within(table).getByText("Rank")).toBeInTheDocument();
      expect(within(table).getByText("Member")).toBeInTheDocument();
      expect(within(table).getByText("Total peaks")).toBeInTheDocument();
      expect(within(table).getByText(/Peaks in 2024/)).toBeInTheDocument();
      expect(within(table).getByText("FPR")).toBeInTheDocument();
      expect(within(table).getByText("Qualified")).toBeInTheDocument();
    });

    it("should render all members in desktop table", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getAllByText("Alice Johnson")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Bob Smith")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Carol Davis")[0]).toBeInTheDocument();
    });

    it("should apply correct row striping classes", () => {
      render(<HofMembersTable {...defaultProps} />);
      const allButtons = screen.getAllByRole("button");

      // Find desktop table rows (they have full aria-labels with "Click to expand")
      const desktopRows = allButtons.filter((btn) =>
        btn.getAttribute("aria-label")?.includes("Click to expand")
      );

      expect(desktopRows[0]).toHaveClass("bg-dark-800/30");
      expect(desktopRows[1]).toHaveClass("bg-dark-900/30");
    });
  });

  describe("Desktop Table - Member Data", () => {
    it("should display member ranks correctly", () => {
      render(<HofMembersTable {...defaultProps} />);
      const table = screen.getAllByRole("table")[0];
      expect(within(table).getAllByText("1")[0]).toBeInTheDocument();
      expect(within(table).getAllByText("2")[0]).toBeInTheDocument();
    });

    it("should use originalRank when provided", () => {
      const membersWithRanks = [
        { ...mockMembers[0], originalRank: 5 },
        { ...mockMembers[1], originalRank: 10 },
      ];
      render(<HofMembersTable {...defaultProps} members={membersWithRanks} />);
      const table = screen.getAllByRole("table")[0];
      expect(within(table).getAllByText("5")[0]).toBeInTheDocument();
      expect(within(table).getAllByText("10")[0]).toBeInTheDocument();
    });

    it("should format total peaks with formatNumber", () => {
      render(<HofMembersTable {...defaultProps} />);
      // formatNumber mock returns toLocaleString() which is '350', '250', '150'
      expect(screen.getAllByText("350").length).toBeGreaterThan(0);
      expect(screen.getAllByText("250").length).toBeGreaterThan(0);
      expect(screen.getAllByText("150").length).toBeGreaterThan(0);
    });

    it("should display peaks in year", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getAllByText("50").length).toBeGreaterThan(0);
      expect(screen.getAllByText("30").length).toBeGreaterThan(0);
    });

    it("should display FPR with percentage and one decimal", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getAllByText("28.6%").length).toBeGreaterThan(0);
      expect(screen.getAllByText("32.0%").length).toBeGreaterThan(0);
      expect(screen.getAllByText("26.7%").length).toBeGreaterThan(0);
    });

    it("should display first qualification year", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getAllByText("2020").length).toBeGreaterThan(0);
      expect(screen.getAllByText("2024").length).toBeGreaterThan(0);
      expect(screen.getAllByText("2018").length).toBeGreaterThan(0);
    });

    it("should display dash for zero peaks", () => {
      const memberWithZeroPeaks = [
        {
          ...mockMembers[0],
          totalPeaks: 0,
          peaksInYear: 0,
        },
      ];
      render(<HofMembersTable {...defaultProps} members={memberWithZeroPeaks} />);
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe("Desktop Table - Badge Display", () => {
    it('should show "You" badge for current user', () => {
      render(<HofMembersTable {...defaultProps} currentUserId="m1" isAuthenticated={true} />);
      expect(screen.getAllByText("You")[0]).toBeInTheDocument();
      expect(screen.getAllByText("You")[0]).toHaveClass("bg-primary-600/20", "text-primary-400");
    });

    it("should show New Entrant badge", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getAllByText("New Entrant")[0]).toBeInTheDocument();
      expect(screen.getAllByText("New Entrant")[0]).toHaveClass(
        "bg-green-600/20",
        "text-green-400"
      );
    });

    it("should show New Award badge with tier name", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getAllByText("New Silver Award")[0]).toBeInTheDocument();
      expect(screen.getAllByText("New Silver Award")[0]).toHaveClass(
        "bg-yellow-600/20",
        "text-yellow-400"
      );
    });

    it("should show Retired badge with year", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getAllByText("Retired in 2022")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Retired in 2022")[0]).toHaveClass(
        "bg-blue-600/20",
        "text-blue-400"
      );
    });

    it("should show Deceased badge", () => {
      const memberDeceased = [
        {
          ...mockMembers[0],
          member: {
            ...mockMembers[0].member,
            deceasedYear: 2023,
          },
        },
      ];
      render(<HofMembersTable {...defaultProps} members={memberDeceased} />);
      expect(screen.getAllByText("Deceased in 2023")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Deceased in 2023")[0]).toHaveClass(
        "bg-gray-600/20",
        "text-gray-400"
      );
    });

    it("should show LCE badge", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getAllByText("LCE")[0]).toBeInTheDocument();
      expect(screen.getAllByText("LCE")[0]).toHaveClass("bg-primary-600/20", "text-primary-400");
    });

    it("should show No Data badge with year label", () => {
      render(<HofMembersTable {...defaultProps} />);
      expect(screen.getAllByText("No Data in 2024")[0]).toBeInTheDocument();
      expect(screen.getAllByText("No Data in 2024")[0]).toHaveClass(
        "bg-gray-600/20",
        "text-gray-500"
      );
    });

    it("should show multiple badges on same member", () => {
      const memberWithMultipleBadges = [
        {
          ...mockMembers[0],
          isNewEntrant: true,
          hasLce: true,
          member: { ...mockMembers[0].member, retiredYear: 2022 },
        },
      ];
      render(<HofMembersTable {...defaultProps} members={memberWithMultipleBadges} />);
      expect(screen.getAllByText("New Entrant")[0]).toBeInTheDocument();
      expect(screen.getAllByText("LCE")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Retired in 2022")[0]).toBeInTheDocument();
    });
  });

  describe("Desktop Table - Current User Highlighting", () => {
    it("should highlight current user row", () => {
      render(<HofMembersTable {...defaultProps} currentUserId="m1" />);
      const row = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));
      expect(row).toHaveClass("ring-2", "ring-primary-600/30");
    });

    it("should apply primary color to current user rank", () => {
      render(<HofMembersTable {...defaultProps} currentUserId="m1" />);
      const table = screen.getAllByRole("table")[0];
      const firstRank = within(table).getAllByText("1")[0];
      expect(firstRank).toHaveClass("text-primary-300");
    });

    it("should apply primary color to current user text", () => {
      render(<HofMembersTable {...defaultProps} currentUserId="m1" />);
      const displayName = screen.getAllByText("Alice Johnson")[0];
      expect(displayName).toHaveClass("text-primary-200");
    });
  });

  describe("Desktop Table - Tier Styling", () => {
    it("should apply tier border color to Gold tier", () => {
      render(<HofMembersTable {...defaultProps} />);
      const goldRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));
      expect(goldRow).toHaveClass("border-l-yellow-500");
    });

    it("should apply tier border color to Silver tier", () => {
      render(<HofMembersTable {...defaultProps} />);
      const silverRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Bob Smith"));
      expect(silverRow).toHaveClass("border-l-gray-300");
    });

    it("should apply tier border color to Bronze tier", () => {
      render(<HofMembersTable {...defaultProps} />);
      const bronzeRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Carol Davis"));
      expect(bronzeRow).toHaveClass("border-l-orange-600");
    });

    it("should apply tier gradient to rank cell", () => {
      render(<HofMembersTable {...defaultProps} />);
      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));
      // Check that the gradient class exists somewhere in the row
      expect(firstRow?.innerHTML).toContain("bg-gradient-to-r");
    });
  });

  describe("Desktop Table - Row Expansion", () => {
    it("should show chevron down icon when row is collapsed", () => {
      render(<HofMembersTable {...defaultProps} />);
      const chevronDowns = screen.getAllByTestId("chevron-down-icon");
      expect(chevronDowns.length).toBeGreaterThan(0);
    });

    it("should toggle row expansion on click", async () => {
      const user = userEvent.setup();
      render(<HofMembersTable {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));
      expect(firstRow).toHaveAttribute("aria-expanded", "false");

      await user.click(firstRow!);
      expect(firstRow).toHaveAttribute("aria-expanded", "true");
    });

    it("should show chevron up icon when row is expanded", async () => {
      const user = userEvent.setup();
      render(<HofMembersTable {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));

      await user.click(firstRow!);
      expect(screen.getAllByTestId("chevron-up-icon")[0]).toBeInTheDocument();
    });

    it("should render expanded details when row is expanded", async () => {
      const user = userEvent.setup();
      render(<HofMembersTable {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));

      await user.click(firstRow!);
      const expandedDetails = screen.getAllByTestId("expanded-details-m1");
      expect(expandedDetails.length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Expanded Details for Alice Johnson/)[0]).toBeInTheDocument();
    });

    it("should collapse row when clicked again", async () => {
      const user = userEvent.setup();
      render(<HofMembersTable {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));

      await user.click(firstRow!);
      expect(screen.getAllByTestId("expanded-details-m1").length).toBeGreaterThan(0);

      await user.click(firstRow!);
      expect(screen.queryAllByTestId("expanded-details-m1").length).toBe(0);
    });

    it("should collapse other rows when expanding a new row", async () => {
      const user = userEvent.setup();
      render(<HofMembersTable {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));
      const secondRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Bob Smith"));

      await user.click(firstRow!);
      expect(screen.getAllByTestId("expanded-details-m1").length).toBeGreaterThan(0);

      await user.click(secondRow!);
      expect(screen.queryAllByTestId("expanded-details-m1").length).toBe(0);
      expect(screen.getAllByTestId("expanded-details-m2").length).toBeGreaterThan(0);
    });

    it("should support keyboard navigation with Enter key", async () => {
      const user = userEvent.setup();
      render(<HofMembersTable {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));

      firstRow?.focus();
      await user.keyboard("{Enter}");
      expect(screen.getAllByTestId("expanded-details-m1").length).toBeGreaterThan(0);
    });

    it("should support keyboard navigation with Space key", async () => {
      const user = userEvent.setup();
      render(<HofMembersTable {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));

      firstRow?.focus();
      await user.keyboard(" ");
      expect(screen.getAllByTestId("expanded-details-m1").length).toBeGreaterThan(0);
    });
  });

  describe("Desktop Table - Accessibility", () => {
    it('should have role="button" on clickable rows', () => {
      render(<HofMembersTable {...defaultProps} />);
      const table = screen.getAllByRole("table")[0];
      const tbody = within(table).getAllByRole("rowgroup")[1];
      const buttons = within(tbody).getAllByRole("button");
      expect(buttons.length).toBe(mockMembers.length);
    });

    it("should have tabIndex=0 on clickable rows", () => {
      render(<HofMembersTable {...defaultProps} />);
      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));
      expect(firstRow).toHaveAttribute("tabIndex", "0");
    });

    it("should have descriptive aria-label on rows", () => {
      render(<HofMembersTable {...defaultProps} />);
      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));
      expect(firstRow).toHaveAttribute("aria-label");
      expect(firstRow?.getAttribute("aria-label")).toContain("Alice Johnson");
      expect(firstRow?.getAttribute("aria-label")).toContain("Rank 1");
      expect(firstRow?.getAttribute("aria-label")).toContain("350 total peaks");
      expect(firstRow?.getAttribute("aria-label")).toContain("Click to expand details");
    });

    it("should update aria-label when row is expanded", async () => {
      const user = userEvent.setup();
      render(<HofMembersTable {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Johnson"));

      expect(firstRow?.getAttribute("aria-label")).toContain("Click to expand details");

      await user.click(firstRow!);
      expect(firstRow?.getAttribute("aria-label")).toContain("Click to collapse details");
    });
  });

  describe("Mobile Card View - Structure", () => {
    beforeEach(() => {
      // Mock window.matchMedia to simulate mobile view
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === "(max-width: 768px)",
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });

    it("should render mobile cards for each member", () => {
      render(<HofMembersTable {...defaultProps} />);
      // Mobile cards also contain member names
      const aliceCards = screen.getAllByText("Alice Johnson");
      expect(aliceCards.length).toBeGreaterThan(1); // Desktop + Mobile
    });

    it("should display member badges in mobile view", () => {
      render(<HofMembersTable {...defaultProps} />);
      // Should have both desktop and mobile badges
      const newEntrantBadges = screen.getAllByText("New Entrant");
      expect(newEntrantBadges.length).toBeGreaterThan(1);
    });

    it("should display stats grid in mobile cards", () => {
      render(<HofMembersTable {...defaultProps} />);
      // Check for mobile-specific stat labels
      const totalPeaksLabels = screen.getAllByText("Total peaks");
      expect(totalPeaksLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single member", () => {
      render(<HofMembersTable {...defaultProps} members={[mockMembers[0]]} />);
      expect(screen.getAllByText("Alice Johnson")[0]).toBeInTheDocument();
    });

    it("should handle member without tier", () => {
      const memberWithoutTier = [
        {
          ...mockMembers[0],
          totalPeaks: 50, // Below minimum tier threshold
        },
      ];
      render(<HofMembersTable {...defaultProps} members={memberWithoutTier} />);
      expect(screen.getAllByText("Alice Johnson")[0]).toBeInTheDocument();
    });

    it("should handle null firstQualificationYear", () => {
      const memberWithoutQualYear = [
        {
          ...mockMembers[0],
          firstQualificationYear: null,
        },
      ];
      render(<HofMembersTable {...defaultProps} members={memberWithoutQualYear} />);
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThan(0);
    });

    it("should handle member with all badges", () => {
      const memberWithAllBadges = [
        {
          ...mockMembers[0],
          isNewEntrant: true,
          isFirstTimeAward: true,
          hasLce: true,
          dataNotProvided: true,
          member: {
            ...mockMembers[0].member,
            retiredYear: 2022,
            deceasedYear: 2023,
          },
        },
      ];
      render(
        <HofMembersTable
          {...defaultProps}
          members={memberWithAllBadges}
          currentUserId="m1"
          isAuthenticated={true}
        />
      );
      expect(screen.getAllByText("You")[0]).toBeInTheDocument();
      expect(screen.getAllByText("New Entrant")[0]).toBeInTheDocument();
      expect(screen.getAllByText("LCE")[0]).toBeInTheDocument();
      expect(screen.getAllByText("No Data in 2024")[0]).toBeInTheDocument();
    });

    it("should handle very long member names", () => {
      const memberWithLongName = [
        {
          ...mockMembers[0],
          member: {
            ...mockMembers[0].member,
            displayName: "Very Long Member Name That Should Still Display Correctly",
          },
        },
      ];
      render(<HofMembersTable {...defaultProps} members={memberWithLongName} />);
      expect(
        screen.getAllByText("Very Long Member Name That Should Still Display Correctly")[0]
      ).toBeInTheDocument();
    });

    it("should handle large numbers of members", () => {
      const manyMembers = Array.from({ length: 50 }, (_, i) => ({
        ...mockMembers[0],
        member: {
          ...mockMembers[0].member,
          id: `m${i}`,
          displayName: `Member ${i}`,
        },
      }));
      render(<HofMembersTable {...defaultProps} members={manyMembers} />);
      expect(screen.getAllByText("Member 0")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Member 49")[0]).toBeInTheDocument();
    });
  });
});
