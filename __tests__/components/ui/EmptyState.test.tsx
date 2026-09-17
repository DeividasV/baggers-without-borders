import { render, screen } from "@/__tests__/utils/test-utils";
import EmptyState from "@/app/components/ui/EmptyState";
import { Inbox, AlertCircle, CheckCircle } from "lucide-react";

describe("EmptyState Component", () => {
  describe("Rendering", () => {
    it("should render with title", () => {
      render(<EmptyState title="No items found" />);
      expect(screen.getByText("No items found")).toBeInTheDocument();
    });

    it("should render without icon", () => {
      const { container } = render(<EmptyState title="Empty" />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeInTheDocument();
    });

    it("should render with icon", () => {
      const { container } = render(<EmptyState icon={Inbox} title="Empty" />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render with description", () => {
      render(
        <EmptyState title="No data" description="Try adding some items" />
      );
      expect(screen.getByText("Try adding some items")).toBeInTheDocument();
    });

    it("should render without description", () => {
      render(<EmptyState title="No data" />);
      expect(screen.queryByText(/Try adding/)).not.toBeInTheDocument();
    });
  });

  describe("Action Button", () => {
    it("should render action button", () => {
      render(
        <EmptyState title="No items" action={<button>Add Item</button>} />
      );
      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });

    it("should render without action", () => {
      render(<EmptyState title="No items" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render custom action element", () => {
      render(
        <EmptyState title="No data" action={<a href="/new">Create New</a>} />
      );
      expect(screen.getByText("Create New")).toBeInTheDocument();
    });
  });

  describe("Icon Variants", () => {
    it("should render with Inbox icon", () => {
      const { container } = render(<EmptyState icon={Inbox} title="Empty" />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render with AlertCircle icon", () => {
      const { container } = render(
        <EmptyState icon={AlertCircle} title="Error" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render with CheckCircle icon", () => {
      const { container } = render(
        <EmptyState icon={CheckCircle} title="Success" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have centered text layout", () => {
      const { container } = render(<EmptyState title="Empty" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("text-center");
    });

    it("should have vertical padding", () => {
      const { container } = render(<EmptyState title="Empty" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("py-12");
    });

    it("should style title appropriately", () => {
      render(<EmptyState title="No Data" />);
      const title = screen.getByText("No Data");
      expect(title).toHaveClass("text-lg");
      expect(title).toHaveClass("font-medium");
      expect(title).toHaveClass("text-gray-300");
    });

    it("should style description appropriately", () => {
      render(
        <EmptyState title="Empty" description="Add items to get started" />
      );
      const description = screen.getByText("Add items to get started");
      expect(description).toHaveClass("text-sm");
      expect(description).toHaveClass("text-gray-400");
    });

    it("should style icon appropriately", () => {
      const { container } = render(<EmptyState icon={Inbox} title="Empty" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-16");
      expect(svg).toHaveClass("w-16");
      expect(svg).toHaveClass("text-gray-600");
      expect(svg).toHaveClass("opacity-50");
    });
  });

  describe("All Props Together", () => {
    it("should render with all props", () => {
      render(
        <EmptyState
          icon={Inbox}
          title="No Messages"
          description="Your inbox is empty"
          action={<button>Compose</button>}
        />
      );
      expect(screen.getByText("No Messages")).toBeInTheDocument();
      expect(screen.getByText("Your inbox is empty")).toBeInTheDocument();
      expect(screen.getByText("Compose")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty title gracefully", () => {
      render(<EmptyState title="" />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe("");
    });

    it("should handle long title text", () => {
      const longTitle =
        "This is a very long title that might wrap to multiple lines in the empty state component";
      render(<EmptyState title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle long description text", () => {
      const longDesc =
        "This is a very long description that explains what the user should do in great detail";
      render(<EmptyState title="Empty" description={longDesc} />);
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it("should handle multiple action buttons", () => {
      render(
        <EmptyState
          title="No data"
          action={
            <div>
              <button>Action 1</button>
              <button>Action 2</button>
            </div>
          }
        />
      );
      expect(screen.getByText("Action 1")).toBeInTheDocument();
      expect(screen.getByText("Action 2")).toBeInTheDocument();
    });
  });
});
