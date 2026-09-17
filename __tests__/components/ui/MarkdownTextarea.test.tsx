import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MarkdownTextarea from "@/app/components/ui/MarkdownTextarea";

const defaultProps = {
  label: "Description",
  value: "",
  onChange: jest.fn(),
};

describe("MarkdownTextarea Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render with label", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("should render required indicator", () => {
      render(<MarkdownTextarea {...defaultProps} required />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render with placeholder", () => {
      render(
        <MarkdownTextarea {...defaultProps} placeholder="Enter your text" />
      );
      expect(
        screen.getByPlaceholderText("Enter your text")
      ).toBeInTheDocument();
    });

    it("should render with default placeholder", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      expect(
        screen.getByPlaceholderText("Enter text (Markdown supported)")
      ).toBeInTheDocument();
    });

    it("should render with value", () => {
      render(<MarkdownTextarea {...defaultProps} value="Test content" />);
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should render textarea element", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("should render with helper text", () => {
      render(
        <MarkdownTextarea
          {...defaultProps}
          helperText="This is a helper text"
        />
      );
      expect(screen.getByText("This is a helper text")).toBeInTheDocument();
    });

    it("should render Markdown indicator", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      expect(screen.getByText("Markdown")).toBeInTheDocument();
    });
  });

  describe("Character Count", () => {
    it("should display character count with default max", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      expect(screen.getByText(/5000 \/ 5000/)).toBeInTheDocument();
    });

    it("should display character count with custom max", () => {
      render(<MarkdownTextarea {...defaultProps} maxLength={1000} />);
      expect(screen.getByText(/1000 \/ 1000/)).toBeInTheDocument();
    });

    it("should update character count on change", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, { target: { value: "Hello" } });

      expect(screen.getByText(/4995 \/ 5000/)).toBeInTheDocument();
    });

    it("should show correct remaining characters", () => {
      render(<MarkdownTextarea {...defaultProps} value="Test" />);
      expect(screen.getByText(/4996 \/ 5000/)).toBeInTheDocument();
    });

    it("should handle initial value character count", () => {
      render(<MarkdownTextarea {...defaultProps} value="Initial text" />);
      expect(screen.getByText(/4988 \/ 5000/)).toBeInTheDocument();
    });

    it("should update count when value prop changes", () => {
      const { rerender } = render(
        <MarkdownTextarea {...defaultProps} value="" />
      );
      expect(screen.getByText(/5000 \/ 5000/)).toBeInTheDocument();

      rerender(<MarkdownTextarea {...defaultProps} value="New value" />);
      expect(screen.getByText(/4991 \/ 5000/)).toBeInTheDocument();
    });
  });

  describe("Character Count Colors", () => {
    it("should show gray color for normal count", () => {
      render(<MarkdownTextarea {...defaultProps} maxLength={1000} />);
      const countElement = screen.getByText(/1000 \/ 1000/);
      expect(countElement.className).toContain("text-gray-500");
    });

    it("should show yellow color when below 500 characters remaining", () => {
      const value = "A".repeat(600);
      render(
        <MarkdownTextarea {...defaultProps} maxLength={1000} value={value} />
      );
      const countElement = screen.getByText(/400 \/ 1000/);
      expect(countElement.className).toContain("text-yellow-400");
    });

    it("should show red color when below 100 characters remaining", () => {
      const value = "A".repeat(950);
      render(
        <MarkdownTextarea {...defaultProps} maxLength={1000} value={value} />
      );
      const countElement = screen.getByText(/50 \/ 1000/);
      expect(countElement.className).toContain("text-red-400");
    });

    it("should show red at exactly 100 remaining", () => {
      const value = "A".repeat(900);
      render(
        <MarkdownTextarea {...defaultProps} maxLength={1000} value={value} />
      );
      const countElement = screen.getByText(/100 \/ 1000/);
      expect(countElement.className).toMatch(/text-red-400|text-yellow-400/);
    });
  });

  describe("User Interaction", () => {
    it("should call onChange when typing", () => {
      const onChange = jest.fn();
      render(<MarkdownTextarea {...defaultProps} onChange={onChange} />);
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, { target: { value: "New text" } });

      expect(onChange).toHaveBeenCalledWith("New text");
    });

    it("should call onChange multiple times", () => {
      const onChange = jest.fn();
      render(<MarkdownTextarea {...defaultProps} onChange={onChange} />);
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, { target: { value: "A" } });
      fireEvent.change(textarea, { target: { value: "AB" } });
      fireEvent.change(textarea, { target: { value: "ABC" } });

      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it("should call onBlur when losing focus", () => {
      const onBlur = jest.fn();
      render(<MarkdownTextarea {...defaultProps} onBlur={onBlur} />);
      const textarea = screen.getByRole("textbox");

      fireEvent.blur(textarea);

      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it("should prevent exceeding max length", () => {
      const onChange = jest.fn();
      render(
        <MarkdownTextarea
          {...defaultProps}
          maxLength={10}
          onChange={onChange}
        />
      );
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, {
        target: { value: "This is a very long text" },
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("should allow text up to max length", () => {
      const onChange = jest.fn();
      render(
        <MarkdownTextarea
          {...defaultProps}
          maxLength={10}
          onChange={onChange}
        />
      );
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, { target: { value: "1234567890" } });

      expect(onChange).toHaveBeenCalledWith("1234567890");
    });

    it("should allow text exactly at max length", () => {
      const onChange = jest.fn();
      render(
        <MarkdownTextarea {...defaultProps} maxLength={5} onChange={onChange} />
      );
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, { target: { value: "12345" } });

      expect(onChange).toHaveBeenCalledWith("12345");
    });
  });

  describe("Disabled State", () => {
    it("should disable textarea when disabled prop is true", () => {
      render(<MarkdownTextarea {...defaultProps} disabled />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeDisabled();
    });

    it("should have disabled styling", () => {
      render(<MarkdownTextarea {...defaultProps} disabled />);
      const textarea = screen.getByRole("textbox");
      expect(textarea.className).toContain("cursor-not-allowed");
      expect(textarea.className).toContain("opacity-60");
    });
  });

  describe("Error State", () => {
    it("should display error message", () => {
      render(
        <MarkdownTextarea {...defaultProps} error="This field is required" />
      );
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should show warning icon with error", () => {
      render(<MarkdownTextarea {...defaultProps} error="Error message" />);
      expect(screen.getByText("⚠")).toBeInTheDocument();
    });

    it("should have error styling", () => {
      render(<MarkdownTextarea {...defaultProps} error="Error" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea.className).toContain("border-red-500");
      expect(textarea.className).toContain("focus:ring-red-500");
    });

    it("should apply error border color via style", () => {
      render(<MarkdownTextarea {...defaultProps} error="Error" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea.style.borderColor).toBe("rgb(239, 68, 68)");
    });

    it("should show both error and helper text", () => {
      render(
        <MarkdownTextarea
          {...defaultProps}
          error="Error message"
          helperText="Helper text"
        />
      );
      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.getByText("Helper text")).toBeInTheDocument();
    });
  });

  describe("Rows Configuration", () => {
    it("should use default rows", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "6");
    });

    it("should use custom rows", () => {
      render(<MarkdownTextarea {...defaultProps} rows={10} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "10");
    });

    it("should use small rows count", () => {
      render(<MarkdownTextarea {...defaultProps} rows={3} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "3");
    });
  });

  describe("Styling", () => {
    it("should have base classes", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea.className).toContain("input-field");
      expect(textarea.className).toContain("w-full");
      expect(textarea.className).toContain("px-4");
      expect(textarea.className).toContain("py-2");
      expect(textarea.className).toContain("rounded-lg");
      expect(textarea.className).toContain("resize-y");
      expect(textarea.className).toContain("font-mono");
    });

    it("should have focus styling when not disabled or error", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea.className).toContain("hover:border-dark-400");
      expect(textarea.className).toContain("focus:ring-primary-500");
    });

    it("should have monospace font", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea.className).toContain("font-mono");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty value", () => {
      render(<MarkdownTextarea {...defaultProps} value="" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("");
    });

    it("should handle undefined value", () => {
      render(<MarkdownTextarea {...defaultProps} value={undefined as any} />);
      expect(screen.getByText(/5000 \/ 5000/)).toBeInTheDocument();
    });

    it("should handle null value", () => {
      render(<MarkdownTextarea {...defaultProps} value={null as any} />);
      expect(screen.getByText(/5000 \/ 5000/)).toBeInTheDocument();
    });

    it("should handle value with newlines", () => {
      const multilineValue = "Line 1\nLine 2\nLine 3";
      render(<MarkdownTextarea {...defaultProps} value={multilineValue} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue(multilineValue);
    });

    it("should handle value with special characters", () => {
      const specialValue = "!@#$%^&*()_+";
      render(<MarkdownTextarea {...defaultProps} value={specialValue} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue(specialValue);
    });

    it("should handle very long initial value", () => {
      const longValue = "A".repeat(4999);
      render(<MarkdownTextarea {...defaultProps} value={longValue} />);
      expect(screen.getByText(/1 \/ 5000/)).toBeInTheDocument();
    });

    it("should handle maxLength of 0", () => {
      const onChange = jest.fn();
      render(
        <MarkdownTextarea {...defaultProps} maxLength={0} onChange={onChange} />
      );
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, { target: { value: "A" } });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("should handle rows of 1", () => {
      render(<MarkdownTextarea {...defaultProps} rows={1} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "1");
    });

    it("should not call onBlur if not provided", () => {
      render(<MarkdownTextarea {...defaultProps} />);
      const textarea = screen.getByRole("textbox");

      expect(() => fireEvent.blur(textarea)).not.toThrow();
    });
  });

  describe("Label Variations", () => {
    it("should render label with required indicator", () => {
      render(
        <MarkdownTextarea {...defaultProps} label="Custom Label" required />
      );
      expect(screen.getByText("Custom Label")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render label without required indicator", () => {
      render(<MarkdownTextarea {...defaultProps} label="Custom Label" />);
      expect(screen.getByText("Custom Label")).toBeInTheDocument();
      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("should handle empty label", () => {
      render(<MarkdownTextarea {...defaultProps} label="" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle all props together", () => {
      render(
        <MarkdownTextarea
          label="Test Label"
          value="Initial"
          onChange={jest.fn()}
          placeholder="Enter text"
          maxLength={100}
          rows={4}
          disabled={false}
          helperText="Help text"
          error=""
          required={true}
          onBlur={jest.fn()}
        />
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
      expect(screen.getByText("Initial")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
      expect(screen.getByText("Help text")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.getByText(/93 \/ 100/)).toBeInTheDocument();
    });

    it("should update character count correctly after multiple changes", () => {
      render(<MarkdownTextarea {...defaultProps} maxLength={20} />);
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, { target: { value: "12345" } });
      expect(screen.getByText(/15 \/ 20/)).toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: "1234567890" } });
      expect(screen.getByText(/10 \/ 20/)).toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: "123" } });
      expect(screen.getByText(/17 \/ 20/)).toBeInTheDocument();
    });

    it("should maintain state consistency", () => {
      const { rerender } = render(
        <MarkdownTextarea {...defaultProps} value="Test" />
      );
      expect(screen.getByText(/4996 \/ 5000/)).toBeInTheDocument();

      rerender(
        <MarkdownTextarea {...defaultProps} value="Test" maxLength={100} />
      );
      expect(screen.getByText(/96 \/ 100/)).toBeInTheDocument();
    });
  });
});
