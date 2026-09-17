import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import Textarea from "@/app/components/ui/Textarea";
import { createRef } from "react";

describe("Textarea Component", () => {
  describe("Rendering", () => {
    it("should render textarea element", () => {
      render(<Textarea />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<Textarea label="Description" />);
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("should render without label", () => {
      const { container } = render(<Textarea />);
      const label = container.querySelector("label");
      expect(label).not.toBeInTheDocument();
    });

    it("should show required indicator", () => {
      render(<Textarea label="Required Field" required />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message", () => {
      render(<Textarea error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should apply error styling", () => {
      render(<Textarea error="Error" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("border-red-500");
    });

    it("should not show helper text when error exists", () => {
      render(<Textarea error="Error message" helperText="Helper text" />);
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
    });
  });

  describe("Helper Text", () => {
    it("should display helper text", () => {
      render(<Textarea helperText="Enter a detailed description" />);
      expect(screen.getByText("Enter a detailed description")).toBeInTheDocument();
    });

    it("should show helper text when no error", () => {
      render(<Textarea helperText="Helper text" />);
      expect(screen.getByText("Helper text")).toBeInTheDocument();
    });

    it("should handle ReactNode as helper text", () => {
      render(
        <Textarea
          helperText={
            <span>
              Helper with <strong>bold</strong>
            </span>
          }
        />
      );
      expect(screen.getByText(/Helper with/)).toBeInTheDocument();
    });
  });

  describe("Attributes", () => {
    it("should be required", () => {
      render(<Textarea required />);
      expect(screen.getByRole("textbox")).toBeRequired();
    });

    it("should be disabled", () => {
      render(<Textarea disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("should have placeholder", () => {
      render(<Textarea placeholder="Enter text here..." />);
      expect(screen.getByPlaceholderText("Enter text here...")).toBeInTheDocument();
    });

    it("should have name attribute", () => {
      render(<Textarea name="description" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("name", "description");
    });

    it("should have rows attribute", () => {
      render(<Textarea rows={5} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("rows", "5");
    });

    it("should have cols attribute", () => {
      render(<Textarea cols={50} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("cols", "50");
    });

    it("should have maxLength attribute", () => {
      render(<Textarea maxLength={500} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "500");
    });
  });

  describe("User Interactions", () => {
    it("should handle onChange event", () => {
      const handleChange = jest.fn();
      render(<Textarea onChange={handleChange} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "New text" } });
      expect(handleChange).toHaveBeenCalled();
    });

    it("should handle onFocus event", () => {
      const handleFocus = jest.fn();
      render(<Textarea onFocus={handleFocus} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.focus(textarea);
      expect(handleFocus).toHaveBeenCalled();
    });

    it("should handle onBlur event", () => {
      const handleBlur = jest.fn();
      render(<Textarea onBlur={handleBlur} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.blur(textarea);
      expect(handleBlur).toHaveBeenCalled();
    });

    it("should update value", () => {
      render(<Textarea value="Initial text" onChange={() => {}} />);
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toBe("Initial text");
    });

    it("should show an accurate live character count for default values", () => {
      render(<Textarea defaultValue="Draft" maxLength={10} showCharCount />);
      expect(screen.getByText("5 / 10")).toBeInTheDocument();
    });

    it("should update the live character count for controlled values", () => {
      const { rerender } = render(
        <Textarea value="Hi" onChange={() => {}} maxLength={10} showCharCount />
      );

      expect(screen.getByText("2 / 10")).toBeInTheDocument();

      rerender(<Textarea value="Hello" onChange={() => {}} maxLength={10} showCharCount />);

      expect(screen.getByText("5 / 10")).toBeInTheDocument();
      expect(screen.getByText("5 / 10")).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Ref Handling", () => {
    it("should forward ref to textarea element", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it("should allow ref access to textarea methods", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      render(<Textarea className="custom-textarea" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("custom-textarea");
    });

    it("should preserve default classes", () => {
      render(<Textarea className="custom-textarea" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("input-field");
      expect(textarea).toHaveClass("custom-textarea");
    });
  });

  describe("Styling", () => {
    it("should have resize-vertical class", () => {
      render(<Textarea />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("resize-y");
    });

    it("should have full width", () => {
      render(<Textarea />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("w-full");
    });
  });

  describe("Edge Cases", () => {
    it("should handle long text", () => {
      const longText = "A".repeat(1000);
      render(<Textarea value={longText} onChange={() => {}} />);
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toBe(longText);
    });

    it("should handle multiline text", () => {
      const multilineText = "Line 1\nLine 2\nLine 3";
      render(<Textarea value={multilineText} onChange={() => {}} />);
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toBe(multilineText);
    });

    it("should handle empty value", () => {
      render(<Textarea value="" onChange={() => {}} />);
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });

    it("should render with all props", () => {
      render(
        <Textarea
          label="Description"
          error="Error"
          helperText="Helper"
          required
          disabled
          placeholder="Enter text"
          rows={10}
          className="custom"
        />
      );
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have textbox role", () => {
      render(<Textarea />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should connect label to textarea", () => {
      render(<Textarea label="Comments" />);
      const textarea = screen.getByRole("textbox");
      const label = screen.getByText("Comments");
      expect(label).toBeInTheDocument();
      expect(textarea).toBeInTheDocument();
    });

    it("should describe the textarea with the character count when enabled", () => {
      render(<Textarea label="Comments" maxLength={20} showCharCount />);
      const textarea = screen.getByRole("textbox");
      const counter = screen.getByText("0 / 20");

      expect(counter).toHaveAttribute("id");
      expect(textarea).toHaveAttribute("aria-describedby", counter.getAttribute("id") || "");
    });
  });
});
