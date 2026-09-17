import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TimeInput from "@/app/components/ui/TimeInput";

const mockOnChange = jest.fn();

const defaultProps = {
  label: "Time",
  value: "",
  onChange: mockOnChange,
};

describe("TimeInput Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render label", () => {
      render(<TimeInput {...defaultProps} />);
      expect(screen.getByText("Time")).toBeInTheDocument();
    });

    it("should render input field", () => {
      render(<TimeInput {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render default placeholder", () => {
      render(<TimeInput {...defaultProps} />);
      expect(screen.getByPlaceholderText("e.g., 120")).toBeInTheDocument();
    });

    it("should render custom placeholder", () => {
      render(<TimeInput {...defaultProps} placeholder="Enter time" />);
      expect(screen.getByPlaceholderText("Enter time")).toBeInTheDocument();
    });

    it("should render default helper text", () => {
      render(<TimeInput {...defaultProps} />);
      expect(
        screen.getByText("Enter minutes (e.g., 120, 90, 45)")
      ).toBeInTheDocument();
    });

    it("should render custom helper text", () => {
      render(<TimeInput {...defaultProps} helperText="Custom help text" />);
      expect(screen.getByText("Custom help text")).toBeInTheDocument();
    });

    it("should render initial value", () => {
      render(<TimeInput {...defaultProps} value="120" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("120");
    });

    it("should render formatted time display", () => {
      render(<TimeInput {...defaultProps} value="120" />);
      expect(screen.getByText(/= 2h00/)).toBeInTheDocument();
    });

    it("should not render formatted time when empty", () => {
      render(<TimeInput {...defaultProps} value="" />);
      expect(screen.queryByText(/=/)).not.toBeInTheDocument();
    });
  });

  describe("Input Validation", () => {
    it("should allow numeric input", () => {
      render(<TimeInput {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "120" } });

      expect(mockOnChange).toHaveBeenCalledWith("120");
    });

    it("should allow hours format with h", () => {
      render(<TimeInput {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "2h30" } });

      expect(mockOnChange).toHaveBeenCalledWith("2h30");
    });

    it("should allow empty input", () => {
      render(<TimeInput {...defaultProps} value="120" />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("should reject alphabetic characters except h", () => {
      render(<TimeInput {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "abc" } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should reject special characters", () => {
      render(<TimeInput {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "12@" } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should allow partial input during typing", () => {
      render(<TimeInput {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "12" } });
      expect(mockOnChange).toHaveBeenCalledWith("12");

      fireEvent.change(input, { target: { value: "120" } });
      expect(mockOnChange).toHaveBeenCalledWith("120");
    });
  });

  describe("Formatting on Blur", () => {
    it("should format minutes to hours and minutes on blur", () => {
      render(<TimeInput {...defaultProps} value="150" />);
      const input = screen.getByRole("textbox");

      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith("2h30");
    });

    it("should format hours notation on blur", () => {
      render(<TimeInput {...defaultProps} value="2h30" />);
      const input = screen.getByRole("textbox");

      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith("2h30");
    });

    it("should format hours only on blur", () => {
      render(<TimeInput {...defaultProps} value="120" />);
      const input = screen.getByRole("textbox");

      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith("2h00");
    });

    it("should format minutes only on blur", () => {
      render(<TimeInput {...defaultProps} value="45" />);
      const input = screen.getByRole("textbox");

      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith("0h45");
    });

    it("should not format empty value on blur", () => {
      render(<TimeInput {...defaultProps} value="" />);
      const input = screen.getByRole("textbox");

      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should handle zero value on blur", () => {
      render(<TimeInput {...defaultProps} value="0" />);
      const input = screen.getByRole("textbox");

      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith("0h00");
    });
  });

  describe("Time Display Formatting", () => {
    it("should display 2 hours as 2h00", () => {
      render(<TimeInput {...defaultProps} value="120" />);
      expect(screen.getByText(/= 2h00/)).toBeInTheDocument();
    });

    it("should display 90 minutes as 1h30", () => {
      render(<TimeInput {...defaultProps} value="90" />);
      expect(screen.getByText(/= 1h30/)).toBeInTheDocument();
    });

    it("should display 45 minutes as 0h45", () => {
      render(<TimeInput {...defaultProps} value="45" />);
      expect(screen.getByText(/= 0h45/)).toBeInTheDocument();
    });

    it("should display formatted input correctly", () => {
      render(<TimeInput {...defaultProps} value="2h 30m" />);
      expect(screen.getByText(/= 2h30/)).toBeInTheDocument();
    });

    it("should update display when value changes", () => {
      const { rerender } = render(<TimeInput {...defaultProps} value="60" />);
      expect(screen.getByText(/= 1h00/)).toBeInTheDocument();

      rerender(<TimeInput {...defaultProps} value="90" />);
      expect(screen.getByText(/= 1h30/)).toBeInTheDocument();
    });

    it("should hide display when value cleared", () => {
      const { rerender } = render(<TimeInput {...defaultProps} value="120" />);
      expect(screen.getByText(/= 2h00/)).toBeInTheDocument();

      rerender(<TimeInput {...defaultProps} value="" />);
      expect(screen.queryByText(/=/)).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should disable input", () => {
      render(<TimeInput {...defaultProps} disabled />);
      const input = screen.getByRole("textbox");

      expect(input).toBeDisabled();
    });

    it("should allow onChange when disabled (component limitation)", () => {
      render(<TimeInput {...defaultProps} disabled />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "120" } });

      // Component still calls onChange even when disabled
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("should still show formatted time when disabled", () => {
      render(<TimeInput {...defaultProps} value="120" disabled />);
      expect(screen.getByText(/= 2h00/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large values", () => {
      render(<TimeInput {...defaultProps} value="600" />);
      expect(screen.getByText(/= 10h00/)).toBeInTheDocument();
    });

    it("should handle single digit minutes", () => {
      render(<TimeInput {...defaultProps} value="5" />);
      expect(screen.getByText(/= 0h05/)).toBeInTheDocument();
    });

    it("should handle h notation without minutes", () => {
      render(<TimeInput {...defaultProps} value="3h" />);
      const input = screen.getByRole("textbox");

      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith("3h00");
    });

    it("should handle rapid input changes", () => {
      render(<TimeInput {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "1" } });
      fireEvent.change(input, { target: { value: "12" } });
      fireEvent.change(input, { target: { value: "120" } });

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenLastCalledWith("120");
    });

    it("should handle all props together", () => {
      render(
        <TimeInput
          {...defaultProps}
          label="Duration"
          value="150"
          placeholder="Minutes"
          helperText="Enter duration"
          disabled={false}
        />
      );

      expect(screen.getByText("Duration")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Minutes")).toBeInTheDocument();
      expect(screen.getByText("Enter duration")).toBeInTheDocument();
      expect(screen.getByText(/= 2h30/)).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply primary color to formatted time", () => {
      render(<TimeInput {...defaultProps} value="120" />);
      const formattedTime = screen.getByText(/= 2h00/);

      expect(formattedTime).toHaveClass("text-primary-400");
    });

    it("should apply correct label styling", () => {
      render(<TimeInput {...defaultProps} />);
      const label = screen.getByText("Time");

      expect(label).toHaveClass("text-gray-400");
    });

    it("should apply correct helper text styling", () => {
      render(<TimeInput {...defaultProps} />);
      const helper = screen.getByText("Enter minutes (e.g., 120, 90, 45)");

      expect(helper).toHaveClass("text-gray-500");
    });
  });
});
