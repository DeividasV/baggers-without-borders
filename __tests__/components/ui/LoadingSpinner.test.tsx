import { render, screen } from "@/__tests__/utils/test-utils";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

describe("LoadingSpinner Component", () => {
  describe("Rendering", () => {
    it("should render spinner", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should render with text", () => {
      render(<LoadingSpinner text="Loading..." />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should not render text when not provided", () => {
      const { container } = render(<LoadingSpinner />);
      const text = container.querySelector("p");
      expect(text).not.toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should apply small size", () => {
      const { container } = render(<LoadingSpinner size="sm" />);
      const spinner = container.querySelector(".h-4.w-4");
      expect(spinner).toBeInTheDocument();
    });

    it("should apply medium size by default", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".h-8.w-8");
      expect(spinner).toBeInTheDocument();
    });

    it("should apply large size", () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector(".h-12.w-12");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Full Screen Mode", () => {
    it("should not be full screen by default", () => {
      const { container } = render(<LoadingSpinner />);
      const fullScreenContainer = container.querySelector(".min-h-screen");
      expect(fullScreenContainer).not.toBeInTheDocument();
    });

    it("should render in full screen mode", () => {
      const { container } = render(<LoadingSpinner fullScreen />);
      const fullScreenContainer = container.querySelector(".min-h-screen");
      expect(fullScreenContainer).toBeInTheDocument();
    });

    it("should have full screen styles", () => {
      const { container } = render(<LoadingSpinner fullScreen />);
      const fullScreenContainer = container.querySelector(".min-h-screen");
      expect(fullScreenContainer).toHaveClass("bg-dark-950");
      expect(fullScreenContainer).toHaveClass("flex");
      expect(fullScreenContainer).toHaveClass("items-center");
      expect(fullScreenContainer).toHaveClass("justify-center");
    });
  });

  describe("Styling", () => {
    it("should have spinner animation", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should have primary color", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".text-primary-400");
      expect(spinner).toBeInTheDocument();
    });

    it("should have flex container", () => {
      const { container } = render(<LoadingSpinner />);
      const flexContainer = container.querySelector(".flex.flex-col");
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe("Text Styling", () => {
    it("should style text correctly", () => {
      const { container } = render(<LoadingSpinner text="Loading..." />);
      const text = screen.getByText("Loading...");
      expect(text).toHaveClass("text-gray-400");
      expect(text).toHaveClass("text-sm");
    });

    it("should handle long text", () => {
      const longText =
        "Please wait while we load your data. This may take a moment...";
      render(<LoadingSpinner text={longText} />);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe("Combined Props", () => {
    it("should render with all props", () => {
      const { container } = render(
        <LoadingSpinner size="lg" text="Loading data..." fullScreen />
      );
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
      expect(container.querySelector(".h-12.w-12")).toBeInTheDocument();
      expect(container.querySelector(".min-h-screen")).toBeInTheDocument();
    });

    it("should render small spinner with text", () => {
      render(<LoadingSpinner size="sm" text="Loading..." />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty text", () => {
      const { container } = render(<LoadingSpinner text="" />);
      // Empty text should not render a paragraph
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBe(0);
    });

    it("should render without crashing with no props", () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should indicate loading state visually", () => {
      const { container } = render(<LoadingSpinner text="Loading..." />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });
});
