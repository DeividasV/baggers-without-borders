/**
 * Button Component Tests
 * Tests for responsive layout and nowrap behavior
 */

import { render } from "@testing-library/react";
import Button from "@/app/components/ui/Button";
import { CheckCircle } from "lucide-react";

describe("Button Component", () => {
  describe("Nowrap behavior", () => {
    it("should have flex-nowrap class to prevent wrapping", () => {
      const { container } = render(
        <Button>
          <CheckCircle className="h-4 w-4" />
          Mark as Resolved
        </Button>
      );

      const button = container.querySelector("button");
      expect(button).toHaveClass("flex-nowrap");
    });

    it("should have whitespace-nowrap class to prevent text wrapping", () => {
      const { container } = render(<Button>Long Button Text</Button>);

      const button = container.querySelector("button");
      expect(button).toHaveClass("whitespace-nowrap");
    });

    it("should use gap-2 for consistent spacing", () => {
      const { container } = render(
        <Button icon={<CheckCircle className="h-4 w-4" />}>Button Text</Button>
      );

      const button = container.querySelector("button");
      expect(button).toHaveClass("gap-2");
    });

    it("should render icon and text as direct children without span wrappers", () => {
      const { container } = render(
        <Button>
          <CheckCircle className="h-4 w-4 shrink-0" />
          Text Content
        </Button>
      );

      const button = container.querySelector("button");
      // Icon should be direct child, not wrapped in span
      const svg = button?.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg?.parentElement?.tagName).toBe("BUTTON");
    });
  });

  describe("Loading state", () => {
    it("should show loading spinner with shrink-0 class", () => {
      const { container } = render(<Button loading>Loading Text</Button>);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("shrink-0");
    });

    it("should show 'Loading...' text when children is not a string", () => {
      const { getByText } = render(
        <Button loading>
          <div>Complex Child</div>
        </Button>
      );

      expect(getByText("Loading...")).toBeInTheDocument();
    });

    it("should preserve string children in loading state", () => {
      const { getByText } = render(<Button loading>Saving</Button>);

      expect(getByText("Saving")).toBeInTheDocument();
    });
  });

  describe("Icon prop", () => {
    it("should render icon from icon prop", () => {
      const { container } = render(
        <Button icon={<CheckCircle className="h-4 w-4" />}>Click Me</Button>
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Size variants", () => {
    it("should apply small size classes", () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("px-3", "py-2", "text-sm");
    });

    it("should apply medium size classes (default)", () => {
      const { container } = render(<Button>Medium</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("px-4", "py-2", "text-base");
    });

    it("should apply large size classes", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("px-6", "py-3", "text-lg");
    });
  });

  describe("Variant styles", () => {
    it("should apply primary variant (default)", () => {
      const { container } = render(<Button>Primary</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-primary-600");
    });

    it("should apply secondary variant", () => {
      const { container } = render(
        <Button variant="secondary">Secondary</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-dark-700");
    });

    it("should apply danger variant", () => {
      const { container } = render(<Button variant="danger">Danger</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-red-600");
    });

    it("should apply ghost variant", () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("text-gray-300");
    });
  });

  describe("Disabled state", () => {
    it("should be disabled when disabled prop is true", () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const button = container.querySelector("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:opacity-50");
    });

    it("should be disabled when loading", () => {
      const { container } = render(<Button loading>Loading</Button>);
      const button = container.querySelector("button");
      expect(button).toBeDisabled();
    });
  });
});
