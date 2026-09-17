import { render, screen } from "@testing-library/react";
import ProgressRegisterExpandedDetails from "@/app/components/features/hof-tables/ProgressRegisterExpandedDetails";

// Mock utils
jest.mock("@/src/lib/utils", () => ({
  formatNumber: (num: number | null | undefined) => {
    if (num === null || num === undefined) return "0";
    return num.toLocaleString();
  },
}));

describe("ProgressRegisterExpandedDetails Component", () => {
  const mockConfig = {
    minPeaks: 100,
    minForeignPeaks: 25,
    minFpr: 20,
    minimumAge: 18,
    minimumAgeEnabled: true,
    lceMinFpr: 15,
  };

  const mockMemberData = {
    member: {
      id: "m1",
      username: "user1",
      displayName: "John Climber",
      status: "ACTIVE",
      birthYear: 2005,
      retiredYear: null,
      deceasedYear: null,
    },
    totalPeaks: 80,
    peaksInYear: 15,
    foreignPeaks: 20,
    fpr: 25.0,
    dataNotProvided: false,
    isNewEntrant: true,
    hasLce: false,
    lceCountryId: null,
    isFromLceCountry: false,
    failedMinimumAge: true,
    failedMinimumPeaks: true,
    failedMinimumForeignPeaks: false,
    failedMinimumFpr: false,
    memberAge: 19,
  };

  const defaultProps = {
    memberData: mockMemberData,
    config: mockConfig,
    yearLabel: "2024",
    hofLabel: "BWB",
  };

  describe("Header Section", () => {
    it("should render header with year and HOF labels", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(
        screen.getByText(
          "Progress Toward Qualification — Hall of Fame BWB of 2024",
        ),
      ).toBeInTheDocument();
    });

    it("should render description", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(
        screen.getByText(
          "Track requirements needed to qualify for this Hall of Fame",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Total Peaks Requirement", () => {
    it("should display total peaks requirement when minPeaks > 0", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Total Peaks")).toBeInTheDocument();
    });

    it("should show Not Met status when failed", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      const notMetBadges = screen.getAllByText("Not Met");
      expect(notMetBadges.length).toBeGreaterThan(0);
    });

    it("should show Met status when passed", () => {
      const passingMember = {
        ...mockMemberData,
        failedMinimumPeaks: false,
        totalPeaks: 120,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={passingMember}
        />,
      );
      const metBadges = screen.getAllByText(/Met ✓/);
      expect(metBadges.length).toBeGreaterThan(0);
    });

    it("should display required peaks", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      const peaksSection = screen
        .getByText("Total Peaks")
        .closest(".space-y-2");
      expect(peaksSection).toHaveTextContent("Required:");
      expect(peaksSection).toHaveTextContent("100");
    });

    it("should display current peaks", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      const peaksSection = screen
        .getByText("Total Peaks")
        .closest(".space-y-2");
      expect(peaksSection).toHaveTextContent("Current:");
      expect(peaksSection).toHaveTextContent("80");
    });

    it("should display peaks still needed", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      const peaksSection = screen
        .getByText("Total Peaks")
        .closest(".space-y-2");
      expect(peaksSection).toHaveTextContent("Still Needed:");
      expect(peaksSection).toHaveTextContent("20 more");
    });

    it("should not display still needed when requirement is met", () => {
      const passingMember = {
        ...mockMemberData,
        failedMinimumPeaks: false,
        totalPeaks: 120,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={passingMember}
        />,
      );
      const allTexts = screen.queryAllByText(/20 more/);
      expect(allTexts.length).toBe(0);
    });

    it("should display progress bar", () => {
      const { container } = render(
        <ProgressRegisterExpandedDetails {...defaultProps} />,
      );
      const progressBars = container.querySelectorAll(
        ".bg-dark-700.rounded-full",
      );
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it("should display progress percentage", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      // 80/100 = 80%
      const progressTexts = screen.getAllByText("80.0% complete");
      expect(progressTexts.length).toBeGreaterThan(0);
    });

    it("should use red color for failed requirement", () => {
      const { container } = render(
        <ProgressRegisterExpandedDetails {...defaultProps} />,
      );
      const redBars = container.querySelectorAll(".bg-red-500");
      expect(redBars.length).toBeGreaterThan(0);
    });

    it("should use green color for met requirement", () => {
      const passingMember = {
        ...mockMemberData,
        failedMinimumPeaks: false,
        totalPeaks: 120,
      };
      const { container } = render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={passingMember}
        />,
      );
      const greenBars = container.querySelectorAll(".bg-green-500");
      expect(greenBars.length).toBeGreaterThan(0);
    });

    it("should not render when minPeaks is 0", () => {
      const configWithoutPeaks = { ...mockConfig, minPeaks: 0 };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          config={configWithoutPeaks}
        />,
      );
      const totalPeaksHeaders = screen.queryAllByText("Total Peaks");
      expect(totalPeaksHeaders.length).toBe(0);
    });
  });

  describe("Foreign Peaks Requirement", () => {
    it("should display foreign peaks requirement when minForeignPeaks > 0", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Foreign Peaks")).toBeInTheDocument();
    });

    it("should show Met status", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      const foreignPeaksSection = screen
        .getByText("Foreign Peaks")
        .closest("div");
      expect(foreignPeaksSection?.innerHTML).toContain("Met ✓");
    });

    it("should display required foreign peaks", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(screen.getByText("25")).toBeInTheDocument();
    });

    it("should display current foreign peaks", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      const currentValues = screen.getAllByText("20");
      expect(currentValues.length).toBeGreaterThan(0);
    });

    it("should display progress percentage", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      // 20/25 = 80%
      const progressTexts = screen.getAllByText(/80\.0% complete/);
      expect(progressTexts.length).toBeGreaterThan(0);
    });

    it("should not render when minForeignPeaks is 0", () => {
      const configWithoutForeignPeaks = { ...mockConfig, minForeignPeaks: 0 };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          config={configWithoutForeignPeaks}
        />,
      );
      expect(screen.queryByText("Foreign Peaks")).not.toBeInTheDocument();
    });
  });

  describe("FPR Requirement", () => {
    it("should display FPR requirement when minFpr > 0", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Foreign Peaks Ratio (FPR)")).toBeInTheDocument();
    });

    it("should show Met status", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      const fprSection = screen
        .getByText("Foreign Peaks Ratio (FPR)")
        .closest("div");
      expect(fprSection?.innerHTML).toContain("Met ✓");
    });

    it("should display required FPR", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(screen.getByText("20.0%")).toBeInTheDocument();
    });

    it("should display current FPR", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(screen.getByText("25.0%")).toBeInTheDocument();
    });

    it("should display LCE indicator when member is from LCE country", () => {
      const lceMember = {
        ...mockMemberData,
        isFromLceCountry: true,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={lceMember}
        />,
      );
      expect(screen.getByText(/15\.0% \(LCE\)/)).toBeInTheDocument();
    });

    it("should use LCE FPR when member is from LCE country", () => {
      const lceMember = {
        ...mockMemberData,
        isFromLceCountry: true,
        fpr: 16.0,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={lceMember}
        />,
      );
      expect(screen.getByText("15.0% (LCE)")).toBeInTheDocument();
    });

    it("should display FPR shortfall when failed", () => {
      const failedFprMember = {
        ...mockMemberData,
        fpr: 10.0,
        failedMinimumFpr: true,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={failedFprMember}
        />,
      );
      expect(screen.getByText("+10.0%")).toBeInTheDocument();
    });

    it("should display progress percentage", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      // 25/20 = 125%, capped at 100%
      const progressTexts = screen.getAllByText(/100\.0% complete/);
      expect(progressTexts.length).toBeGreaterThan(0);
    });

    it("should not render when minFpr is 0", () => {
      const configWithoutFpr = { ...mockConfig, minFpr: 0 };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          config={configWithoutFpr}
        />,
      );
      expect(
        screen.queryByText("Foreign Peaks Ratio (FPR)"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Age Requirement", () => {
    it("should display age requirement when minimumAge > 0", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Minimum Age")).toBeInTheDocument();
    });

    it("should show Not Met status when failed", () => {
      const youngMember = {
        ...mockMemberData,
        failedMinimumAge: true,
        memberAge: 16,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={youngMember}
        />,
      );
      const ageSection = screen.getByText("Minimum Age").closest("div");
      expect(ageSection?.innerHTML).toContain("Not Met");
    });

    it("should show Met status when passed", () => {
      const adultMember = {
        ...mockMemberData,
        failedMinimumAge: false,
        memberAge: 20,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={adultMember}
        />,
      );
      const ageSection = screen.getByText("Minimum Age").closest("div");
      expect(ageSection?.innerHTML).toContain("Met");
    });

    it("should display required age", () => {
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          currentUserId="m1"
        />,
      );
      expect(screen.getByText(/18 years/)).toBeInTheDocument();
    });

    it("should display current age", () => {
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          currentUserId="m1"
        />,
      );
      expect(screen.getByText(/19 years/)).toBeInTheDocument();
    });

    it("should display unknown age when memberAge is null", () => {
      const noAgeMember = {
        ...mockMemberData,
        memberAge: null,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={noAgeMember}
          currentUserId="m1"
        />,
      );
      expect(screen.getByText(/Not provided/)).toBeInTheDocument();
    });

    it("should display years until eligible", () => {
      const youngMember = {
        ...mockMemberData,
        failedMinimumAge: true,
        memberAge: 15,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={youngMember}
          currentUserId="m1"
        />,
      );
      expect(screen.getByText("Years Until Eligible:")).toBeInTheDocument();
      expect(screen.getByText(/3 more/)).toBeInTheDocument();
    });

    it("should not display progress bar when memberAge is null", () => {
      const noAgeMember = {
        ...mockMemberData,
        memberAge: null,
      };
      const { container } = render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={noAgeMember}
        />,
      );
      // Should have fewer progress bars than when age is known
      const progressBars = container.querySelectorAll(
        ".bg-dark-700.rounded-full",
      );
      expect(progressBars.length).toBeLessThan(4);
    });

    it("should display progress percentage when memberAge is known", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      // 19/18 = 105.6%, capped at 100%
      const progressTexts = screen.getAllByText(/100\.0% complete/);
      expect(progressTexts.length).toBeGreaterThan(0);
    });

    it("should not render when minimumAge is 0", () => {
      const configWithoutAge = { ...mockConfig, minimumAge: 0 };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          config={configWithoutAge}
        />,
      );
      expect(screen.queryByText("Minimum Age")).not.toBeInTheDocument();
    });
  });

  describe("Summary Section", () => {
    it("should render summary section", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Summary")).toBeInTheDocument();
    });

    it("should display peaks shortfall message", () => {
      const peaksOnlyFailed = {
        ...mockMemberData,
        failedMinimumPeaks: true,
        failedMinimumForeignPeaks: false,
        failedMinimumFpr: false,
        failedMinimumAge: false,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={peaksOnlyFailed}
        />,
      );
      expect(
        screen.getByText(
          /Keep climbing! You need 20 more peaks to meet the minimum requirement/,
        ),
      ).toBeInTheDocument();
    });

    it("should display foreign peaks shortfall message", () => {
      const foreignPeaksOnlyFailed = {
        ...mockMemberData,
        failedMinimumPeaks: false,
        failedMinimumForeignPeaks: true,
        failedMinimumFpr: false,
        failedMinimumAge: false,
        totalPeaks: 120,
        foreignPeaks: 20,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={foreignPeaksOnlyFailed}
        />,
      );
      expect(
        screen.getByText(
          /Focus on international peaks! You need 5 more foreign peaks/,
        ),
      ).toBeInTheDocument();
    });

    it("should display FPR shortfall message", () => {
      const fprOnlyFailed = {
        ...mockMemberData,
        failedMinimumPeaks: false,
        failedMinimumForeignPeaks: false,
        failedMinimumFpr: true,
        failedMinimumAge: false,
        totalPeaks: 120,
        fpr: 15.0,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={fprOnlyFailed}
        />,
      );
      expect(
        screen.getByText(
          /Increase your international climbing! You need to raise your FPR by 5\.0%/,
        ),
      ).toBeInTheDocument();
    });

    it("should display age shortfall message", () => {
      const ageOnlyFailed = {
        ...mockMemberData,
        failedMinimumPeaks: false,
        failedMinimumForeignPeaks: false,
        failedMinimumFpr: false,
        failedMinimumAge: true,
        totalPeaks: 120,
        memberAge: 16,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={ageOnlyFailed}
          currentUserId="m1"
        />,
      );
      expect(
        screen.getByText(
          /You're making great progress! Age requirement will be automatically met in 2 years/,
        ),
      ).toBeInTheDocument();
    });

    it("should display all failed message", () => {
      const allFailed = {
        ...mockMemberData,
        failedMinimumPeaks: true,
        failedMinimumForeignPeaks: true,
        failedMinimumFpr: true,
        failedMinimumAge: true,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={allFailed}
        />,
      );
      expect(
        screen.getByText(
          /Currently not meeting any qualification requirements/,
        ),
      ).toBeInTheDocument();
    });

    it("should display success message when no requirements failed", () => {
      const allMet = {
        ...mockMemberData,
        failedMinimumPeaks: false,
        failedMinimumForeignPeaks: false,
        failedMinimumFpr: false,
        failedMinimumAge: false,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={allMet}
        />,
      );
      expect(
        screen.getByText(
          /Great work! You're meeting the requirements but haven't qualified yet/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Progress Calculations", () => {
    it("should cap progress at 100%", () => {
      const exceededMember = {
        ...mockMemberData,
        totalPeaks: 200,
        foreignPeaks: 50,
        fpr: 40.0,
        memberAge: 25,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={exceededMember}
        />,
      );
      const completeTexts = screen.getAllByText("100.0% complete");
      expect(completeTexts.length).toBeGreaterThan(0);
    });

    it("should calculate correct progress for partial completion", () => {
      const partialMember = {
        ...mockMemberData,
        totalPeaks: 50,
        failedMinimumPeaks: true,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={partialMember}
        />,
      );
      // 50/100 = 50%
      expect(screen.getByText("50.0% complete")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero peaks", () => {
      const zeroPeaksMember = {
        ...mockMemberData,
        totalPeaks: 0,
        foreignPeaks: 0,
        fpr: 0.0,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={zeroPeaksMember}
        />,
      );
      expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    });

    it("should handle null birth year", () => {
      const noBirthYearMember = {
        ...mockMemberData,
        member: { ...mockMemberData.member, birthYear: null },
        memberAge: null,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={noBirthYearMember}
          currentUserId="m1"
        />,
      );
      expect(screen.getByText(/Not provided/)).toBeInTheDocument();
    });

    it("should handle all requirements at zero", () => {
      const noRequirements = {
        minPeaks: 0,
        minForeignPeaks: 0,
        minFpr: 0,
        minimumAge: 0,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          config={noRequirements}
        />,
      );
      expect(screen.queryByText("Total Peaks")).not.toBeInTheDocument();
      expect(screen.queryByText("Foreign Peaks")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Foreign Peaks Ratio (FPR)"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Minimum Age")).not.toBeInTheDocument();
    });

    it("should handle very large numbers", () => {
      const highPeaksMember = {
        ...mockMemberData,
        totalPeaks: 10000,
        foreignPeaks: 5000,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          memberData={highPeaksMember}
        />,
      );
      expect(screen.getByText("10,000")).toBeInTheDocument();
      expect(screen.getByText("5,000")).toBeInTheDocument();
    });

    it("should handle undefined lceMinFpr", () => {
      const configWithoutLce = {
        ...mockConfig,
        lceMinFpr: undefined,
      };
      const lceMember = {
        ...mockMemberData,
        isFromLceCountry: true,
      };
      render(
        <ProgressRegisterExpandedDetails
          {...defaultProps}
          config={configWithoutLce}
          memberData={lceMember}
        />,
      );
      // Should use standard minFpr
      const fprSection = screen
        .getByText("Foreign Peaks Ratio (FPR)")
        .closest(".space-y-2");
      expect(fprSection).toHaveTextContent("20.0%");
    });
  });

  describe("Grid Layout", () => {
    it("should use grid layout for requirements", () => {
      const { container } = render(
        <ProgressRegisterExpandedDetails {...defaultProps} />,
      );
      const grid = container.querySelector(
        ".grid.grid-cols-1.md\\:grid-cols-2",
      );
      expect(grid).toBeInTheDocument();
    });

    it("should render all four requirements when configured", () => {
      render(<ProgressRegisterExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Total Peaks")).toBeInTheDocument();
      expect(screen.getByText("Foreign Peaks")).toBeInTheDocument();
      expect(screen.getByText("Foreign Peaks Ratio (FPR)")).toBeInTheDocument();
      expect(screen.getByText("Minimum Age")).toBeInTheDocument();
    });
  });
});
