import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@/__tests__/utils/test-utils";
import YearPicker from "@/app/components/ui/YearPicker";

describe("YearPicker Component", () => {
  const defaultProps = {
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render year picker input", () => {
      render(<YearPicker {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<YearPicker {...defaultProps} label="Birth Year" />);
      expect(screen.getByText("Birth Year")).toBeInTheDocument();
    });

    it("should render without label", () => {
      render(<YearPicker {...defaultProps} />);
      expect(screen.queryByRole("label")).not.toBeInTheDocument();
    });

    it("should render with placeholder", () => {
      render(<YearPicker {...defaultProps} placeholder="Pick a year" />);
      expect(screen.getByPlaceholderText("Pick a year")).toBeInTheDocument();
    });

    it("should render with default placeholder", () => {
      render(<YearPicker {...defaultProps} />);
      expect(screen.getByPlaceholderText("Select year")).toBeInTheDocument();
    });

    it("should render required indicator", () => {
      render(<YearPicker {...defaultProps} label="Year" required />);
      const label = screen.getByText(/Year/);
      expect(label.parentElement?.textContent).toContain("*");
    });

    it("should render error message", () => {
      render(<YearPicker {...defaultProps} error="Invalid year" />);
      expect(screen.getByText("Invalid year")).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const { container } = render(<YearPicker {...defaultProps} />);
      const chevron = container.querySelector(".lucide-chevron-down");
      expect(chevron).toBeInTheDocument();
    });
  });

  describe("Value Display", () => {
    it("should display selected value", () => {
      render(<YearPicker {...defaultProps} value={2024} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("2024");
    });

    it("should display empty when no value", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should display initial value", () => {
      render(<YearPicker {...defaultProps} value={2020} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("2020");
    });
  });

  describe("Dropdown Behavior", () => {
    it("should open dropdown on focus", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      expect(
        screen.getByText(new Date().getFullYear().toString())
      ).toBeInTheDocument();
    });

    it("should open dropdown on chevron click", () => {
      const { container } = render(<YearPicker {...defaultProps} />);
      const chevron = container.querySelector(
        ".lucide-chevron-down"
      )?.parentElement;
      fireEvent.click(chevron!);
      expect(
        screen.getByText(new Date().getFullYear().toString())
      ).toBeInTheDocument();
    });

    it("should close dropdown on outside click", async () => {
      render(
        <div>
          <YearPicker {...defaultProps} />
          <button>Outside</button>
        </div>
      );
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      const outsideButton = screen.getByText("Outside");
      fireEvent.mouseDown(outsideButton);

      await waitFor(() => {
        expect(
          screen.queryByText(new Date().getFullYear().toString())
        ).not.toBeInTheDocument();
      });
    });

    it("should close dropdown on Escape key", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: "Escape" });
      expect(
        screen.queryByText(new Date().getFullYear().toString())
      ).not.toBeInTheDocument();
    });

    it("should rotate chevron when dropdown is open", () => {
      const { container } = render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      const chevron = container.querySelector(".lucide-chevron-down");

      fireEvent.focus(input);
      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Year Selection", () => {
    it("should call onChange when year is selected", () => {
      const onChange = jest.fn();
      render(<YearPicker {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      const year2024 = screen.getByText("2024");
      fireEvent.click(year2024);

      expect(onChange).toHaveBeenCalledWith(2024);
    });

    it("should close dropdown after selection", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      const year2024 = screen.getByText("2024");
      fireEvent.click(year2024);

      expect(screen.queryByText("2023")).not.toBeInTheDocument();
    });

    it("should highlight selected year", () => {
      render(<YearPicker {...defaultProps} value={2024} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      const year2024 = screen.getByText("2024");
      expect(year2024).toHaveClass("bg-primary-900/40");
    });
  });

  describe("Typing Input", () => {
    it("should allow typing year", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "2024" } });
      expect((input as HTMLInputElement).value).toBe("2024");
    });

    it("should call onChange when valid 4-digit year is typed", () => {
      const onChange = jest.fn();
      render(
        <YearPicker
          {...defaultProps}
          onChange={onChange}
          minYear={2000}
          maxYear={2025}
        />
      );
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "2024" } });
      expect(onChange).toHaveBeenCalledWith(2024);
    });

    it("should not call onChange for invalid year", () => {
      const onChange = jest.fn();
      render(
        <YearPicker
          {...defaultProps}
          onChange={onChange}
          minYear={2000}
          maxYear={2025}
        />
      );
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "1999" } });
      expect(onChange).not.toHaveBeenCalledWith(1999);
    });

    it("should call onChange with null when input is cleared", () => {
      const onChange = jest.fn();
      render(<YearPicker {...defaultProps} onChange={onChange} value={2024} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "" } });
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("should select first filtered year on Enter key", () => {
      const onChange = jest.fn();
      render(<YearPicker {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "202" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe("Filtering Years", () => {
    it("should filter years based on search", () => {
      render(<YearPicker {...defaultProps} minYear={2020} maxYear={2025} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "2024" } });

      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.queryByText("2020")).not.toBeInTheDocument();
    });

    it('should show "no years found" message', () => {
      render(<YearPicker {...defaultProps} minYear={2020} maxYear={2025} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "1999" } });

      expect(
        screen.getByText(/No years found matching "1999"/)
      ).toBeInTheDocument();
    });

    it("should show all years when search is empty", () => {
      render(<YearPicker {...defaultProps} minYear={2023} maxYear={2025} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      expect(screen.getByText("2025")).toBeInTheDocument();
      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.getByText("2023")).toBeInTheDocument();
    });
  });

  describe("Clear Button", () => {
    it("should show clear button when value exists", () => {
      const { container } = render(
        <YearPicker {...defaultProps} value={2024} />
      );
      const clearButton = container.querySelector(".lucide-x");
      expect(clearButton).toBeInTheDocument();
    });

    it("should not show clear button when no value", () => {
      const { container } = render(<YearPicker {...defaultProps} />);
      const clearButton = container.querySelector(".lucide-x");
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should clear value when clear button clicked", () => {
      const onChange = jest.fn();
      const { container } = render(
        <YearPicker {...defaultProps} onChange={onChange} value={2024} />
      );
      const clearButton = container.querySelector(".lucide-x")?.parentElement;
      fireEvent.click(clearButton!);
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe("Year Range", () => {
    it("should respect minYear", () => {
      render(<YearPicker {...defaultProps} minYear={2020} maxYear={2025} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      expect(screen.queryByText("2019")).not.toBeInTheDocument();
      expect(screen.getByText("2020")).toBeInTheDocument();
    });

    it("should respect maxYear", () => {
      render(<YearPicker {...defaultProps} minYear={2020} maxYear={2025} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      expect(screen.getByText("2025")).toBeInTheDocument();
      expect(screen.queryByText("2026")).not.toBeInTheDocument();
    });

    it("should have default minYear of 1900", () => {
      render(<YearPicker {...defaultProps} maxYear={1905} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      expect(screen.getByText("1900")).toBeInTheDocument();
    });

    it("should have default maxYear of current year", () => {
      const currentYear = new Date().getFullYear();
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      expect(screen.getByText(currentYear.toString())).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply error border when error exists", () => {
      render(<YearPicker {...defaultProps} error="Invalid" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-red-500");
    });

    it("should apply normal border when no error", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-[#4f4f4f]");
    });
  });

  describe("Accessibility", () => {
    it("should have numeric inputMode", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("inputMode", "numeric");
    });

    it("should have numeric pattern", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("pattern", "[0-9]*");
    });

    it("should be keyboard navigable", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it("should open dropdown on ArrowDown key", () => {
      render(<YearPicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(
        screen.getByText(new Date().getFullYear().toString())
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle year 0", () => {
      const onChange = jest.fn();
      render(
        <YearPicker
          {...defaultProps}
          onChange={onChange}
          minYear={-10}
          maxYear={10}
        />
      );
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      const year0 = screen.getByText("0");
      fireEvent.click(year0);
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it("should handle single year range", () => {
      render(<YearPicker {...defaultProps} minYear={2024} maxYear={2024} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      expect(screen.getByText("2024")).toBeInTheDocument();
    });

    it("should focus input when focused", () => {
      render(<YearPicker {...defaultProps} value={2024} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      input.focus();
      expect(input).toHaveFocus();
    });
  });
});
