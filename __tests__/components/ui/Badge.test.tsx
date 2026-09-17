import { render, screen } from "@/__tests__/utils/test-utils";
import Badge from "@/app/components/ui/Badge";

describe("Badge Component", () => {
  describe("Rendering", () => {
    it("should render with text", () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText("Test Badge")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<Badge className="custom-class">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("custom-class");
    });
  });

  describe("Variants", () => {
    it("should render default variant", () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText("Default");
      expect(badge).toHaveClass("bg-gray-700", "text-gray-300");
    });

    it("should render primary variant", () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText("Primary");
      expect(badge).toHaveClass("bg-primary-900/30", "text-primary-400");
    });

    it("should render success variant", () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText("Success");
      expect(badge).toHaveClass("bg-green-900/30", "text-green-400");
    });

    it("should render warning variant", () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText("Warning");
      expect(badge).toHaveClass("bg-yellow-900/30", "text-yellow-400");
    });

    it("should render danger variant", () => {
      render(<Badge variant="danger">Danger</Badge>);
      const badge = screen.getByText("Danger");
      expect(badge).toHaveClass("bg-red-900/30", "text-red-400");
    });

    it("should render info variant", () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText("Info");
      expect(badge).toHaveClass("bg-blue-900/30", "text-blue-400");
    });

    it("should render feature variant", () => {
      render(<Badge variant="feature">Feature</Badge>);
      const badge = screen.getByText("Feature");
      expect(badge).toHaveClass("bg-blue-900/30", "text-blue-400");
    });

    it("should render bug variant", () => {
      render(<Badge variant="bug">Bug</Badge>);
      const badge = screen.getByText("Bug");
      expect(badge).toHaveClass("bg-red-900/30", "text-red-400");
    });

    it("should render enhancement variant", () => {
      render(<Badge variant="enhancement">Enhancement</Badge>);
      const badge = screen.getByText("Enhancement");
      expect(badge).toHaveClass("bg-green-900/30", "text-green-400");
    });
  });

  describe("Sizes", () => {
    it("should render medium size by default", () => {
      render(<Badge>Medium</Badge>);
      const badge = screen.getByText("Medium");
      expect(badge).toHaveClass("text-sm", "px-2.5", "py-0.5");
    });

    it("should render small size", () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText("Small");
      expect(badge).toHaveClass("text-xs", "px-2", "py-0.5");
    });

    it("should render large size", () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText("Large");
      expect(badge).toHaveClass("text-base", "px-3", "py-1");
    });
  });

  describe("Content", () => {
    it("should render text content", () => {
      render(<Badge>Text Content</Badge>);
      expect(screen.getByText("Text Content")).toBeInTheDocument();
    });

    it("should render numeric content", () => {
      render(<Badge>{42}</Badge>);
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("should render mixed content", () => {
      render(
        <Badge>
          <span>🔥</span> Hot
        </Badge>
      );
      expect(screen.getByText("Hot")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have rounded-full class", () => {
      render(<Badge>Rounded</Badge>);
      const badge = screen.getByText("Rounded");
      expect(badge).toHaveClass("rounded-full");
    });

    it("should have inline-flex class", () => {
      render(<Badge>Flex</Badge>);
      const badge = screen.getByText("Flex");
      expect(badge).toHaveClass("inline-flex");
    });

    it("should have font-medium class", () => {
      render(<Badge>Medium Font</Badge>);
      const badge = screen.getByText("Medium Font");
      expect(badge).toHaveClass("font-medium");
    });
  });
});
