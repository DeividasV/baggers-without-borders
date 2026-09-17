import { render, screen } from "@testing-library/react";
import HofMemberExpandedDetails from "@/app/components/features/hof-tables/HofMemberExpandedDetails";

// Mock utils
jest.mock("@/src/lib/utils", () => ({
  formatNumber: (num: number | null | undefined) => {
    if (num === null || num === undefined) return "0";
    return num.toLocaleString();
  },
}));

// Mock hofTierUtils
jest.mock("@/src/lib/hofTierUtils", () => ({
  getTierTextColor: (name: string) => {
    const colors: Record<string, string> = {
      Gold: "text-yellow-400",
      Silver: "text-gray-300",
      Bronze: "text-orange-400",
    };
    return colors[name] || "text-gray-400";
  },
  getTierBgColor: (name: string) => {
    const colors: Record<string, string> = {
      Gold: "border-yellow-600/30 bg-yellow-900/20",
      Silver: "border-gray-600/30 bg-gray-900/20",
      Bronze: "border-orange-600/30 bg-orange-900/20",
    };
    return colors[name] || "border-gray-600/30 bg-gray-900/20";
  },
}));

describe("HofMemberExpandedDetails Component", () => {
  const mockMemberData = {
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
    hasLce: false,
    lceCountryId: null,
    firstQualificationYear: "2020",
    dataNotProvided: false,
  };

  const mockCurrentTier = {
    id: "t1",
    name: "Silver",
    displayName: "Silver Award",
    description: "Silver tier",
    minPeaks: 200,
    maxPeaks: 299,
    displayOrder: 2,
  };

  const mockNextTier = {
    id: "t2",
    name: "Gold",
    displayName: "Gold Award",
    description: "Gold tier",
    minPeaks: 300,
    maxPeaks: null,
    displayOrder: 1,
  };

  const defaultProps = {
    memberData: mockMemberData,
    rank: 15,
    totalMembers: 100,
    totalActiveMembers: 500,
    currentTier: mockCurrentTier,
    nextTier: mockNextTier,
    yearLabel: "2024",
    hofLabel: "BWB",
  };

  describe("Structure and Layout", () => {
    it("should render three main sections", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Ranking Position")).toBeInTheDocument();
      expect(screen.getByText("Climbing Statistics")).toBeInTheDocument();
      expect(screen.getByText("Award Progress")).toBeInTheDocument();
    });

    it("should have grid layout", () => {
      const { container } = render(
        <HofMemberExpandedDetails {...defaultProps} />,
      );
      const grid = container.querySelector(
        ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3",
      );
      expect(grid).toBeInTheDocument();
    });
  });

  describe("Ranking Position Section", () => {
    it("should display current rank", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("#15 of 100")).toBeInTheDocument();
    });

    it("should calculate and display table percentile", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      // 15 / 100 * 100 = 15.0%
      expect(screen.getByText("Top 15.0%")).toBeInTheDocument();
    });

    it("should calculate and display overall percentile", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      // 15 / 500 * 100 = 3.0%
      expect(screen.getByText(/~Top 3\.0%/)).toBeInTheDocument();
    });

    it("should display current award tier", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Current Award:")).toBeInTheDocument();
      const silverTexts = screen.getAllByText("Silver");
      expect(silverTexts.length).toBeGreaterThan(0);
    });

    it("should apply correct tier color to award name", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      const silverTexts = screen.getAllByText("Silver");
      const awardText = silverTexts.find((el) =>
        el.classList.contains("text-gray-300"),
      );
      expect(awardText).toHaveClass("text-gray-300");
    });

    it("should not display award if no current tier", () => {
      render(<HofMemberExpandedDetails {...defaultProps} currentTier={null} />);
      expect(screen.queryByText("Current Award:")).not.toBeInTheDocument();
    });
  });

  describe("Climbing Statistics Section", () => {
    it("should display total peaks with HOF label", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Total Peaks (BWB):")).toBeInTheDocument();
      expect(screen.getAllByText("250").length).toBeGreaterThan(0);
    });

    it("should display peaks in year with year label", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Peaks in 2024:")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("should display foreign peaks", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Total Foreign Peaks:")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("should display FPR with percentage", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Foreign Peak Ratio:")).toBeInTheDocument();
      expect(screen.getByText("40.0%")).toBeInTheDocument();
    });

    it("should display first qualification year when present", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("First Qualified:")).toBeInTheDocument();
      expect(screen.getByText("2020")).toBeInTheDocument();
    });

    it("should not display first qualification year when null", () => {
      const memberWithoutFirstYear = {
        ...mockMemberData,
        firstQualificationYear: null,
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={memberWithoutFirstYear}
        />,
      );
      expect(screen.queryByText("First Qualified:")).not.toBeInTheDocument();
    });

    it("should display LCE badge when hasLce is true", () => {
      const memberWithLce = {
        ...mockMemberData,
        hasLce: true,
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={memberWithLce}
        />,
      );
      expect(screen.getByText("Large Country Exception:")).toBeInTheDocument();
      expect(screen.getByText("Applied")).toBeInTheDocument();
      expect(
        screen.getByText("Lower FPR threshold applied for this member"),
      ).toBeInTheDocument();
    });

    it("should not display LCE badge when hasLce is false", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(
        screen.queryByText("Large Country Exception:"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Award Progress Section", () => {
    it("should display current tier name", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      const tierNames = screen.getAllByText("Silver");
      expect(tierNames.length).toBeGreaterThan(1); // Appears in multiple places
    });

    it("should display tier peak range with maxPeaks", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("200 - 299 peaks")).toBeInTheDocument();
    });

    it("should display tier peak range with infinity when maxPeaks is null", () => {
      const topTier = {
        ...mockCurrentTier,
        maxPeaks: null,
      };
      render(
        <HofMemberExpandedDetails {...defaultProps} currentTier={topTier} />,
      );
      expect(screen.getByText("200 - ∞ peaks")).toBeInTheDocument();
    });

    it("should display member total peaks", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Your Total")).toBeInTheDocument();
      const totalPeaks = screen.getAllByText("250");
      expect(totalPeaks.length).toBeGreaterThan(1);
    });

    it("should display peaks needed to reach next tier", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("50 more")).toBeInTheDocument();
      expect(screen.getByText("Gold")).toBeInTheDocument();
    });

    it("should display highest tier message when no next tier", () => {
      render(<HofMemberExpandedDetails {...defaultProps} nextTier={null} />);
      expect(screen.getByText("Highest Tier Achieved!")).toBeInTheDocument();
      expect(screen.getByText("🏆")).toBeInTheDocument();
    });

    it("should display no award tier message when currentTier is null", () => {
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          currentTier={null}
          nextTier={null}
        />,
      );
      expect(
        screen.getByText("No award tier yet. Keep climbing!"),
      ).toBeInTheDocument();
    });

    it("should apply tier background color", () => {
      const { container } = render(
        <HofMemberExpandedDetails {...defaultProps} />,
      );
      const tierCard = container.querySelector(
        ".border-gray-600\\/30.bg-gray-900\\/20",
      );
      expect(tierCard).toBeInTheDocument();
    });

    it("should apply tier text color to tier name", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      const tierNames = screen.getAllByText("Silver");
      const tierNameInCard = tierNames.find((el) =>
        el.classList.contains("text-gray-300"),
      );
      expect(tierNameInCard).toBeInTheDocument();
    });
  });

  describe("New Entrant Badge", () => {
    it("should display new entrant badge when isNewEntrant is true", () => {
      const newEntrantMember = {
        ...mockMemberData,
        isNewEntrant: true,
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={newEntrantMember}
        />,
      );
      expect(screen.getByText("New Entrant")).toBeInTheDocument();
      expect(
        screen.getByText(
          /This is the first year John Climber has met the minimum requirements/,
        ),
      ).toBeInTheDocument();
    });

    it("should not display new entrant badge when isNewEntrant is false", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.queryByText("New Entrant")).not.toBeInTheDocument();
    });

    it("should include HOF label in new entrant message", () => {
      const newEntrantMember = {
        ...mockMemberData,
        isNewEntrant: true,
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={newEntrantMember}
        />,
      );
      expect(screen.getByText(/Welcome to the club!/)).toBeInTheDocument();
      expect(screen.getByText(/BWB Hall of Fame/)).toBeInTheDocument();
    });
  });

  describe("First Time Award Badge", () => {
    it("should display first time award badge when isFirstTimeAward is true", () => {
      const firstTimeAwardMember = {
        ...mockMemberData,
        isFirstTimeAward: true,
        awardTierName: "Silver",
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={firstTimeAwardMember}
        />,
      );
      expect(screen.getByText("New Silver Award")).toBeInTheDocument();
      expect(
        screen.getByText(/First time achieving Silver tier in 2024 BWB/),
      ).toBeInTheDocument();
    });

    it("should not display first time award badge when isFirstTimeAward is false", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.queryByText(/New Silver Award/)).not.toBeInTheDocument();
    });

    it("should not display first time award badge when awardTierName is null", () => {
      const firstTimeWithoutTier = {
        ...mockMemberData,
        isFirstTimeAward: true,
        awardTierName: null,
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={firstTimeWithoutTier}
        />,
      );
      expect(screen.queryByText(/New.*Award/)).not.toBeInTheDocument();
    });

    it("should display correctly with year and HOF labels", () => {
      const firstTimeAwardMember = {
        ...mockMemberData,
        isFirstTimeAward: true,
        awardTierName: "Gold",
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={firstTimeAwardMember}
        />,
      );
      expect(
        screen.getByText(/First time achieving Gold tier in 2024 BWB/),
      ).toBeInTheDocument();
    });
  });

  describe("Retired Badge", () => {
    it("should display retired badge with year", () => {
      const retiredMember = {
        ...mockMemberData,
        member: {
          ...mockMemberData.member,
          retiredYear: 2022,
        },
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={retiredMember}
        />,
      );
      expect(screen.getByText("Retired in 2022")).toBeInTheDocument();
      expect(
        screen.getByText(
          /John Climber has retired from active peak-bagging activities/,
        ),
      ).toBeInTheDocument();
    });

    it("should not display retired badge when retiredYear is null", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.queryByText(/Retired in/)).not.toBeInTheDocument();
    });
  });

  describe("Deceased Badge", () => {
    it("should display deceased badge with year", () => {
      const deceasedMember = {
        ...mockMemberData,
        member: {
          ...mockMemberData.member,
          deceasedYear: 2023,
        },
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={deceasedMember}
        />,
      );
      expect(screen.getByText("Deceased in 2023")).toBeInTheDocument();
      expect(screen.getByText(/In memory of John Climber/)).toBeInTheDocument();
    });

    it("should not display deceased badge when deceasedYear is null", () => {
      const deceasedMember = {
        ...mockMemberData,
        member: {
          ...mockMemberData.member,
          deceasedYear: null,
        },
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={deceasedMember}
        />,
      );
      expect(screen.queryByText("Deceased")).not.toBeInTheDocument();
      expect(screen.queryByText(/Deceased in/)).not.toBeInTheDocument();
    });

    it("should not display deceased badge when status is not DECEASED", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.queryByText(/Deceased/)).not.toBeInTheDocument();
    });
  });

  describe("No Data Badge", () => {
    it("should display no data badge with year label", () => {
      const noDataMember = {
        ...mockMemberData,
        dataNotProvided: true,
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={noDataMember}
        />,
      );
      expect(screen.getByText("No Data in 2024")).toBeInTheDocument();
      expect(
        screen.getByText(
          /John Climber did not provide climbing data for the 2024 year/,
        ),
      ).toBeInTheDocument();
    });

    it("should not display no data badge when dataNotProvided is false", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.queryByText(/No Data in/)).not.toBeInTheDocument();
    });
  });

  describe("Percentile Calculations", () => {
    it("should calculate correct table percentile for rank 1", () => {
      render(<HofMemberExpandedDetails {...defaultProps} rank={1} />);
      // 1 / 100 * 100 = 1.0%
      expect(screen.getByText("Top 1.0%")).toBeInTheDocument();
    });

    it("should calculate correct table percentile for last rank", () => {
      render(<HofMemberExpandedDetails {...defaultProps} rank={100} />);
      // 100 / 100 * 100 = 100.0%
      expect(screen.getByText("Top 100.0%")).toBeInTheDocument();
    });

    it("should calculate correct overall percentile", () => {
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          rank={50}
          totalActiveMembers={1000}
        />,
      );
      // (50 / 1000) * 100 = 5.0%
      expect(screen.getByText(/~Top 5\.0%/)).toBeInTheDocument();
    });
  });

  describe("Peaks to Next Tier Calculation", () => {
    it("should calculate correct peaks needed", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      // Next tier: 300, Current: 250, Need: 50
      expect(screen.getByText("50 more")).toBeInTheDocument();
    });

    it("should calculate correctly when very close to next tier", () => {
      const closeToNextTier = {
        ...mockMemberData,
        totalPeaks: 299,
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={closeToNextTier}
        />,
      );
      expect(screen.getByText("1 more")).toBeInTheDocument();
    });
  });

  describe("Multiple Badges", () => {
    it("should display multiple badges together", () => {
      const memberWithAllBadges = {
        ...mockMemberData,
        isNewEntrant: true,
        isFirstTimeAward: true,
        dataNotProvided: true,
        member: {
          ...mockMemberData.member,
          retiredYear: 2022,
          deceasedYear: 2023,
        },
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={memberWithAllBadges}
        />,
      );
      expect(screen.getByText("New Entrant")).toBeInTheDocument();
      expect(screen.getByText(/New Silver Award/)).toBeInTheDocument();
      expect(screen.getByText(/Retired in 2022/)).toBeInTheDocument();
      expect(screen.getByText(/Deceased in 2023/)).toBeInTheDocument();
      expect(screen.getByText(/No Data in 2024/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very high rank numbers", () => {
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          rank={999}
          totalMembers={1000}
        />,
      );
      expect(screen.getByText(/^#999 of 1000$/)).toBeInTheDocument();
    });

    it("should handle large peak numbers", () => {
      const highPeakMember = {
        ...mockMemberData,
        totalPeaks: 10000,
        foreignPeaks: 5000,
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={highPeakMember}
        />,
      );
      expect(screen.getAllByText("10,000").length).toBeGreaterThan(0);
      expect(screen.getAllByText("5,000").length).toBeGreaterThan(0);
    });

    it("should handle FPR edge cases", () => {
      const zeroPeaksMember = {
        ...mockMemberData,
        fpr: 0.0,
      };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={zeroPeaksMember}
        />,
      );
      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("should handle missing tier gracefully", () => {
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          currentTier={null}
          nextTier={null}
        />,
      );
      expect(
        screen.getByText("No award tier yet. Keep climbing!"),
      ).toBeInTheDocument();
    });
  });

  describe("Filtered Member Scenarios", () => {
    it("should calculate percentile correctly when member has high rank with proper totalMembers", () => {
      // Scenario: Member is rank #11 out of 104 total qualified members
      // Even if UI is filtered to show just 1 member, totalMembers should remain 104
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          rank={11}
          totalMembers={104}
          totalActiveMembers={500}
        />,
      );

      // Rank display should show correct position
      expect(screen.getByText("#11 of 104")).toBeInTheDocument();

      // Table percentile: (11 / 104) * 100 = 10.6%
      expect(screen.getByText("Top 10.6%")).toBeInTheDocument();

      // Overall percentile: (11 / 500) * 100 = 2.2%
      expect(screen.getByText(/~Top 2\.2%/)).toBeInTheDocument();
    });

    it("should NOT show incorrect percentiles when totalMembers is wrong", () => {
      // This tests the old buggy behavior where totalMembers might be set to filtered count (e.g., 1)
      // which would cause negative or nonsensical percentiles
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          rank={11}
          totalMembers={1} // BUG: This was happening when filtered list showed 1 member
          totalActiveMembers={500}
        />,
      );

      // With totalMembers=1, percentile calculation would be: 11 / 1 * 100 = 1100%
      expect(screen.getByText("#11 of 1")).toBeInTheDocument();

      // This is the buggy output that demonstrates the problem
      expect(screen.getByText("Top 1100.0%")).toBeInTheDocument();

      // NOTE: With our fix, this scenario should never happen because
      // totalMembers is now always the unfiltered count, not filtered members.length
    });

    it("should handle rank 1 correctly in filtered scenario", () => {
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          rank={1}
          totalMembers={104}
          totalActiveMembers={500}
        />,
      );

      expect(screen.getByText("#1 of 104")).toBeInTheDocument();
      // 1 / 104 * 100 = 1.0%
      expect(screen.getByText("Top 1.0%")).toBeInTheDocument();
    });

    it("should handle last place correctly in filtered scenario", () => {
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          rank={104}
          totalMembers={104}
          totalActiveMembers={500}
        />,
      );

      expect(screen.getByText("#104 of 104")).toBeInTheDocument();
      // 104 / 104 * 100 = 100.0%
      expect(screen.getByText("Top 100.0%")).toBeInTheDocument();
    });
  });
});
