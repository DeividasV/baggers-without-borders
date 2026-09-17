import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SortDirectionSelect from "@/app/components/ui/SortDirectionSelect";

const mockOnChange = jest.fn();

const defaultProps = {
  value: "asc",
  onChange: mockOnChange,
};

describe("SortDirectionSelect Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render button with default value", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Ascending")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<SortDirectionSelect {...defaultProps} label="Direction" />);
      expect(screen.getByText("Direction")).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const { container } = render(<SortDirectionSelect {...defaultProps} />);
      expect(
        container.querySelector(".lucide-chevron-down")
      ).toBeInTheDocument();
    });

    it("should render without label", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      expect(screen.queryByText("Direction")).not.toBeInTheDocument();
    });

    it("should display correct initial value", () => {
      render(<SortDirectionSelect {...defaultProps} value="desc" />);
      expect(screen.getByText("Descending")).toBeInTheDocument();
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      const buttons = screen.getAllByRole("button");

      // Only the main button should be visible
      expect(buttons).toHaveLength(1);
    });

    it("should open dropdown when button clicked", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      // Both options should be visible
      expect(screen.getAllByText("Ascending")).toHaveLength(2);
      expect(screen.getByText("Descending")).toBeInTheDocument();
    });

    it("should close dropdown when button clicked again", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
    });

    it("should close dropdown when clicking outside", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.mouseDown(document.body);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
    });

    it("should rotate chevron when open", () => {
      const { container } = render(<SortDirectionSelect {...defaultProps} />);
      const button = screen.getByRole("button");
      const chevron = container.querySelector(".lucide-chevron-down");

      expect(chevron).not.toHaveClass("rotate-180");

      fireEvent.click(button);

      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Option Selection", () => {
    it("should call onChange when option selected", () => {
      render(<SortDirectionSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      const options = screen.getAllByRole("button");
      fireEvent.click(options.find((opt) => opt.textContent === "Descending")!);

      expect(mockOnChange).toHaveBeenCalledWith("desc");
    });

    it("should close dropdown after selection", () => {
      render(<SortDirectionSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      const options = screen.getAllByRole("button");
      fireEvent.click(options.find((opt) => opt.textContent === "Descending")!);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
    });

    it("should update display when value prop changes", () => {
      const { rerender } = render(
        <SortDirectionSelect {...defaultProps} value="asc" />
      );
      expect(screen.getByText("Ascending")).toBeInTheDocument();

      rerender(<SortDirectionSelect {...defaultProps} value="desc" />);
      expect(screen.getByText("Descending")).toBeInTheDocument();
    });

    it("should highlight selected option in dropdown", () => {
      render(<SortDirectionSelect {...defaultProps} value="desc" />);

      fireEvent.click(screen.getByRole("button"));

      const options = screen.getAllByRole("button");
      // First button is the toggle, dropdown options start from index 1
      const selectedOption = options
        .slice(1)
        .find((opt) => opt.textContent === "Descending");
      expect(selectedOption?.className).toContain("bg-primary-900/40");
      expect(selectedOption?.className).toContain("text-primary-300");
    });

    it("should default to ascending for invalid value", () => {
      render(<SortDirectionSelect {...defaultProps} value="invalid" />);
      expect(screen.getByText("Ascending")).toBeInTheDocument();
    });
  });

  describe("Both Options", () => {
    it("should render Ascending option", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getAllByText("Ascending").length).toBeGreaterThan(0);
    });

    it("should render Descending option", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Descending")).toBeInTheDocument();
    });

    it("should handle selecting ascending", () => {
      render(<SortDirectionSelect {...defaultProps} value="desc" />);

      fireEvent.click(screen.getByRole("button"));
      const options = screen.getAllByRole("button");
      fireEvent.click(options.find((opt) => opt.textContent === "Ascending")!);

      expect(mockOnChange).toHaveBeenCalledWith("asc");
    });

    it("should handle selecting descending", () => {
      render(<SortDirectionSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      const options = screen.getAllByRole("button");
      fireEvent.click(options.find((opt) => opt.textContent === "Descending")!);

      expect(mockOnChange).toHaveBeenCalledWith("desc");
    });

    it("should toggle between options", () => {
      render(<SortDirectionSelect {...defaultProps} value="asc" />);

      fireEvent.click(screen.getByRole("button"));
      let options = screen.getAllByRole("button");
      fireEvent.click(options.find((opt) => opt.textContent === "Descending")!);

      fireEvent.click(screen.getByRole("button"));
      options = screen.getAllByRole("button");
      fireEvent.click(options.find((opt) => opt.textContent === "Ascending")!);

      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, "desc");
      expect(mockOnChange).toHaveBeenNthCalledWith(2, "asc");
    });
  });

  describe("Disabled State", () => {
    it("should not open dropdown when disabled", () => {
      render(<SortDirectionSelect {...defaultProps} disabled />);

      fireEvent.click(screen.getByRole("button"));

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
    });

    it("should apply disabled styles", () => {
      render(<SortDirectionSelect {...defaultProps} disabled />);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("opacity-50", "cursor-not-allowed");
    });

    it("should have disabled attribute", () => {
      render(<SortDirectionSelect {...defaultProps} disabled />);
      const button = screen.getByRole("button");

      expect(button).toBeDisabled();
    });

    it("should not call onChange when disabled", () => {
      render(<SortDirectionSelect {...defaultProps} disabled />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("should apply default text color for ascending", () => {
      render(<SortDirectionSelect {...defaultProps} value="asc" />);
      const text = screen.getByText("Ascending");

      expect(text).toHaveClass("text-gray-500");
    });

    it("should apply normal text color for descending", () => {
      render(<SortDirectionSelect {...defaultProps} value="desc" />);
      const text = screen.getByText("Descending");

      expect(text).toHaveClass("text-gray-200");
    });

    it("should apply focus ring when open", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(button).toHaveClass(
        "ring-2",
        "ring-primary-500/50",
        "border-primary-500"
      );
    });

    it("should change background when open", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(button).toHaveStyle({ backgroundColor: "#252525" });
    });

    it("should have default background when closed", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).toHaveStyle({ backgroundColor: "#1a1a1a" });
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid toggle", () => {
      render(<SortDirectionSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(screen.getByText("Descending")).toBeInTheDocument();
    });

    it("should handle multiple selections", () => {
      render(<SortDirectionSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      let options = screen.getAllByRole("button");
      fireEvent.click(options.find((opt) => opt.textContent === "Descending")!);

      fireEvent.click(screen.getByRole("button"));
      options = screen.getAllByRole("button");
      fireEvent.click(options.find((opt) => opt.textContent === "Ascending")!);

      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenLastCalledWith("asc");
    });

    it("should handle all props together", () => {
      render(
        <SortDirectionSelect
          {...defaultProps}
          label="Direction"
          value="desc"
          disabled={false}
        />
      );

      expect(screen.getByText("Direction")).toBeInTheDocument();
      expect(screen.getByText("Descending")).toBeInTheDocument();
    });
  });
});
