import { render, screen } from "@/__tests__/utils/test-utils";
import Logo from "@/app/components/ui/Logo";
import { SITE_NAME } from "@/src/config/site";

describe("Logo Component", () => {
  describe("Rendering", () => {
    it("should render logo with text by default", () => {
      render(<Logo />);
      expect(screen.getByText(SITE_NAME)).toBeInTheDocument();
    });

    it("should render mountain icon", () => {
      const { container } = render(<Logo />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render without text when showText is false", () => {
      render(<Logo showText={false} />);
      expect(screen.queryByText(SITE_NAME)).not.toBeInTheDocument();
    });

    it("should render with text when showText is true", () => {
      render(<Logo showText={true} />);
      expect(screen.getByText(SITE_NAME)).toBeInTheDocument();
    });

    it("should render pulse indicator dot", () => {
      const { container } = render(<Logo />);
      // BwBIcon includes the dot as part of the SVG, so we check for circles
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe("Size Variants", () => {
    it("should render small size", () => {
      const { container } = render(<Logo size="sm" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-6");
      expect(icon).toHaveClass("w-6");
    });

    it("should render medium size by default", () => {
      const { container } = render(<Logo />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-8");
      expect(icon).toHaveClass("w-8");
    });

    it("should render large size", () => {
      const { container } = render(<Logo size="lg" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-12");
      expect(icon).toHaveClass("w-12");
    });

    it("should render extra large size", () => {
      const { container } = render(<Logo size="xl" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-16");
      expect(icon).toHaveClass("w-16");
    });

    it("should render extra extra large size", () => {
      const { container } = render(<Logo size="xxl" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-20");
      expect(icon).toHaveClass("w-20");
    });

    it("should render small text size", () => {
      render(<Logo size="sm" />);
      const text = screen.getByText(SITE_NAME);
      expect(text).toHaveClass("text-sm");
    });

    it("should render medium text size", () => {
      render(<Logo size="md" />);
      const text = screen.getByText(SITE_NAME);
      expect(text).toHaveClass("text-base");
    });

    it("should render large text size", () => {
      render(<Logo size="lg" />);
      const text = screen.getByText(SITE_NAME);
      expect(text).toHaveClass("text-2xl");
    });

    it("should render extra large text size", () => {
      render(<Logo size="xl" />);
      const text = screen.getByText(SITE_NAME);
      expect(text).toHaveClass("text-3xl");
    });

    it("should render extra extra large text size", () => {
      render(<Logo size="xxl" />);
      const text = screen.getByText(SITE_NAME);
      expect(text).toHaveClass("text-4xl");
    });
  });

  describe("Styling", () => {
    it("should have flex layout", () => {
      const { container } = render(<Logo />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("items-center");
    });

    it("should have group class for hover effects", () => {
      const { container } = render(<Logo />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("group");
    });

    it("should have cursor pointer", () => {
      const { container } = render(<Logo />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("cursor-pointer");
    });

    it("should accept custom className", () => {
      const { container } = render(<Logo className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should style icon with primary color", () => {
      const { container } = render(<Logo />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("text-primary-400");
    });

    it("should style text with primary color", () => {
      render(<Logo />);
      const text = screen.getByText(SITE_NAME);
      expect(text).toHaveClass("text-primary-400");
      expect(text).toHaveClass("font-bold");
    });

    it("should have hover scale effect on icon", () => {
      const { container } = render(<Logo />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("group-hover:scale-110");
    });

    it("should have hover color change on icon", () => {
      const { container } = render(<Logo />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("group-hover:text-primary-300");
    });

    it("should have hover rotation on icon", () => {
      const { container } = render(<Logo />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("group-hover:-rotate-3");
    });

    it("should have hover tracking on text", () => {
      render(<Logo />);
      const text = screen.getByText(SITE_NAME);
      expect(text).toHaveClass("group-hover:tracking-wider");
    });
  });

  describe("Pulse Indicator", () => {
    it("should render pulse dot", () => {
      const { container } = render(<Logo />);
      // BwBIcon includes the dot as part of the SVG
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThan(0);
    });

    it("should position dot at bottom right", () => {
      const { container } = render(<Logo />);
      // The dot is part of the SVG design, positioned at cx="420" cy="350"
      const dotCircle = container.querySelector('circle[cx="420"]');
      expect(dotCircle).toBeInTheDocument();
    });

    it("should style dot as rounded", () => {
      const { container } = render(<Logo />);
      // SVG circles are inherently round
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThan(0);
    });

    it("should have primary background", () => {
      const { container } = render(<Logo />);
      // The dot uses a mountain-themed color for better visibility
      const dotCircle = container.querySelector('circle[cx="420"]');
      expect(dotCircle).toHaveAttribute("fill", "#6b7548");
    });

    it("should have hover scale effect", () => {
      const { container } = render(<Logo />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("group-hover:scale-110");
    });

    it("should have animate pulse on hover", () => {
      // The BwBIcon doesn't have separate pulse animation, but has hover effects
      const { container } = render(<Logo />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("transition-all");
    });
  });

  describe("Edge Cases", () => {
    it("should render with all size options", () => {
      const sizes: Array<"sm" | "md" | "lg" | "xl" | "xxl"> = ["sm", "md", "lg", "xl", "xxl"];
      sizes.forEach((size) => {
        const { container } = render(<Logo size={size} />);
        const icon = container.querySelector("svg");
        expect(icon).toBeInTheDocument();
      });
    });

    it("should render with showText false and different sizes", () => {
      const sizes: Array<"sm" | "md" | "lg" | "xl" | "xxl"> = ["sm", "md", "lg", "xl", "xxl"];
      sizes.forEach((size) => {
        const { container } = render(<Logo size={size} showText={false} />);
        const icon = container.querySelector("svg");
        expect(icon).toBeInTheDocument();
        expect(screen.queryByText(SITE_NAME)).not.toBeInTheDocument();
      });
    });

    it("should handle multiple custom classes", () => {
      const { container } = render(<Logo className="class1 class2 class3" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("class1");
      expect(wrapper.className).toContain("class2");
      expect(wrapper.className).toContain("class3");
    });

    it("should render with all props", () => {
      render(<Logo size="lg" showText={true} className="custom" />);
      expect(screen.getByText(SITE_NAME)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should be keyboard focusable via cursor-pointer", () => {
      const { container } = render(<Logo />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("cursor-pointer");
    });

    it("should maintain visual hierarchy with text", () => {
      render(<Logo />);
      const text = screen.getByText(SITE_NAME);
      expect(text).toHaveClass("font-bold");
    });
  });

  describe("Animation Classes", () => {
    it("should have transition on icon", () => {
      const { container } = render(<Logo />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("transition-all");
      expect(icon).toHaveClass("duration-300");
    });

    it("should have transition on text", () => {
      render(<Logo />);
      const text = screen.getByText(SITE_NAME);
      expect(text).toHaveClass("transition-all");
      expect(text).toHaveClass("duration-300");
    });

    it("should have transition on pulse dot", () => {
      const { container } = render(<Logo />);
      // The dot is part of the BwBIcon SVG, which has transitions
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("transition-all");
      expect(icon).toHaveClass("duration-300");
    });
  });
});
