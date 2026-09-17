import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProgressRegister from "@/app/components/features/hof-tables/ProgressRegister";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
}));

// Mock the expanded details component
jest.mock(
  "@/app/components/features/hof-tables/ProgressRegisterExpandedDetails",
  () => {
    return function MockProgressRegisterExpandedDetails({ memberData }: any) {
      return (
        <div data-testid={`expanded-details-${memberData.member.id}`}>
          <p>Progress Details for {memberData.member.displayName}</p>
        </div>
      );
    };
  },
);

// Mock utils
jest.mock("@/src/lib/utils", () => ({
  formatNumber: (num: number) => num.toLocaleString(),
}));

describe("ProgressRegister Component", () => {
  const mockConfig = {
    minPeaks: 100,
    minForeignPeaks: 25,
    minFpr: 20,
    minimumAge: 18,
    lceMinFpr: 15,
  };

  const mockMembers = [
    {
      member: {
        id: "m1",
        username: "user1",
        displayName: "Alice Young",
        status: "ACTIVE",
        birthYear: 2010,
        retiredYear: null,
        deceasedYear: null,
      },
      totalPeaks: 50,
      peaksInYear: 10,
      foreignPeaks: 15,
      fpr: 30.0,
      firstQualificationYear: null,
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
    {
      member: {
        id: "m2",
        username: "user2",
        displayName: "Bob National",
        status: "ACTIVE",
        birthYear: 1990,
        retiredYear: null,
        deceasedYear: null,
      },
      totalPeaks: 150,
      peaksInYear: 20,
      foreignPeaks: 15,
      fpr: 10.0,
      firstQualificationYear: null,
      dataNotProvided: false,
      isNewEntrant: false,
      hasLce: false,
      lceCountryId: null,
      failedMinimumAge: false,
      failedMinimumPeaks: false,
      failedMinimumForeignPeaks: false,
      failedMinimumFpr: true,
      memberAge: 34,
    },
    {
      member: {
        id: "m3",
        username: "user3",
        displayName: "Carol Missing",
        status: "ACTIVE",
        birthYear: null,
        retiredYear: null,
        deceasedYear: null,
      },
      totalPeaks: 80,
      peaksInYear: 15,
      foreignPeaks: 20,
      fpr: 25.0,
      firstQualificationYear: null,
      dataNotProvided: false,
      isNewEntrant: false,
      hasLce: false,
      lceCountryId: null,
      failedMinimumAge: true,
      failedMinimumPeaks: true,
      failedMinimumForeignPeaks: false,
      failedMinimumFpr: false,
      memberAge: null,
    },
  ];

  const defaultProps = {
    members: mockMembers,
    yearLabel: "2024",
    yearValue: 2024,
    hofLabel: "BWB",
    currentUserId: undefined,
    minimumAge: 18,
    config: mockConfig,
    selectedBadges: new Set<string>(),
    onBadgeToggle: jest.fn(),
  };

  describe("Section Header", () => {
    it("should render section header", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(screen.getByText("Progress Register")).toBeInTheDocument();
    });

    it("should render description with HOF and year labels", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(
        screen.getByText(
          /Members who participated but did not meet all qualification requirements for BWB in 2024/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should return null when no members", () => {
      const { container } = render(
        <ProgressRegister {...defaultProps} members={[]} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should show empty state when members array is empty after filtering", () => {
      render(<ProgressRegister {...defaultProps} members={[]} />);
      expect(screen.queryByText("Progress Register")).not.toBeInTheDocument();
    });
  });

  describe("Desktop Table - Structure", () => {
    it("should render table with headers", () => {
      render(<ProgressRegister {...defaultProps} />);
      const table = screen.getAllByRole("table")[0];
      expect(within(table).getByText("Member")).toBeInTheDocument();
      expect(within(table).getByText("Total peaks")).toBeInTheDocument();
      expect(within(table).getByText(/Peaks in 2024/)).toBeInTheDocument();
      expect(within(table).getByText("FPR")).toBeInTheDocument();
    });

    it("should render all members", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(screen.getAllByText("Alice Young")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Bob National")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Carol Missing")[0]).toBeInTheDocument();
    });

    it("should sort members by total peaks descending", () => {
      render(<ProgressRegister {...defaultProps} />);
      const allButtons = screen.getAllByRole("button");
      const desktopRows = allButtons.filter((btn) =>
        btn.getAttribute("aria-label")?.includes("total peaks"),
      );

      // Bob has 150 peaks (highest), Carol has 80, Alice has 50
      expect(desktopRows[0]?.getAttribute("aria-label")).toContain(
        "Bob National",
      );
      expect(desktopRows[1]?.getAttribute("aria-label")).toContain(
        "Carol Missing",
      );
      expect(desktopRows[2]?.getAttribute("aria-label")).toContain(
        "Alice Young",
      );
    });
  });

  describe("Desktop Table - Member Data", () => {
    it("should display dash in rank column", () => {
      render(<ProgressRegister {...defaultProps} />);
      const table = screen.getAllByRole("table")[0];
      const dashes = within(table).getAllByText("-");
      expect(dashes.length).toBeGreaterThan(0);
    });

    it("should format total peaks correctly", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(screen.getAllByText("150").length).toBeGreaterThan(0);
      expect(screen.getAllByText("80").length).toBeGreaterThan(0);
      expect(screen.getAllByText("50").length).toBeGreaterThan(0);
    });

    it("should display peaks in year", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(screen.getAllByText("20").length).toBeGreaterThan(0);
      expect(screen.getAllByText("15").length).toBeGreaterThan(0);
      expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    });

    it("should display FPR with percentage", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(screen.getAllByText("30.0%").length).toBeGreaterThan(0);
      expect(screen.getAllByText("10.0%").length).toBeGreaterThan(0);
      expect(screen.getAllByText("25.0%").length).toBeGreaterThan(0);
    });

    it("should display dash for zero peaks in year", () => {
      const memberWithZeroPeaks = [
        {
          ...mockMembers[0],
          peaksInYear: 0,
        },
      ];
      render(
        <ProgressRegister {...defaultProps} members={memberWithZeroPeaks} />,
      );
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe("Desktop Table - Badge Display", () => {
    it("should show You badge for current user", () => {
      render(<ProgressRegister {...defaultProps} currentUserId="m1" />);
      expect(screen.getAllByText("You")[0]).toBeInTheDocument();
      expect(screen.getAllByText("You")[0]).toHaveClass(
        "bg-primary-600/20",
        "text-primary-400",
      );
    });

    it("should show New Entrant badge", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(screen.getAllByText("New Entrant")[0]).toBeInTheDocument();
      expect(screen.getAllByText("New Entrant")[0]).toHaveClass(
        "bg-green-600/20",
        "text-green-400",
      );
    });

    it("should show Junior badge when member is below minimum age", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(screen.getAllByText("Junior")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Junior")[0]).toHaveClass(
        "bg-blue-600/20",
        "text-blue-400",
      );
    });

    it("should show National badge when has sufficient minimum peaks", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(screen.getAllByText("National")[0]).toBeInTheDocument();
      expect(screen.getAllByText("National")[0]).toHaveClass(
        "bg-yellow-600/20",
        "text-yellow-400",
      );
    });

    it("should show Missing Data badge when birth year is null", () => {
      render(<ProgressRegister {...defaultProps} />);
      expect(screen.getAllByText("Missing Data")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Missing Data")[0]).toHaveClass(
        "bg-gray-600/20",
        "text-gray-500",
      );
    });

    it("should show Retired badge with year", () => {
      const retiredMember = [
        {
          ...mockMembers[0],
          member: { ...mockMembers[0].member, retiredYear: 2022 },
        },
      ];
      render(<ProgressRegister {...defaultProps} members={retiredMember} />);
      expect(screen.getAllByText(/Retired in 2022/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Retired in 2022/)[0]).toHaveClass(
        "bg-blue-600/20",
        "text-blue-400",
      );
    });

    it("should show Deceased badge with year", () => {
      const deceasedMember = [
        {
          ...mockMembers[0],
          member: {
            ...mockMembers[0].member,
            deceasedYear: 2023,
          },
        },
      ];
      render(<ProgressRegister {...defaultProps} members={deceasedMember} />);
      expect(screen.getAllByText(/Deceased in 2023/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Deceased in 2023/)[0]).toHaveClass(
        "bg-gray-600/20",
        "text-gray-400",
      );
    });

    it("should show LCE badge for members from LCE countries", () => {
      const lceMember = [
        {
          ...mockMembers[0],
          isFromLceCountry: true,
        },
      ];
      render(<ProgressRegister {...defaultProps} members={lceMember} />);
      expect(screen.getAllByText("LCE")[0]).toBeInTheDocument();
      expect(screen.getAllByText("LCE")[0]).toHaveClass(
        "bg-primary-600/20",
        "text-primary-400",
      );
    });

    it("should show No Data badge with year label", () => {
      const noDataMember = [
        {
          ...mockMembers[0],
          dataNotProvided: true,
        },
      ];
      render(<ProgressRegister {...defaultProps} members={noDataMember} />);
      expect(screen.getAllByText("No Data in 2024")[0]).toBeInTheDocument();
      expect(screen.getAllByText("No Data in 2024")[0]).toHaveClass(
        "bg-gray-600/20",
        "text-gray-500",
      );
    });
  });

  describe("Desktop Table - Current User Highlighting", () => {
    it("should highlight current user row", () => {
      render(<ProgressRegister {...defaultProps} currentUserId="m1" />);
      const row = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-label")?.includes("Alice Young"));
      expect(row).toHaveClass("ring-2", "ring-primary-600/30");
    });

    it("should apply primary color to current user text", () => {
      render(<ProgressRegister {...defaultProps} currentUserId="m2" />);
      const bobName = screen.getAllByText("Bob National")[0];
      expect(bobName).toHaveClass("text-primary-200");
    });
  });

  describe("Desktop Table - Row Expansion", () => {
    it("should show chevron down when collapsed", () => {
      render(<ProgressRegister {...defaultProps} />);
      const chevronDowns = screen.getAllByTestId("chevron-down-icon");
      expect(chevronDowns.length).toBeGreaterThan(0);
    });

    it("should toggle row expansion on click", async () => {
      const user = userEvent.setup();
      render(<ProgressRegister {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );
      expect(firstRow).toHaveAttribute("aria-expanded", "false");

      await user.click(firstRow!);
      expect(firstRow).toHaveAttribute("aria-expanded", "true");
    });

    it("should show chevron up when expanded", async () => {
      const user = userEvent.setup();
      render(<ProgressRegister {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );

      await user.click(firstRow!);
      expect(screen.getAllByTestId("chevron-up-icon")[0]).toBeInTheDocument();
    });

    it("should render expanded details when row is expanded", async () => {
      const user = userEvent.setup();
      render(<ProgressRegister {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );

      await user.click(firstRow!);
      expect(
        screen.getAllByTestId("expanded-details-m2")[0],
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(/Progress Details for Bob National/)[0],
      ).toBeInTheDocument();
    });

    it("should collapse row when clicked again", async () => {
      const user = userEvent.setup();
      render(<ProgressRegister {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );

      await user.click(firstRow!);
      expect(
        screen.getAllByTestId("expanded-details-m2").length,
      ).toBeGreaterThan(0);

      await user.click(firstRow!);
      expect(screen.queryAllByTestId("expanded-details-m2").length).toBe(0);
    });

    it("should collapse other rows when expanding new row", async () => {
      const user = userEvent.setup();
      render(<ProgressRegister {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );
      const secondRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Carol Missing"),
        );

      await user.click(firstRow!);
      expect(
        screen.getAllByTestId("expanded-details-m2").length,
      ).toBeGreaterThan(0);

      await user.click(secondRow!);
      expect(screen.queryAllByTestId("expanded-details-m2").length).toBe(0);
      expect(
        screen.getAllByTestId("expanded-details-m3").length,
      ).toBeGreaterThan(0);
    });

    it("should support keyboard navigation with Enter", async () => {
      const user = userEvent.setup();
      render(<ProgressRegister {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );

      firstRow?.focus();
      await user.keyboard("{Enter}");
      expect(
        screen.getAllByTestId("expanded-details-m2").length,
      ).toBeGreaterThan(0);
    });

    it("should support keyboard navigation with Space", async () => {
      const user = userEvent.setup();
      render(<ProgressRegister {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );

      firstRow?.focus();
      await user.keyboard(" ");
      expect(
        screen.getAllByTestId("expanded-details-m2").length,
      ).toBeGreaterThan(0);
    });
  });

  describe("Desktop Table - Accessibility", () => {
    it("should have role button on clickable rows", () => {
      render(<ProgressRegister {...defaultProps} />);
      const buttons = screen
        .getAllByRole("button")
        .filter((btn) =>
          btn.getAttribute("aria-label")?.includes("total peaks"),
        );
      expect(buttons.length).toBe(mockMembers.length);
    });

    it("should have tabIndex 0 on clickable rows", () => {
      render(<ProgressRegister {...defaultProps} />);
      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );
      expect(firstRow).toHaveAttribute("tabIndex", "0");
    });

    it("should have descriptive aria-label", () => {
      render(<ProgressRegister {...defaultProps} />);
      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );
      const ariaLabel = firstRow?.getAttribute("aria-label");
      expect(ariaLabel).toContain("Bob National");
      expect(ariaLabel).toContain("150 total peaks");
      expect(ariaLabel).toContain("Click to expand progress details");
    });

    it("should update aria-label when expanded", async () => {
      const user = userEvent.setup();
      render(<ProgressRegister {...defaultProps} />);

      const firstRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );

      expect(firstRow?.getAttribute("aria-label")).toContain("Click to expand");

      await user.click(firstRow!);
      expect(firstRow?.getAttribute("aria-label")).toContain(
        "Click to collapse",
      );
    });
  });

  describe("Mobile Card View", () => {
    it("should render mobile cards for all members", () => {
      render(<ProgressRegister {...defaultProps} />);
      const aliceCards = screen.getAllByText("Alice Young");
      expect(aliceCards.length).toBeGreaterThan(1); // Desktop + Mobile
    });

    it("should display badges in mobile view", () => {
      render(<ProgressRegister {...defaultProps} />);
      const juniorBadges = screen.getAllByText("Junior");
      expect(juniorBadges.length).toBeGreaterThanOrEqual(1);
    });

    it("should display stats in mobile cards", () => {
      render(<ProgressRegister {...defaultProps} />);
      const totalPeaksLabels = screen.getAllByText("Total Peaks");
      expect(totalPeaksLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Badge Logic", () => {
    it("should not show Junior badge when member meets minimum age", () => {
      const adultMember = [
        {
          ...mockMembers[0],
          memberAge: 20,
          failedMinimumAge: false,
        },
      ];
      render(<ProgressRegister {...defaultProps} members={adultMember} />);
      expect(screen.queryByText("Junior")).not.toBeInTheDocument();
    });

    it("should not show Missing Data badge when birth year is provided", () => {
      const memberWithBirthYear = [
        {
          ...mockMembers[2],
          member: { ...mockMembers[2].member, birthYear: 1990 },
          memberAge: 34,
          failedMinimumAge: false,
        },
      ];
      render(
        <ProgressRegister {...defaultProps} members={memberWithBirthYear} />,
      );
      expect(screen.queryByText("Missing Data")).not.toBeInTheDocument();
    });

    it("should show National badge only when peaks are sufficient", () => {
      render(<ProgressRegister {...defaultProps} />);
      // Bob National has sufficient peaks but low FPR
      const bobRow = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.getAttribute("aria-label")?.includes("Bob National"),
        );
      expect(bobRow?.innerHTML).toContain("National");
    });

    it("should not show Missing Data badge when minimumAge is 0", () => {
      render(<ProgressRegister {...defaultProps} minimumAge={0} />);
      expect(screen.queryByText("Missing Data")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single member", () => {
      render(<ProgressRegister {...defaultProps} members={[mockMembers[0]]} />);
      expect(screen.getAllByText("Alice Young")[0]).toBeInTheDocument();
    });

    it("should handle member with zero peaks in year", () => {
      const memberWithZero = [
        {
          ...mockMembers[0],
          peaksInYear: 0,
        },
      ];
      render(<ProgressRegister {...defaultProps} members={memberWithZero} />);
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThan(2); // rank dash + qualified dash + peaks dash
    });

    it("should handle member with zero total peaks", () => {
      const memberWithZeroTotal = [
        {
          ...mockMembers[0],
          totalPeaks: 0,
          fpr: 0,
          firstQualificationYear: null,
        },
      ];
      render(
        <ProgressRegister {...defaultProps} members={memberWithZeroTotal} />,
      );
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThan(0);
    });

    it("should handle member with all badges", () => {
      const memberWithAllBadges = [
        {
          ...mockMembers[0],
          isNewEntrant: true,
          isFromLceCountry: true,
          dataNotProvided: true,
          member: {
            ...mockMembers[0].member,
            retiredYear: 2022,
            deceasedYear: 2023,
          },
        },
      ];
      render(
        <ProgressRegister
          {...defaultProps}
          members={memberWithAllBadges}
          currentUserId="m1"
        />,
      );
      expect(screen.getAllByText("You")[0]).toBeInTheDocument();
      expect(screen.getAllByText("New Entrant")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Junior")[0]).toBeInTheDocument();
      expect(screen.getAllByText("LCE")[0]).toBeInTheDocument();
    });

    it("should handle very long member names", () => {
      const longNameMember = [
        {
          ...mockMembers[0],
          member: {
            ...mockMembers[0].member,
            displayName: "Very Long Member Name That Should Still Display",
          },
        },
      ];
      render(<ProgressRegister {...defaultProps} members={longNameMember} />);
      expect(
        screen.getAllByText(
          "Very Long Member Name That Should Still Display",
        )[0],
      ).toBeInTheDocument();
    });

    it("should handle large number of members", () => {
      const manyMembers = Array.from({ length: 50 }, (_, i) => ({
        ...mockMembers[0],
        member: {
          ...mockMembers[0].member,
          id: `m${i}`,
          displayName: `Member ${i}`,
        },
        totalPeaks: 100 - i, // Ensure descending order
      }));
      render(<ProgressRegister {...defaultProps} members={manyMembers} />);
      expect(screen.getAllByText("Member 0")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Member 49")[0]).toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("should maintain sorting when members have equal peaks", () => {
      const equalPeaksMembers = [
        {
          ...mockMembers[0],
          totalPeaks: 100,
          member: { ...mockMembers[0].member, displayName: "A Member" },
        },
        {
          ...mockMembers[1],
          totalPeaks: 100,
          member: { ...mockMembers[1].member, displayName: "B Member" },
        },
        {
          ...mockMembers[2],
          totalPeaks: 100,
          member: { ...mockMembers[2].member, displayName: "C Member" },
        },
      ];
      render(
        <ProgressRegister {...defaultProps} members={equalPeaksMembers} />,
      );
      expect(screen.getAllByText("A Member")[0]).toBeInTheDocument();
      expect(screen.getAllByText("B Member")[0]).toBeInTheDocument();
      expect(screen.getAllByText("C Member")[0]).toBeInTheDocument();
    });
  });
});
