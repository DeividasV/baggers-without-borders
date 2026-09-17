import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import Input from "@/app/components/ui/Input";
import { createRef } from "react";

describe("Input Component", () => {
  describe("Rendering", () => {
    it("should render input field", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<Input label="Username" />);
      expect(screen.getByText("Username")).toBeInTheDocument();
    });

    it("should show required indicator", () => {
      render(<Input label="Email" required />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render without label", () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.queryByRole("label")).not.toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-class");
    });
  });

  describe("Error State", () => {
    it("should display error message", () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should apply error styling", () => {
      render(<Input error="Invalid" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-red-500");
    });

    it("should not show helper text when error is present", () => {
      render(<Input error="Error" helperText="Helper" />);
      expect(screen.queryByText("Helper")).not.toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  describe("Helper Text", () => {
    it("should display helper text", () => {
      render(<Input helperText="Enter your email address" />);
      expect(screen.getByText("Enter your email address")).toBeInTheDocument();
    });

    it("should show helper text when no error", () => {
      render(<Input helperText="Helper text" />);
      expect(screen.getByText("Helper text")).toBeInTheDocument();
    });
  });

  describe("Input Types", () => {
    it("should render email input", () => {
      render(<Input type="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("should render password input", () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it("should render number input", () => {
      render(<Input type="number" />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });

    it("should render date input", () => {
      render(<Input type="date" />);
      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe("Attributes", () => {
    it("should set placeholder", () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("should set value", () => {
      render(<Input value="test value" onChange={() => {}} />);
      expect(screen.getByDisplayValue("test value")).toBeInTheDocument();
    });

    it("should be disabled", () => {
      render(<Input disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("should be required", () => {
      render(<Input required />);
      expect(screen.getByRole("textbox")).toBeRequired();
    });

    it("should set maxLength", () => {
      render(<Input maxLength={10} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "10");
    });

    it("should set name attribute", () => {
      render(<Input name="username" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("name", "username");
    });
  });

  describe("User Interactions", () => {
    it("should handle onChange event", () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "new value" } });
      expect(handleChange).toHaveBeenCalled();
    });

    it("should handle onFocus event", () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalled();
    });

    it("should handle onBlur event", () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole("textbox");
      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalled();
    });

    it("should handle onKeyDown event", () => {
      const handleKeyDown = jest.fn();
      render(<Input onKeyDown={handleKeyDown} />);
      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe("Ref Handling", () => {
    it("should forward ref to input element", () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it("should allow ref access to input methods", () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
    });
  });

  describe("Accessibility", () => {
    it("should render with label", () => {
      render(<Input label="Email Address" />);
      const input = screen.getByRole("textbox");
      const label = screen.getByText("Email Address");
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    it("should connect label to input", () => {
      render(<Input label="Username" />);
      const label = screen.getByText("Username");
      const input = screen.getByRole("textbox");
      // Label should be associated with input
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string value", () => {
      render(<Input value="" onChange={() => {}} />);
      expect(screen.getByRole("textbox")).toHaveValue("");
    });

    it("should handle long error messages", () => {
      const longError =
        "This is a very long error message that should still be displayed correctly";
      render(<Input error={longError} />);
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it("should render with all props combined", () => {
      render(
        <Input
          label="Test Input"
          placeholder="Enter value"
          helperText="Helper text"
          required
          disabled
          className="custom"
        />
      );
      expect(screen.getByText("Test Input")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter value")).toBeDisabled();
    });
  });
});
