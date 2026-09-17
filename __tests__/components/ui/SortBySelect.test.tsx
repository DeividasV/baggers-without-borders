import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SortBySelect from "@/app/components/ui/SortBySelect";

const mockOnChange = jest.fn();

const defaultProps = {
  value: "givenName",
  onChange: mockOnChange,
};

describe("SortBySelect Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render button with default value", () => {
      render(<SortBySelect {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Given Name")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<SortBySelect {...defaultProps} label="Sort by" />);
      expect(screen.getByText("Sort by")).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const { container } = render(<SortBySelect {...defaultProps} />);
      expect(
        container.querySelector(".lucide-chevron-down"),
      ).toBeInTheDocument();
    });

    it("should render without label", () => {
      render(<SortBySelect {...defaultProps} />);
      expect(screen.queryByText("Sort by")).not.toBeInTheDocument();
    });

    it("should display correct initial value", () => {
      render(<SortBySelect {...defaultProps} value="email" />);
      expect(screen.getByText("Email")).toBeInTheDocument();
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<SortBySelect {...defaultProps} />);
      expect(screen.queryByText("Family Name")).not.toBeInTheDocument();
    });

    it("should open dropdown when button clicked", () => {
      render(<SortBySelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(screen.getByText("Family Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Creation Date")).toBeInTheDocument();
    });

    it("should close dropdown when button clicked again", () => {
      render(<SortBySelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);

      expect(screen.queryByText("Family Name")).not.toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", () => {
      render(<SortBySelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.mouseDown(document.body);

      expect(screen.queryByText("Email")).not.toBeInTheDocument();
    });

    it("should rotate chevron when open", () => {
      const { container } = render(<SortBySelect {...defaultProps} />);
      const button = screen.getByRole("button");
      const chevron = container.querySelector(".lucide-chevron-down");

      expect(chevron).not.toHaveClass("rotate-180");

      fireEvent.click(button);

      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Option Selection", () => {
    it("should call onChange when option selected", () => {
      render(<SortBySelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Email"));

      expect(mockOnChange).toHaveBeenCalledWith("email");
    });

    it("should close dropdown after selection", () => {
      render(<SortBySelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Family Name"));

      expect(screen.queryByText("Creation Date")).not.toBeInTheDocument();
    });

    it("should update display when value prop changes", () => {
      const { rerender } = render(
        <SortBySelect {...defaultProps} value="givenName" />,
      );
      expect(screen.getByText("Given Name")).toBeInTheDocument();

      rerender(<SortBySelect {...defaultProps} value="familyName" />);
      expect(screen.getByText("Family Name")).toBeInTheDocument();
    });

    it("should highlight selected option in dropdown", () => {
      render(<SortBySelect {...defaultProps} value="email" />);

      fireEvent.click(screen.getByRole("button"));

      const options = screen.getAllByRole("button");
      // First button is the toggle, dropdown options start from index 1
      const selectedOption = options
        .slice(1)
        .find((opt) => opt.textContent === "Email");
      expect(selectedOption?.className).toContain("bg-primary-900/40");
      expect(selectedOption?.className).toContain("text-primary-300");
    });

    it("should default to Given Name for invalid value", () => {
      render(<SortBySelect {...defaultProps} value="invalid" />);
      expect(screen.getByText("Given Name")).toBeInTheDocument();
    });
  });

  describe("All Options", () => {
    it("should render Given Name option", () => {
      render(<SortBySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getAllByText("Given Name").length).toBeGreaterThan(0);
    });

    it("should render Family Name option", () => {
      render(<SortBySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Family Name")).toBeInTheDocument();
    });

    it("should render Email option", () => {
      render(<SortBySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("should render Creation Date option", () => {
      render(<SortBySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Creation Date")).toBeInTheDocument();
    });

    it("should render Update Date option", () => {
      render(<SortBySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Update Date")).toBeInTheDocument();
    });

    it("should handle selecting givenName", () => {
      render(<SortBySelect {...defaultProps} value="email" />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Given Name"));

      expect(mockOnChange).toHaveBeenCalledWith("givenName");
    });

    it("should handle selecting familyName", () => {
      render(<SortBySelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Family Name"));

      expect(mockOnChange).toHaveBeenCalledWith("familyName");
    });

    it("should handle selecting createdAt", () => {
      render(<SortBySelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Creation Date"));

      expect(mockOnChange).toHaveBeenCalledWith("createdAt");
    });

    it("should handle selecting updatedAt", () => {
      render(<SortBySelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Update Date"));

      expect(mockOnChange).toHaveBeenCalledWith("updatedAt");
    });
  });

  describe("Disabled State", () => {
    it("should not have disabled prop in component", () => {
      // SortBySelect doesn't have disabled prop, but we can verify it's always enabled
      render(<SortBySelect {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).not.toBeDisabled();
    });
  });

  describe("Styling", () => {
    it("should apply default text color for givenName", () => {
      render(<SortBySelect {...defaultProps} value="givenName" />);
      const text = screen.getByText("Given Name");

      expect(text).toHaveClass("text-gray-500");
    });

    it("should apply normal text color for other values", () => {
      render(<SortBySelect {...defaultProps} value="email" />);
      const text = screen.getByText("Email");

      expect(text).toHaveClass("text-gray-200");
    });

    it("should apply focus ring when open", () => {
      render(<SortBySelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(button).toHaveClass(
        "ring-2",
        "ring-primary-500/50",
        "border-primary-500",
      );
    });

    it("should change background when open", () => {
      render(<SortBySelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(button).toHaveStyle({ backgroundColor: "#252525" });
    });

    it("should have default background when closed", () => {
      render(<SortBySelect {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).toHaveStyle({ backgroundColor: "#1a1a1a" });
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid toggle", () => {
      render(<SortBySelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(screen.getByText("Family Name")).toBeInTheDocument();
    });

    it("should handle multiple selections", () => {
      render(<SortBySelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Email"));

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Creation Date"));

      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenLastCalledWith("createdAt");
    });

    it("should handle all props together", () => {
      render(
        <SortBySelect {...defaultProps} label="Sort by" value="updatedAt" />,
      );

      expect(screen.getByText("Sort by")).toBeInTheDocument();
      expect(screen.getByText("Update Date")).toBeInTheDocument();
    });
  });
});
