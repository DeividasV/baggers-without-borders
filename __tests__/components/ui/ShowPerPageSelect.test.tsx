import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ShowPerPageSelect from "@/app/components/ui/ShowPerPageSelect";

const mockOnChange = jest.fn();

const defaultProps = {
  value: 20,
  onChange: mockOnChange,
};

describe("ShowPerPageSelect Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render button with default value", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("20 per page")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<ShowPerPageSelect {...defaultProps} label="Items per page" />);
      expect(screen.getByText("Items per page")).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const { container } = render(<ShowPerPageSelect {...defaultProps} />);
      expect(
        container.querySelector(".lucide-chevron-down")
      ).toBeInTheDocument();
    });

    it("should render without label", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      expect(screen.queryByText("Items per page")).not.toBeInTheDocument();
    });

    it("should display correct initial value", () => {
      render(<ShowPerPageSelect {...defaultProps} value={50} />);
      expect(screen.getByText("50 per page")).toBeInTheDocument();
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      expect(screen.queryByText("100 per page")).not.toBeInTheDocument();
    });

    it("should open dropdown when button clicked", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(screen.getByText("50 per page")).toBeInTheDocument();
      expect(screen.getByText("100 per page")).toBeInTheDocument();
      expect(screen.getByText("500 per page")).toBeInTheDocument();
    });

    it("should close dropdown when button clicked again", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);

      expect(screen.queryByText("100 per page")).not.toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.mouseDown(document.body);

      expect(screen.queryByText("100 per page")).not.toBeInTheDocument();
    });

    it("should rotate chevron when open", () => {
      const { container } = render(<ShowPerPageSelect {...defaultProps} />);
      const button = screen.getByRole("button");
      const chevron = container.querySelector(".lucide-chevron-down");

      expect(chevron).not.toHaveClass("rotate-180");

      fireEvent.click(button);

      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Option Selection", () => {
    it("should call onChange when option selected", () => {
      render(<ShowPerPageSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("50 per page"));

      expect(mockOnChange).toHaveBeenCalledWith(50);
    });

    it("should close dropdown after selection", () => {
      render(<ShowPerPageSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("100 per page"));

      expect(screen.queryByText("500 per page")).not.toBeInTheDocument();
    });

    it("should update display when value prop changes", () => {
      const { rerender } = render(
        <ShowPerPageSelect {...defaultProps} value={20} />
      );
      expect(screen.getByText("20 per page")).toBeInTheDocument();

      rerender(<ShowPerPageSelect {...defaultProps} value={100} />);
      expect(screen.getByText("100 per page")).toBeInTheDocument();
    });

    it("should highlight selected option in dropdown", () => {
      render(<ShowPerPageSelect {...defaultProps} value={50} />);

      fireEvent.click(screen.getByRole("button"));

      const options = screen.getAllByRole("button");
      // First button is the toggle, dropdown options start from index 1
      const selectedOption = options
        .slice(1)
        .find((opt) => opt.textContent === "50 per page");
      expect(selectedOption?.className).toContain("bg-primary-900/40");
      expect(selectedOption?.className).toContain("text-primary-300");
    });
  });

  describe("All Options", () => {
    it("should render 20 per page option", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getAllByText("20 per page").length).toBeGreaterThan(0);
    });

    it("should render 50 per page option", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("50 per page")).toBeInTheDocument();
    });

    it("should render 100 per page option", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("100 per page")).toBeInTheDocument();
    });

    it("should render 500 per page option", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("500 per page")).toBeInTheDocument();
    });

    it("should handle selecting 20 per page", () => {
      render(<ShowPerPageSelect {...defaultProps} value={50} />);

      fireEvent.click(screen.getByRole("button"));
      const options = screen.getAllByRole("button");
      fireEvent.click(
        options.find((opt) => opt.textContent === "20 per page")!
      );

      expect(mockOnChange).toHaveBeenCalledWith(20);
    });

    it("should handle selecting 500 per page", () => {
      render(<ShowPerPageSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("500 per page"));

      expect(mockOnChange).toHaveBeenCalledWith(500);
    });
  });

  describe("Disabled State", () => {
    it("should not open dropdown when disabled", () => {
      render(<ShowPerPageSelect {...defaultProps} disabled />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.queryByText("100 per page")).not.toBeInTheDocument();
    });

    it("should apply disabled styles", () => {
      render(<ShowPerPageSelect {...defaultProps} disabled />);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("opacity-50", "cursor-not-allowed");
    });

    it("should have disabled attribute", () => {
      render(<ShowPerPageSelect {...defaultProps} disabled />);
      const button = screen.getByRole("button");

      expect(button).toBeDisabled();
    });
  });

  describe("Styling", () => {
    it("should apply default text color for 20 per page", () => {
      render(<ShowPerPageSelect {...defaultProps} value={20} />);
      const text = screen.getByText("20 per page");

      expect(text).toHaveClass("text-gray-500");
    });

    it("should apply normal text color for other values", () => {
      render(<ShowPerPageSelect {...defaultProps} value={50} />);
      const text = screen.getByText("50 per page");

      expect(text).toHaveClass("text-gray-200");
    });

    it("should apply focus ring when open", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(button).toHaveClass(
        "ring-2",
        "ring-primary-500/50",
        "border-primary-500"
      );
    });

    it("should change background when open", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(button).toHaveStyle({ backgroundColor: "#252525" });
    });

    it("should have default background when closed", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).toHaveStyle({ backgroundColor: "#1a1a1a" });
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid toggle", () => {
      render(<ShowPerPageSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(screen.getByText("50 per page")).toBeInTheDocument();
    });

    it("should handle multiple selections", () => {
      render(<ShowPerPageSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("50 per page"));

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("100 per page"));

      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenLastCalledWith(100);
    });

    it("should handle all props together", () => {
      render(
        <ShowPerPageSelect
          {...defaultProps}
          label="Show"
          value={100}
          disabled={false}
        />
      );

      expect(screen.getByText("Show")).toBeInTheDocument();
      expect(screen.getByText("100 per page")).toBeInTheDocument();
    });

    it("should handle value change after mount", () => {
      const { rerender } = render(
        <ShowPerPageSelect {...defaultProps} value={20} />
      );

      rerender(<ShowPerPageSelect {...defaultProps} value={500} />);

      expect(screen.getByText("500 per page")).toBeInTheDocument();
    });

    it("should keep dropdown closed when disabled is clicked", () => {
      render(<ShowPerPageSelect {...defaultProps} disabled={true} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(screen.queryByText("50 per page")).not.toBeInTheDocument();
    });

    it("should not open when clicking a disabled button", () => {
      render(<ShowPerPageSelect {...defaultProps} disabled />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      // Verify dropdown didn't open by checking for options
      const allButtons = screen.getAllByRole("button");
      expect(allButtons.length).toBe(1); // Only the toggle button
    });
  });
});
