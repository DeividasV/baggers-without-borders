import React from "react";
import { render, screen } from "@testing-library/react";
import HofStatsCards from "@/app/components/features/hof-tables/HofStatsCards";

describe("HofStatsCards Component", () => {
  const defaultProps = {
    memberCount: 100,
    totalPeaks: 250,
    totalForeignPeaks: 150,
    overallFpr: 0.6,
    hofLabel: "2024 HOF",
    yearLabel: "2024",
  };

  describe("Basic Rendering", () => {
    it("should render all four stat cards", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const statItems = container.querySelectorAll(".flex.flex-col");
      expect(statItems).toHaveLength(4);
    });

    it("should render card container", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      expect(container.querySelector(".card.bg-dark-800")).toBeInTheDocument();
    });

    it("should render member count", () => {
      render(<HofStatsCards {...defaultProps} />);
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("should render total peaks", () => {
      render(<HofStatsCards {...defaultProps} />);
      expect(screen.getByText("250")).toBeInTheDocument();
    });

    it("should render foreign peaks", () => {
      render(<HofStatsCards {...defaultProps} />);
      expect(screen.getByText("150")).toBeInTheDocument();
    });

    it("should render FPR with one decimal and percent", () => {
      render(<HofStatsCards {...defaultProps} />);
      expect(screen.getByText(/0\.6%/)).toBeInTheDocument();
    });
  });

  describe("Number Formatting", () => {
    it("should format large member count with spaces", () => {
      render(<HofStatsCards {...defaultProps} memberCount={1234} />);
      // formatNumber uses non-breaking space which renders as regular space in DOM
      expect(screen.getByText(/1\s234/)).toBeInTheDocument();
    });

    it("should format large peaks with spaces", () => {
      render(
        <HofStatsCards
          {...defaultProps}
          totalPeaks={5678}
          totalForeignPeaks={3456}
        />
      );
      expect(screen.getByText(/5\s678/)).toBeInTheDocument();
      expect(screen.getByText(/3\s456/)).toBeInTheDocument();
    });

    it("should handle zero values", () => {
      render(
        <HofStatsCards
          memberCount={0}
          totalPeaks={0}
          totalForeignPeaks={0}
          overallFpr={0}
          hofLabel="Test HOF"
          yearLabel="2024"
        />
      );
      expect(screen.getAllByText("0")).toHaveLength(3);
      expect(screen.getByText(/0\.0%/)).toBeInTheDocument();
    });

    it("should format FPR to one decimal place with percent", () => {
      render(<HofStatsCards {...defaultProps} overallFpr={0.12345} />);
      expect(screen.getByText(/0\.1%/)).toBeInTheDocument();
    });

    it("should round FPR correctly", () => {
      render(<HofStatsCards {...defaultProps} overallFpr={0.66} />);
      expect(screen.getByText(/0\.7%/)).toBeInTheDocument();
    });

    it("should handle FPR of 1.0", () => {
      render(<HofStatsCards {...defaultProps} overallFpr={1.0} />);
      expect(screen.getByText(/1\.0%/)).toBeInTheDocument();
    });
  });

  describe("Labels", () => {
    it("should render Participants label with hofLabel and yearLabel", () => {
      render(<HofStatsCards {...defaultProps} />);
      expect(
        screen.getByText("Participants (2024 HOF, 2024)")
      ).toBeInTheDocument();
    });

    it("should render Peaks label with hofLabel and yearLabel", () => {
      render(<HofStatsCards {...defaultProps} />);
      expect(screen.getByText("Peaks (2024 HOF, 2024)")).toBeInTheDocument();
    });

    it("should render Foreign label with hofLabel and yearLabel", () => {
      render(<HofStatsCards {...defaultProps} />);
      expect(screen.getByText("Foreign (2024 HOF, 2024)")).toBeInTheDocument();
    });

    it("should render FPR label with hofLabel and yearLabel", () => {
      render(<HofStatsCards {...defaultProps} />);
      expect(screen.getByText("FPR (2024 HOF, 2024)")).toBeInTheDocument();
    });

    it("should handle different hofLabel values", () => {
      render(<HofStatsCards {...defaultProps} hofLabel="Annual Rankings" />);
      expect(
        screen.getByText("Participants (Annual Rankings, 2024)")
      ).toBeInTheDocument();
    });

    it("should handle different yearLabel values", () => {
      render(<HofStatsCards {...defaultProps} yearLabel="2023" />);
      expect(
        screen.getByText("Participants (2024 HOF, 2023)")
      ).toBeInTheDocument();
    });
  });

  describe("Icons", () => {
    it("should render Trophy icon", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const trophyIcon = container.querySelector(".lucide-trophy");
      expect(trophyIcon).toBeInTheDocument();
    });

    it("should render TrendingUp icon", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const trendingIcon = container.querySelector(".lucide-trending-up");
      expect(trendingIcon).toBeInTheDocument();
    });

    it("should render Mountain icon", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const mountainIcon = container.querySelector(".lucide-mountain");
      expect(mountainIcon).toBeInTheDocument();
    });

    it("should render Percent icon", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const percentIcon = container.querySelector(".lucide-percent");
      expect(percentIcon).toBeInTheDocument();
    });

    it("should apply correct icon size classes", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const icons = container.querySelectorAll(".h-6.sm\\:h-8");
      expect(icons.length).toBeGreaterThan(0);
    });

    it("should apply correct icon color", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const icons = container.querySelectorAll(".text-gray-600");
      expect(icons.length).toBe(4);
    });
  });

  describe("Responsive Layout", () => {
    it("should use responsive grid layout", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const grid = container.querySelector(
        ".grid.grid-cols-2.md\\:grid-cols-4"
      );
      expect(grid).toBeInTheDocument();
    });

    it("should have responsive gap", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const grid = container.querySelector(".gap-4.sm\\:gap-6");
      expect(grid).toBeInTheDocument();
    });
  });

  describe("Typography", () => {
    it("should apply correct value text size", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const values = container.querySelectorAll(".text-xl.sm\\:text-2xl");
      expect(values).toHaveLength(4);
    });

    it("should apply bold font to values", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const values = container.querySelectorAll(".font-bold");
      expect(values).toHaveLength(4);
    });

    it("should apply correct label text size", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const labels = container.querySelectorAll(".text-xs.sm\\:text-sm");
      expect(labels).toHaveLength(4);
    });

    it("should apply correct colors to values", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const values = container.querySelectorAll(".text-gray-400");
      expect(values.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large numbers", () => {
      render(
        <HofStatsCards
          memberCount={999999}
          totalPeaks={888888}
          totalForeignPeaks={777777}
          overallFpr={0.9}
          hofLabel="Test"
          yearLabel="2024"
        />
      );
      expect(screen.getByText(/999\s999/)).toBeInTheDocument();
      expect(screen.getByText(/888\s888/)).toBeInTheDocument();
    });

    it("should handle negative FPR", () => {
      render(<HofStatsCards {...defaultProps} overallFpr={-0.5} />);
      expect(screen.getByText(/-0\.5%/)).toBeInTheDocument();
    });

    it("should handle empty string labels", () => {
      render(<HofStatsCards {...defaultProps} hofLabel="" yearLabel="" />);
      expect(screen.getByText("Participants (, )")).toBeInTheDocument();
    });

    it("should handle single digit numbers", () => {
      render(
        <HofStatsCards
          memberCount={5}
          totalPeaks={8}
          totalForeignPeaks={3}
          overallFpr={0.5}
          hofLabel="Test"
          yearLabel="2024"
        />
      );
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should handle FPR greater than 1", () => {
      render(<HofStatsCards {...defaultProps} overallFpr={1.5} />);
      expect(screen.getByText(/1\.5%/)).toBeInTheDocument();
    });

    it("should handle special characters in labels", () => {
      render(
        <HofStatsCards
          {...defaultProps}
          hofLabel="HOF 2024 (Test)"
          yearLabel="2024-2025"
        />
      );
      expect(
        screen.getByText("Participants (HOF 2024 (Test), 2024-2025)")
      ).toBeInTheDocument();
    });
  });

  describe("Layout Structure", () => {
    it("should have proper flex column layout for each stat", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const statItems = container.querySelectorAll(
        ".flex.flex-col.items-center"
      );
      expect(statItems).toHaveLength(4);
    });

    it("should have centered text alignment", () => {
      const { container } = render(<HofStatsCards {...defaultProps} />);
      const textCentered = container.querySelectorAll(".text-center");
      expect(textCentered.length).toBeGreaterThan(0);
    });
  });
});
