import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import Select from "@/app/components/ui/Select";
import { createRef } from "react";

const mockOptions = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
];

describe("Select Component", () => {
  describe("Rendering", () => {
    it("should render select element", () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });

    it("should render all options", () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<Select options={mockOptions} label="Choose Option" />);
      expect(screen.getByText("Choose Option")).toBeInTheDocument();
    });

    it("should show required indicator", () => {
      render(<Select options={mockOptions} label="Required Field" required />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<Select options={mockOptions} className="custom-select" />);
      const select = screen.getByRole("combobox");
      expect(select).toHaveClass("custom-select");
    });
  });

  describe("Error State", () => {
    it("should display error message", () => {
      render(<Select options={mockOptions} error="Selection required" />);
      expect(screen.getByText("Selection required")).toBeInTheDocument();
    });

    it("should apply error styling", () => {
      render(<Select options={mockOptions} error="Invalid selection" />);
      const select = screen.getByRole("combobox");
      expect(select).toHaveClass("border-red-500");
    });

    it("should not show helper text when error exists", () => {
      render(
        <Select
          options={mockOptions}
          error="Error message"
          helperText="Helper text"
        />
      );
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
    });
  });

  describe("Helper Text", () => {
    it("should display helper text", () => {
      render(<Select options={mockOptions} helperText="Choose one option" />);
      expect(screen.getByText("Choose one option")).toBeInTheDocument();
    });

    it("should show helper text when no error", () => {
      render(<Select options={mockOptions} helperText="Help text" />);
      expect(screen.getByText("Help text")).toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("should handle value selection", () => {
      const handleChange = jest.fn();
      render(<Select options={mockOptions} onChange={handleChange} />);
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "option2" } });
      expect(handleChange).toHaveBeenCalled();
    });

    it("should display selected value", () => {
      render(
        <Select options={mockOptions} value="option2" onChange={() => {}} />
      );
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("option2");
    });

    it("should handle multiple selections", () => {
      const handleChange = jest.fn();
      render(<Select options={mockOptions} onChange={handleChange} />);
      const select = screen.getByRole("combobox");

      fireEvent.change(select, { target: { value: "option1" } });
      fireEvent.change(select, { target: { value: "option3" } });

      expect(handleChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("Attributes", () => {
    it("should be disabled", () => {
      render(<Select options={mockOptions} disabled />);
      expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("should be required", () => {
      render(<Select options={mockOptions} required />);
      expect(screen.getByRole("combobox")).toBeRequired();
    });

    it("should set name attribute", () => {
      render(<Select options={mockOptions} name="category" />);
      expect(screen.getByRole("combobox")).toHaveAttribute("name", "category");
    });

    it("should handle default value", () => {
      render(
        <Select
          options={mockOptions}
          defaultValue="option1"
          value="option1"
          onChange={() => {}}
        />
      );
      const select = screen.getByRole("combobox");
      expect(select).toHaveAttribute("data-is-default", "true");
    });

    it("should detect non-default value", () => {
      render(
        <Select
          options={mockOptions}
          defaultValue="option1"
          value="option2"
          onChange={() => {}}
        />
      );
      const select = screen.getByRole("combobox");
      expect(select).toHaveAttribute("data-is-default", "false");
    });
  });

  describe("Options Handling", () => {
    it("should render empty select with no options", () => {
      render(<Select options={[]} />);
      const select = screen.getByRole("combobox");
      expect(select.children).toHaveLength(0);
    });

    it("should render single option", () => {
      const singleOption = [{ value: "only", label: "Only Option" }];
      render(<Select options={singleOption} />);
      expect(screen.getByText("Only Option")).toBeInTheDocument();
    });

    it("should handle options with same value", () => {
      const duplicateOptions = [
        { value: "same", label: "First" },
        { value: "same", label: "Second" },
      ];
      render(<Select options={duplicateOptions} />);
      // Should render both but with same value
      const select = screen.getByRole("combobox");
      expect(select.children).toHaveLength(2);
    });
  });

  describe("User Interactions", () => {
    it("should handle onChange event", () => {
      const handleChange = jest.fn();
      render(<Select options={mockOptions} onChange={handleChange} />);
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "option2" } });
      expect(handleChange).toHaveBeenCalled();
    });

    it("should handle onFocus event", () => {
      const handleFocus = jest.fn();
      render(<Select options={mockOptions} onFocus={handleFocus} />);
      const select = screen.getByRole("combobox");
      fireEvent.focus(select);
      expect(handleFocus).toHaveBeenCalled();
    });

    it("should handle onBlur event", () => {
      const handleBlur = jest.fn();
      render(<Select options={mockOptions} onBlur={handleBlur} />);
      const select = screen.getByRole("combobox");
      fireEvent.blur(select);
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe("Ref Handling", () => {
    it("should forward ref to select element", () => {
      const ref = createRef<HTMLSelectElement>();
      render(<Select options={mockOptions} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });

    it("should allow ref access to select methods", () => {
      const ref = createRef<HTMLSelectElement>();
      render(<Select options={mockOptions} ref={ref} />);
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
    });
  });

  describe("Accessibility", () => {
    it("should render with label", () => {
      render(<Select options={mockOptions} label="Country" />);
      const select = screen.getByRole("combobox");
      const label = screen.getByText("Country");
      expect(label).toBeInTheDocument();
      expect(select).toBeInTheDocument();
    });

    it("should be keyboard navigable", () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole("combobox");
      fireEvent.keyDown(select, { key: "ArrowDown" });
      expect(select).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle long option labels", () => {
      const longOptions = [
        {
          value: "long",
          label: "This is a very long option label that might wrap",
        },
      ];
      render(<Select options={longOptions} />);
      expect(
        screen.getByText("This is a very long option label that might wrap")
      ).toBeInTheDocument();
    });

    it("should handle special characters in values", () => {
      const specialOptions = [
        { value: "test@123", label: "Special Value" },
        { value: "test space", label: "With Space" },
      ];
      render(<Select options={specialOptions} />);
      expect(screen.getByText("Special Value")).toBeInTheDocument();
      expect(screen.getByText("With Space")).toBeInTheDocument();
    });

    it("should render with all props combined", () => {
      render(
        <Select
          options={mockOptions}
          label="Test Select"
          helperText="Helper"
          required
          disabled
          className="custom"
        />
      );
      expect(screen.getByText("Test Select")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeDisabled();
    });
  });
});
