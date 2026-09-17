import { render, screen } from "@/__tests__/utils/test-utils";
import StatsCard from "@/app/components/ui/StatsCard";
import { Users, Award, TrendingUp, Calendar } from "lucide-react";

describe("StatsCard Component", () => {
  describe("Rendering", () => {
    it("should render with value and label", () => {
      render(<StatsCard icon={Users} value="42" label="Total Users" />);
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });

    it("should render with numeric value", () => {
      render(<StatsCard icon={Award} value={123} label="Awards" />);
      expect(screen.getByText("123")).toBeInTheDocument();
    });

    it("should render with string value", () => {
      render(<StatsCard icon={Users} value="1.2K" label="Followers" />);
      expect(screen.getByText("1.2K")).toBeInTheDocument();
    });

    it("should render icon", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("lucide-users");
    });
  });

  describe("Border Variants", () => {
    it("should have no border by default", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveClass("border-l");
      expect(wrapper).not.toHaveClass("border-r");
    });

    it("should have left border when hasBorder is left", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" hasBorder="left" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("border-l");
      expect(wrapper).toHaveClass("border-dark-600");
    });

    it("should have right border when hasBorder is right", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" hasBorder="right" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("border-r");
      expect(wrapper).toHaveClass("border-dark-600");
    });

    it("should have both borders when hasBorder is both", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" hasBorder="both" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("border-l");
      expect(wrapper).toHaveClass("border-r");
      expect(wrapper).toHaveClass("border-dark-600");
    });

    it("should have no border when hasBorder is none", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" hasBorder="none" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveClass("border-l");
      expect(wrapper).not.toHaveClass("border-r");
    });
  });

  describe("Icon Variants", () => {
    it("should render Users icon", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("lucide-users");
    });

    it("should render Award icon", () => {
      const { container } = render(
        <StatsCard icon={Award} value="5" label="Awards" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("lucide-award");
    });

    it("should render TrendingUp icon", () => {
      const { container } = render(
        <StatsCard icon={TrendingUp} value="15%" label="Growth" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("lucide-trending-up");
    });

    it("should render Calendar icon", () => {
      const { container } = render(
        <StatsCard icon={Calendar} value="2024" label="Year" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("lucide-calendar");
    });
  });

  describe("Styling", () => {
    it("should center content", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("flex-col");
      expect(wrapper).toHaveClass("items-center");
    });

    it("should style icon correctly", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("text-gray-600");
      expect(svg).toHaveClass("mb-2");
    });

    it("should style value as bold and large", () => {
      render(<StatsCard icon={Users} value="42" label="Users" />);
      const value = screen.getByText("42");
      expect(value).toHaveClass("font-bold");
      expect(value).toHaveClass("text-gray-400");
    });

    it("should style label as small text", () => {
      render(<StatsCard icon={Users} value="10" label="Total Users" />);
      const label = screen.getByText("Total Users");
      expect(label).toHaveClass("text-gray-400");
      expect(label).toHaveClass("text-center");
    });

    it("should have responsive icon sizes", () => {
      const { container } = render(
        <StatsCard icon={Users} value="10" label="Users" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-6");
      expect(svg).toHaveClass("w-6");
      expect(svg).toHaveClass("sm:h-8");
      expect(svg).toHaveClass("sm:w-8");
    });

    it("should have responsive value sizes", () => {
      render(<StatsCard icon={Users} value="100" label="Users" />);
      const value = screen.getByText("100");
      expect(value).toHaveClass("text-2xl");
      expect(value).toHaveClass("sm:text-3xl");
    });

    it("should have responsive label sizes", () => {
      render(<StatsCard icon={Users} value="10" label="Active Users" />);
      const label = screen.getByText("Active Users");
      expect(label).toHaveClass("text-sm");
      expect(label).toHaveClass("sm:text-base");
    });
  });

  describe("Value Formats", () => {
    it("should handle zero value", () => {
      render(<StatsCard icon={Users} value={0} label="Users" />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should handle negative value", () => {
      render(<StatsCard icon={TrendingUp} value={-5} label="Change" />);
      expect(screen.getByText("-5")).toBeInTheDocument();
    });

    it("should handle decimal value", () => {
      render(<StatsCard icon={Award} value="3.14" label="Rating" />);
      expect(screen.getByText("3.14")).toBeInTheDocument();
    });

    it("should handle percentage value", () => {
      render(<StatsCard icon={TrendingUp} value="85%" label="Completion" />);
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("should handle formatted number", () => {
      render(<StatsCard icon={Users} value="1,234" label="Total" />);
      expect(screen.getByText("1,234")).toBeInTheDocument();
    });
  });

  describe("Label Formats", () => {
    it("should handle single word label", () => {
      render(<StatsCard icon={Users} value="10" label="Users" />);
      expect(screen.getByText("Users")).toBeInTheDocument();
    });

    it("should handle multi-word label", () => {
      render(<StatsCard icon={Users} value="10" label="Active Users Today" />);
      expect(screen.getByText("Active Users Today")).toBeInTheDocument();
    });

    it("should handle long label", () => {
      const longLabel = "Total Number of Registered Users";
      render(<StatsCard icon={Users} value="100" label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string value", () => {
      const { container } = render(
        <StatsCard icon={Users} value="" label="Users" />
      );
      const valueDiv = container.querySelector(".font-bold");
      expect(valueDiv).toBeInTheDocument();
    });

    it("should handle special characters in value", () => {
      render(<StatsCard icon={Award} value="★★★★★" label="Rating" />);
      expect(screen.getByText("★★★★★")).toBeInTheDocument();
    });

    it("should handle HTML entities in label", () => {
      render(<StatsCard icon={Users} value="10" label="Users & Teams" />);
      expect(screen.getByText("Users & Teams")).toBeInTheDocument();
    });

    it("should render all props together", () => {
      render(
        <StatsCard
          icon={Award}
          value="1,234"
          label="Total Achievements"
          hasBorder="both"
        />
      );
      expect(screen.getByText("1,234")).toBeInTheDocument();
      expect(screen.getByText("Total Achievements")).toBeInTheDocument();
    });
  });
});
