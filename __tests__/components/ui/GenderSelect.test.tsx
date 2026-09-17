import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GenderSelect from "@/app/components/ui/GenderSelect";

describe("GenderSelect Component", () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render select button", () => {
      const { container } = render(<GenderSelect {...defaultProps} />);
      expect(
        container.querySelector('button[type="button"]')
      ).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<GenderSelect {...defaultProps} label="Gender" />);
      expect(screen.getByText("Gender")).toBeInTheDocument();
    });

    it("should not render label when not provided", () => {
      render(<GenderSelect {...defaultProps} />);
      expect(screen.queryByText("Gender")).not.toBeInTheDocument();
    });

    it("should render placeholder", () => {
      render(<GenderSelect {...defaultProps} placeholder="Choose gender" />);
      expect(screen.getByText("Choose gender")).toBeInTheDocument();
    });

    it("should render default placeholder", () => {
      render(<GenderSelect {...defaultProps} />);
      expect(screen.getByText("Select gender")).toBeInTheDocument();
    });

    it("should render error message", () => {
      render(<GenderSelect {...defaultProps} error="Gender is required" />);
      expect(screen.getByText("Gender is required")).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const { container } = render(<GenderSelect {...defaultProps} />);
      expect(
        container.querySelector(".lucide-chevron-down")
      ).toBeInTheDocument();
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<GenderSelect {...defaultProps} />);
      expect(screen.queryByText("Male")).not.toBeInTheDocument();
    });

    it("should open dropdown when button clicked", () => {
      render(<GenderSelect {...defaultProps} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(screen.getByText("Male")).toBeInTheDocument();
      expect(screen.getByText("Female")).toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", async () => {
      render(<GenderSelect {...defaultProps} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(screen.getByText("Male")).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText("Male")).not.toBeInTheDocument();
      });
    });

    it("should not open dropdown when disabled", () => {
      render(<GenderSelect {...defaultProps} disabled={true} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(screen.queryByText("Male")).not.toBeInTheDocument();
    });

    it("should rotate chevron when open", () => {
      const { container } = render(<GenderSelect {...defaultProps} />);
      const button = screen.getByRole("button");
      const chevron = container.querySelector(".lucide-chevron-down");

      fireEvent.click(button);
      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Option Selection", () => {
    it("should display all gender options", () => {
      render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Male")).toBeInTheDocument();
      expect(screen.getByText("Female")).toBeInTheDocument();
      expect(screen.getByText("Other")).toBeInTheDocument();
      expect(screen.getByText("Prefer not to say")).toBeInTheDocument();
    });

    it("should call onChange when Male selected", () => {
      render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      fireEvent.click(screen.getByText("Male"));
      expect(mockOnChange).toHaveBeenCalledWith("M");
    });

    it("should call onChange when Female selected", () => {
      render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      fireEvent.click(screen.getByText("Female"));
      expect(mockOnChange).toHaveBeenCalledWith("F");
    });

    it("should call onChange when Other selected", () => {
      render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      fireEvent.click(screen.getByText("Other"));
      expect(mockOnChange).toHaveBeenCalledWith("O");
    });

    it("should call onChange when Prefer not to say selected", () => {
      render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      fireEvent.click(screen.getByText("Prefer not to say"));
      expect(mockOnChange).toHaveBeenCalledWith("N");
    });

    it("should close dropdown after selection", async () => {
      render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      fireEvent.click(screen.getByText("Male"));

      await waitFor(() => {
        expect(screen.queryByText("Female")).not.toBeInTheDocument();
      });
    });

    it("should display selected option", () => {
      render(<GenderSelect {...defaultProps} value="M" />);
      expect(screen.getByText("Male")).toBeInTheDocument();
    });

    it("should highlight selected option in dropdown", () => {
      render(<GenderSelect {...defaultProps} value="F" />);
      fireEvent.click(screen.getByRole("button"));

      const femaleButtons = screen.getAllByText("Female");
      const femaleButton = femaleButtons
        .find((el) =>
          el.closest("button")?.classList.contains("bg-primary-900/40")
        )
        ?.closest("button");
      expect(femaleButton).toHaveClass("bg-primary-900/40");
      expect(femaleButton).toHaveClass("text-primary-300");
    });
  });

  describe("Clear Functionality", () => {
    it("should show clear button when value selected", () => {
      const { container } = render(
        <GenderSelect {...defaultProps} value="M" />
      );
      expect(container.querySelector(".lucide-x")).toBeInTheDocument();
    });

    it("should not show clear button when no value", () => {
      const { container } = render(<GenderSelect {...defaultProps} />);
      expect(container.querySelector(".lucide-x")).not.toBeInTheDocument();
    });

    it("should not show clear button when disabled", () => {
      const { container } = render(
        <GenderSelect {...defaultProps} value="M" disabled={true} />
      );
      expect(container.querySelector(".lucide-x")).not.toBeInTheDocument();
    });

    it("should call onChange with empty string when cleared", () => {
      const { container } = render(
        <GenderSelect {...defaultProps} value="M" />
      );
      const clearButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLElement;

      fireEvent.click(clearButton);
      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("should not open dropdown when clear button clicked", () => {
      const { container } = render(
        <GenderSelect {...defaultProps} value="M" />
      );
      const clearButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLElement;

      fireEvent.click(clearButton);
      expect(screen.queryByText("Female")).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should disable button when disabled", () => {
      render(<GenderSelect {...defaultProps} disabled={true} />);
      const button = screen.getByRole("button");
      expect(button.disabled).toBe(true);
    });

    it("should apply disabled styles", () => {
      render(<GenderSelect {...defaultProps} disabled={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("opacity-50");
      expect(button).toHaveClass("cursor-not-allowed");
    });

    it("should not allow selection when disabled", () => {
      render(<GenderSelect {...defaultProps} disabled={true} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(screen.queryByText("Male")).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should apply error border", () => {
      render(<GenderSelect {...defaultProps} error="Required" />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border-red-500");
    });

    it("should show error message", () => {
      render(<GenderSelect {...defaultProps} error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should apply error text color", () => {
      render(<GenderSelect {...defaultProps} error="Error" />);
      const errorText = screen.getByText("Error");
      expect(errorText).toHaveClass("text-red-400");
    });
  });

  describe("Styling", () => {
    it("should apply focus ring when open", () => {
      render(<GenderSelect {...defaultProps} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(button).toHaveClass("ring-2");
      expect(button).toHaveClass("ring-primary-500/50");
    });

    it("should change background when open", () => {
      render(<GenderSelect {...defaultProps} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(button).toHaveStyle({ backgroundColor: "#252525" });
    });

    it("should apply hover styles to options", () => {
      render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      const maleButton = screen.getByText("Male").closest("button");
      expect(maleButton).toHaveClass("hover:bg-[#252525]");
    });

    it("should have dropdown animation classes", () => {
      const { container } = render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector(".animate-in");
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe("Value Sync", () => {
    it("should update display when value prop changes", () => {
      const { rerender } = render(<GenderSelect {...defaultProps} value="M" />);
      expect(screen.getByText("Male")).toBeInTheDocument();

      rerender(<GenderSelect {...defaultProps} value="F" />);
      expect(screen.getByText("Female")).toBeInTheDocument();
    });

    it("should clear display when value becomes empty", () => {
      const { rerender } = render(<GenderSelect {...defaultProps} value="M" />);
      expect(screen.getByText("Male")).toBeInTheDocument();

      rerender(<GenderSelect {...defaultProps} value="" />);
      expect(screen.getByText("Select gender")).toBeInTheDocument();
    });

    it("should handle invalid value gracefully", () => {
      render(<GenderSelect {...defaultProps} value="INVALID" />);
      expect(screen.getByText("Select gender")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have button type", () => {
      render(<GenderSelect {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button.type).toBe("button");
    });

    it("should have label association", () => {
      render(<GenderSelect {...defaultProps} label="Gender" />);
      const label = screen.getByText("Gender");
      expect(label.tagName).toBe("LABEL");
    });

    it("should have option buttons with type", () => {
      render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      const maleButton = screen
        .getByText("Male")
        .closest("button") as HTMLButtonElement;
      expect(maleButton.type).toBe("button");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid open/close", () => {
      render(<GenderSelect {...defaultProps} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(screen.getByText("Male")).toBeInTheDocument();
    });

    it("should handle multiple selections", () => {
      render(<GenderSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      fireEvent.click(screen.getByText("Male"));
      expect(mockOnChange).toHaveBeenCalledWith("M");

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Female"));
      expect(mockOnChange).toHaveBeenCalledWith("F");

      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });

    it("should handle all props together", () => {
      render(
        <GenderSelect
          {...defaultProps}
          label="Gender Identity"
          value="O"
          placeholder="Choose"
          error="Required"
          disabled={false}
        />
      );

      expect(screen.getByText("Gender Identity")).toBeInTheDocument();
      expect(screen.getByText("Other")).toBeInTheDocument();
      expect(screen.getByText("Required")).toBeInTheDocument();
    });
  });
});
