import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import Card from "@/app/components/ui/Card";

describe("Card Component", () => {
  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <Card>
          <div>Card Content</div>
        </Card>
      );
      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });

    it("should render text content", () => {
      render(<Card>Simple text</Card>);
      expect(screen.getByText("Simple text")).toBeInTheDocument();
    });

    it("should render complex JSX", () => {
      render(
        <Card>
          <h2>Title</h2>
          <p>Paragraph</p>
          <button>Action</button>
        </Card>
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });
  });

  describe("Padding Variants", () => {
    it("should apply no padding", () => {
      const { container } = render(<Card padding="none">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass("p-0");
    });

    it("should apply small padding", () => {
      const { container } = render(<Card padding="sm">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass("p-4");
    });

    it("should apply medium padding by default", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass("p-6");
    });

    it("should apply large padding", () => {
      const { container } = render(<Card padding="lg">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass("p-8");
    });
  });

  describe("Hover Effect", () => {
    it("should not have hover styles by default", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).not.toHaveClass("hover:border-primary-600");
      expect(card).not.toHaveClass("cursor-pointer");
    });

    it("should apply hover styles when hover is true", () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass("hover:border-primary-600");
      expect(card).toHaveClass("cursor-pointer");
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass("custom-class");
    });

    it("should preserve default classes with custom className", () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass("bg-dark-900");
      expect(card).toHaveClass("custom-class");
    });
  });

  describe("Click Handling", () => {
    it("should handle onClick", () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Card onClick={handleClick}>
          <div>Clickable Card</div>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not have onClick if not provided", () => {
      render(
        <Card>
          <div>Non-clickable Card</div>
        </Card>
      );
      const card = screen.getByText("Non-clickable Card").parentElement;
      expect(card).not.toHaveClass("cursor-pointer");
    });
  });

  describe("Styling", () => {
    it("should have default card styles", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass("bg-dark-900");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("border-dark-700");
      expect(card).toHaveClass("rounded-lg");
      expect(card).toHaveClass("shadow-lg");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty children", () => {
      const { container } = render(<Card></Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render with all props", () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Card
          padding="lg"
          hover={true}
          className="custom"
          onClick={handleClick}
        >
          <div>Content</div>
        </Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass("p-8");
      expect(card).toHaveClass("hover:border-primary-600");
      expect(card).toHaveClass("custom");
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should handle nested cards", () => {
      render(
        <Card>
          <Card>
            <div>Nested Content</div>
          </Card>
        </Card>
      );
      expect(screen.getByText("Nested Content")).toBeInTheDocument();
    });

    it("should handle multiple children", () => {
      render(
        <Card>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </Card>
      );
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should be a div element", () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild?.nodeName).toBe("DIV");
    });

    it("should apply hover styles when hover prop is true", () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("cursor-pointer");
      expect(card).toHaveClass("hover:border-primary-600");
    });
  });
});
