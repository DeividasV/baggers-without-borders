import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DatePicker from "@/app/components/ui/DatePicker";

describe("DatePicker Component", () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render date input", () => {
      render(<DatePicker {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<DatePicker {...defaultProps} label="Birth Date" />);
      expect(screen.getByText("Birth Date")).toBeInTheDocument();
    });

    it("should not render label when not provided", () => {
      render(<DatePicker {...defaultProps} />);
      expect(screen.queryByText(/Birth Date/)).not.toBeInTheDocument();
    });

    it("should render required indicator", () => {
      render(<DatePicker {...defaultProps} label="Date" required={true} />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render placeholder", () => {
      render(<DatePicker {...defaultProps} placeholder="Choose date" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.placeholder).toBe("Choose date");
    });

    it("should render default placeholder", () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.placeholder).toBe("Select date");
    });

    it("should render calendar icon", () => {
      const { container } = render(<DatePicker {...defaultProps} />);
      expect(container.querySelector(".lucide-calendar")).toBeInTheDocument();
    });

    it("should render error message", () => {
      render(<DatePicker {...defaultProps} error="Invalid date" />);
      expect(screen.getByText("Invalid date")).toBeInTheDocument();
    });
  });

  describe("Value Display", () => {
    it("should display selected value", () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("2024-03-15");
    });

    it("should display empty when no value", () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should handle ISO date string with time", () => {
      render(<DatePicker {...defaultProps} value="2024-03-15T10:30:00" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("2024-03-15");
    });
  });

  describe("Calendar Toggle", () => {
    it("should not show calendar initially", () => {
      render(<DatePicker {...defaultProps} />);
      expect(screen.queryByText("Mo")).not.toBeInTheDocument();
    });

    it("should open calendar when input clicked", () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.click(input);
      expect(screen.getByText("Mo")).toBeInTheDocument();
    });

    it("should open calendar when icon clicked", () => {
      const { container } = render(<DatePicker {...defaultProps} />);
      const icon = container.querySelector(".lucide-calendar")
        ?.parentElement as HTMLButtonElement;
      fireEvent.click(icon);
      expect(screen.getByText("Mo")).toBeInTheDocument();
    });

    it("should close calendar when date selected", async () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.click(input);

      const dayButton = screen.getByText("15");
      fireEvent.click(dayButton);

      await waitFor(() => {
        expect(screen.queryByText("Mo")).not.toBeInTheDocument();
      });
    });

    it("should close calendar when clicking outside", async () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.click(input);
      expect(screen.getByText("Mo")).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText("Mo")).not.toBeInTheDocument();
      });
    });

    it("should not open calendar when disabled", () => {
      render(<DatePicker {...defaultProps} disabled={true} />);
      const input = screen.getByRole("textbox");
      fireEvent.click(input);
      expect(screen.queryByText("Mo")).not.toBeInTheDocument();
    });
  });

  describe("Calendar Navigation", () => {
    beforeEach(() => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);
      const input = screen.getByRole("textbox");
      fireEvent.click(input);
    });

    it("should show current month and year", () => {
      expect(screen.getByDisplayValue("March")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2024")).toBeInTheDocument();
    });

    it("should navigate to previous month", () => {
      const prevButton = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.querySelector(".lucide-chevron-left")
        ) as HTMLButtonElement;
      fireEvent.click(prevButton);
      expect(screen.getByDisplayValue("February")).toBeInTheDocument();
    });

    it("should navigate to next month", () => {
      const nextButton = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.querySelector(".lucide-chevron-right")
        ) as HTMLButtonElement;
      fireEvent.click(nextButton);
      expect(screen.getByDisplayValue("April")).toBeInTheDocument();
    });

    it("should change month via dropdown", () => {
      const monthSelect = screen.getByDisplayValue(
        "March"
      ) as HTMLSelectElement;
      fireEvent.change(monthSelect, { target: { value: "5" } });
      expect(screen.getByDisplayValue("June")).toBeInTheDocument();
    });

    it("should change year via dropdown", () => {
      const yearSelect = screen.getByDisplayValue("2024") as HTMLSelectElement;
      fireEvent.change(yearSelect, { target: { value: "2025" } });
      expect(screen.getByDisplayValue("2025")).toBeInTheDocument();
    });
  });

  describe("Date Selection", () => {
    it("should call onChange when date selected", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const dayButton = screen.getByText("15");
      fireEvent.click(dayButton);

      expect(mockOnChange).toHaveBeenCalled();
      const callArg = mockOnChange.mock.calls[0][0];
      expect(callArg).toMatch(/^\d{4}-\d{2}-15$/);
    });

    it("should format date as YYYY-MM-DD", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const dayButtons = screen.getAllByText("5");
      fireEvent.click(dayButtons[0]);

      const callArg = mockOnChange.mock.calls[0][0];
      expect(callArg).toMatch(/^\d{4}-\d{2}-05$/);
    });

    it("should highlight selected date", () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);
      fireEvent.click(screen.getByRole("textbox"));

      const selectedDay = screen.getByText("15");
      expect(selectedDay).toHaveClass("bg-primary-500");
    });

    it("should highlight today", () => {
      const today = new Date();
      const currentDay = today.getDate();

      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const todayButtons = screen.getAllByText(String(currentDay));
      const todayButton = todayButtons.find((btn) =>
        btn.classList.contains("border-primary-500")
      );
      expect(todayButton).toHaveClass("border-primary-500");
    });

    it("should style current month days differently from other months", () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);
      fireEvent.click(screen.getByRole("textbox"));

      const currentMonthDay = screen.getByText("15");
      expect(currentMonthDay).not.toHaveClass("text-gray-600");
    });
  });

  describe("Manual Input", () => {
    it("should accept typed date in YYYY-MM-DD format", () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "2024-12-25" } });

      expect(mockOnChange).toHaveBeenCalledWith("2024-12-25");
    });

    it("should not call onChange for invalid date format", () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "12/25/2024" } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should call onChange with empty string when cleared", () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledWith("");
    });
  });

  describe("Date Range Constraints", () => {
    it("should disable dates before minDate", () => {
      render(
        <DatePicker {...defaultProps} minDate="2024-03-15" value="2024-03-20" />
      );
      fireEvent.click(screen.getByRole("textbox"));

      const earlyDate = screen.getByText("10");
      expect(earlyDate).toHaveClass("opacity-40");
      expect(earlyDate).toHaveClass("cursor-not-allowed");
    });

    it("should disable dates after maxDate", () => {
      render(
        <DatePicker {...defaultProps} maxDate="2024-03-15" value="2024-03-10" />
      );
      fireEvent.click(screen.getByRole("textbox"));

      const lateDate = screen.getByText("20");
      expect(lateDate).toHaveClass("opacity-40");
      expect(lateDate).toHaveClass("cursor-not-allowed");
    });

    it("should not call onChange when disabled date clicked", () => {
      render(
        <DatePicker {...defaultProps} minDate="2024-03-15" value="2024-03-20" />
      );
      fireEvent.click(screen.getByRole("textbox"));

      const disabledDate = screen.getByText("10");
      fireEvent.click(disabledDate);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Quick Actions", () => {
    it("should render Today button", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));
      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("should render Clear button", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));
      expect(screen.getByText("Clear")).toBeInTheDocument();
    });

    it("should select today when Today button clicked", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const todayButton = screen.getByText("Today");
      fireEvent.click(todayButton);

      const today = new Date();
      const expectedDate = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      expect(mockOnChange).toHaveBeenCalledWith(expectedDate);
    });

    it("should clear date when Clear button clicked", async () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);
      fireEvent.click(screen.getByRole("textbox"));

      const clearButton = screen.getByText("Clear");
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith("");
      await waitFor(() => {
        expect(screen.queryByText("Mo")).not.toBeInTheDocument();
      });
    });
  });

  describe("Weekday Headers", () => {
    it("should render weekday headers", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      expect(screen.getByText("Mo")).toBeInTheDocument();
      expect(screen.getByText("Tu")).toBeInTheDocument();
      expect(screen.getByText("We")).toBeInTheDocument();
      expect(screen.getByText("Th")).toBeInTheDocument();
      expect(screen.getByText("Fr")).toBeInTheDocument();
      expect(screen.getByText("Sa")).toBeInTheDocument();
      expect(screen.getByText("Su")).toBeInTheDocument();
    });
  });

  describe("Month Options", () => {
    it("should have all 12 months in dropdown", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const monthSelect = screen.getByDisplayValue(
        /January|February|March|April|May|June|July|August|September|October|November|December/
      ) as HTMLSelectElement;
      const options = Array.from(monthSelect.options).map((opt) => opt.text);

      expect(options).toContain("January");
      expect(options).toContain("February");
      expect(options).toContain("December");
      expect(options).toHaveLength(12);
    });
  });

  describe("Year Options", () => {
    it("should have year range in dropdown", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const currentYear = new Date().getFullYear();
      const yearSelect = screen
        .getAllByRole("combobox")
        .find(
          (select) =>
            (select as HTMLSelectElement).value === String(currentYear)
        ) as HTMLSelectElement;

      expect(yearSelect).toBeInTheDocument();
      expect(yearSelect.options.length).toBeGreaterThan(100);
    });
  });

  describe("Disabled State", () => {
    it("should disable input when disabled", () => {
      render(<DatePicker {...defaultProps} disabled={true} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it("should disable calendar icon when disabled", () => {
      const { container } = render(
        <DatePicker {...defaultProps} disabled={true} />
      );
      const icon = container.querySelector(".lucide-calendar")
        ?.parentElement as HTMLButtonElement;
      expect(icon.disabled).toBe(true);
    });

    it("should apply disabled styles to input", () => {
      render(<DatePicker {...defaultProps} disabled={true} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("opacity-50");
      expect(input).toHaveClass("cursor-not-allowed");
    });

    it("should apply disabled styles to icon", () => {
      const { container } = render(
        <DatePicker {...defaultProps} disabled={true} />
      );
      const icon = container.querySelector(".lucide-calendar");
      expect(icon).toHaveClass("text-gray-600");
    });
  });

  describe("Styling", () => {
    it("should apply error border when error exists", () => {
      render(<DatePicker {...defaultProps} error="Invalid" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-red-500");
    });

    it("should apply focus styles", () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus:ring-2");
      expect(input).toHaveClass("focus:ring-primary-500");
    });

    it("should apply hover styles when not disabled", () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("hover:border-gray-600");
    });

    it("should have calendar grid layout", () => {
      const { container } = render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const grid = container.querySelector(".grid-cols-7");
      expect(grid).toBeInTheDocument();
    });
  });

  describe("Calendar Display", () => {
    it("should show 42 day cells (6 weeks)", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const dayButtons = screen
        .getAllByRole("button")
        .filter((btn) => /^\d+$/.test(btn.textContent || ""));
      expect(dayButtons.length).toBe(42);
    });

    it("should include days from previous month", () => {
      render(<DatePicker {...defaultProps} value="2024-03-01" />);
      fireEvent.click(screen.getByRole("textbox"));

      // March 1, 2024 is a Friday, so should show some February days
      const febDays = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return (
          text && parseInt(text) > 25 && btn.classList.contains("text-gray-600")
        );
      });
      expect(febDays.length).toBeGreaterThan(0);
    });

    it("should include days from next month", () => {
      render(<DatePicker {...defaultProps} value="2024-03-31" />);
      fireEvent.click(screen.getByRole("textbox"));

      // Should show some April days to fill the grid
      const aprDays = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return (
          text && parseInt(text) < 10 && btn.classList.contains("text-gray-600")
        );
      });
      expect(aprDays.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle leap year", () => {
      render(<DatePicker {...defaultProps} value="2024-02-29" />);
      fireEvent.click(screen.getByRole("textbox"));

      const feb29 = screen
        .getAllByText("29")
        .find((btn) => btn.classList.contains("bg-primary-500"));
      expect(feb29).toBeInTheDocument();
    });

    it("should handle year boundaries", () => {
      render(<DatePicker {...defaultProps} value="2024-12-31" />);
      fireEvent.click(screen.getByRole("textbox"));

      const dec31 = screen.getByText("31");
      expect(dec31).toBeInTheDocument();
    });

    it("should handle invalid value gracefully", () => {
      render(<DatePicker {...defaultProps} value="invalid-date" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("invalid-date");
    });

    it("should not crash when value is undefined", () => {
      render(<DatePicker {...defaultProps} value={undefined} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("should have button type for icon", () => {
      const { container } = render(<DatePicker {...defaultProps} />);
      const iconButton = container.querySelector(".lucide-calendar")
        ?.parentElement as HTMLButtonElement;
      expect(iconButton.type).toBe("button");
    });

    it("should have title on navigation buttons", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const prevButton = screen
        .getAllByRole("button")
        .find((btn) => btn.title === "Previous month");
      const nextButton = screen
        .getAllByRole("button")
        .find((btn) => btn.title === "Next month");

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it("should have button type for Today and Clear", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const todayButton = screen.getByText("Today") as HTMLButtonElement;
      const clearButton = screen.getByText("Clear") as HTMLButtonElement;

      expect(todayButton.type).toBe("button");
      expect(clearButton.type).toBe("button");
    });
  });
});
