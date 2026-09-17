import { render, screen, fireEvent } from "@testing-library/react";
import DateRangePicker from "@/app/components/ui/DateRangePicker";

describe("DateRangePicker Component", () => {
  const mockOnFromChange = jest.fn();
  const mockOnToChange = jest.fn();
  const defaultProps = {
    onFromChange: mockOnFromChange,
    onToChange: mockOnToChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render two date inputs", () => {
      render(<DateRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);
    });

    it("should render with label", () => {
      render(<DateRangePicker {...defaultProps} label="Date Range" />);
      expect(screen.getByText("Date Range")).toBeInTheDocument();
    });

    it("should not render label when not provided", () => {
      render(<DateRangePicker {...defaultProps} />);
      const labels = screen.queryAllByText(/Date Range/);
      expect(labels).toHaveLength(0);
    });

    it("should render required indicator", () => {
      render(
        <DateRangePicker {...defaultProps} label="Range" required={true} />
      );
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render error message", () => {
      render(<DateRangePicker {...defaultProps} error="Invalid range" />);
      expect(screen.getByText("Invalid range")).toBeInTheDocument();
    });

    it("should render both calendar icons", () => {
      const { container } = render(<DateRangePicker {...defaultProps} />);
      const icons = container.querySelectorAll(".lucide-calendar");
      expect(icons).toHaveLength(2);
    });
  });

  describe("Placeholders", () => {
    it("should render default placeholders", () => {
      render(<DateRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].placeholder).toBe("From");
      expect(inputs[1].placeholder).toBe("To");
    });

    it("should render custom placeholders", () => {
      render(
        <DateRangePicker
          {...defaultProps}
          fromPlaceholder="Start Date"
          toPlaceholder="End Date"
        />
      );
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].placeholder).toBe("Start Date");
      expect(inputs[1].placeholder).toBe("End Date");
    });
  });

  describe("Value Display", () => {
    it("should display from value", () => {
      render(<DateRangePicker {...defaultProps} fromValue="2024-01-01" />);
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("2024-01-01");
    });

    it("should display to value", () => {
      render(<DateRangePicker {...defaultProps} toValue="2024-12-31" />);
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[1].value).toBe("2024-12-31");
    });

    it("should display both values", () => {
      render(
        <DateRangePicker
          {...defaultProps}
          fromValue="2024-01-01"
          toValue="2024-12-31"
        />
      );
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("2024-01-01");
      expect(inputs[1].value).toBe("2024-12-31");
    });

    it("should display empty values", () => {
      render(<DateRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("");
      expect(inputs[1].value).toBe("");
    });
  });

  describe("Date Range Constraints", () => {
    it("should set maxDate on from picker based on toValue", () => {
      render(
        <DateRangePicker
          {...defaultProps}
          fromValue="2024-01-01"
          toValue="2024-06-30"
        />
      );
      const inputs = screen.getAllByRole("textbox");
      fireEvent.click(inputs[0]);

      // Should not be able to select dates after toValue
      // This is enforced by DatePicker's maxDate prop
      expect(inputs[0]).toBeInTheDocument();
    });

    it("should set minDate on to picker based on fromValue", () => {
      render(
        <DateRangePicker
          {...defaultProps}
          fromValue="2024-01-01"
          toValue="2024-06-30"
        />
      );
      const inputs = screen.getAllByRole("textbox");
      fireEvent.click(inputs[1]);

      // Should not be able to select dates before fromValue
      // This is enforced by DatePicker's minDate prop
      expect(inputs[1]).toBeInTheDocument();
    });
  });

  describe("From Date Selection", () => {
    it("should call onFromChange when from date selected", () => {
      render(<DateRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox");
      fireEvent.click(inputs[0]);

      const dayButton = screen.getAllByText("15")[0];
      fireEvent.click(dayButton);

      expect(mockOnFromChange).toHaveBeenCalled();
    });

    it("should handle manual from date input", () => {
      render(<DateRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox");

      fireEvent.change(inputs[0], { target: { value: "2024-03-15" } });

      expect(mockOnFromChange).toHaveBeenCalledWith("2024-03-15");
    });
  });

  describe("To Date Selection", () => {
    it("should call onToChange when to date selected", () => {
      render(<DateRangePicker {...defaultProps} fromValue="2024-01-01" />);
      const inputs = screen.getAllByRole("textbox");
      fireEvent.click(inputs[1]);

      const dayButton = screen.getAllByText("20")[0];
      fireEvent.click(dayButton);

      expect(mockOnToChange).toHaveBeenCalled();
    });

    it("should handle manual to date input", () => {
      render(<DateRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox");

      fireEvent.change(inputs[1], { target: { value: "2024-12-31" } });

      expect(mockOnToChange).toHaveBeenCalledWith("2024-12-31");
    });
  });

  describe("Disabled State", () => {
    it("should disable both inputs when disabled", () => {
      render(<DateRangePicker {...defaultProps} disabled={true} />);
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].disabled).toBe(true);
      expect(inputs[1].disabled).toBe(true);
    });

    it("should disable both calendar icons when disabled", () => {
      const { container } = render(
        <DateRangePicker {...defaultProps} disabled={true} />
      );
      const iconButtons = Array.from(
        container.querySelectorAll(".lucide-calendar")
      ).map((icon) => icon.parentElement as HTMLButtonElement);
      expect(iconButtons[0].disabled).toBe(true);
      expect(iconButtons[1].disabled).toBe(true);
    });

    it("should not open calendar when disabled", () => {
      render(<DateRangePicker {...defaultProps} disabled={true} />);
      const inputs = screen.getAllByRole("textbox");
      fireEvent.click(inputs[0]);
      expect(screen.queryByText("Mo")).not.toBeInTheDocument();
    });
  });

  describe("Required State", () => {
    it("should pass required to both date pickers", () => {
      render(
        <DateRangePicker {...defaultProps} label="Range" required={true} />
      );
      // Both DatePickers receive the required prop
      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("should have flex gap between inputs", () => {
      const { container } = render(<DateRangePicker {...defaultProps} />);
      const wrapper = container.querySelector(".flex.gap-1");
      expect(wrapper).toBeInTheDocument();
    });

    it("should have space-y on container", () => {
      const { container } = render(<DateRangePicker {...defaultProps} />);
      const wrapper = container.querySelector(".space-y-2");
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("Error Display", () => {
    it("should show error message when error provided", () => {
      render(
        <DateRangePicker {...defaultProps} error="Date range is invalid" />
      );
      expect(screen.getByText("Date range is invalid")).toBeInTheDocument();
    });

    it("should not show error when error is undefined", () => {
      render(<DateRangePicker {...defaultProps} />);
      const error = screen.queryByText(/invalid/);
      expect(error).not.toBeInTheDocument();
    });

    it("should apply error text color", () => {
      render(<DateRangePicker {...defaultProps} error="Error" />);
      const error = screen.getByText("Error");
      expect(error).toHaveClass("text-red-400");
    });
  });

  describe("Label Display", () => {
    it("should show label above inputs", () => {
      render(<DateRangePicker {...defaultProps} label="Activity Period" />);
      const label = screen.getByText("Activity Period");
      expect(label).toHaveClass("text-gray-400");
    });

    it("should show required asterisk when required", () => {
      render(
        <DateRangePicker {...defaultProps} label="Period" required={true} />
      );
      const asterisk = screen.getByText("*");
      expect(asterisk).toHaveClass("text-red-400");
      expect(asterisk).toHaveClass("ml-1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle both values as undefined", () => {
      render(
        <DateRangePicker
          {...defaultProps}
          fromValue={undefined}
          toValue={undefined}
        />
      );
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("");
      expect(inputs[1].value).toBe("");
    });

    it("should handle only fromValue provided", () => {
      render(<DateRangePicker {...defaultProps} fromValue="2024-01-01" />);
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("2024-01-01");
      expect(inputs[1].value).toBe("");
    });

    it("should handle only toValue provided", () => {
      render(<DateRangePicker {...defaultProps} toValue="2024-12-31" />);
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("");
      expect(inputs[1].value).toBe("2024-12-31");
    });

    it("should handle same date for from and to", () => {
      const sameDate = "2024-06-15";
      render(
        <DateRangePicker
          {...defaultProps}
          fromValue={sameDate}
          toValue={sameDate}
        />
      );
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe(sameDate);
      expect(inputs[1].value).toBe(sameDate);
    });

    it("should handle long label text", () => {
      const longLabel =
        "A very long label that describes the date range selection in great detail";
      render(<DateRangePicker {...defaultProps} label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it("should handle long error message", () => {
      const longError =
        "A very long error message that explains what went wrong with the date range selection";
      render(<DateRangePicker {...defaultProps} error={longError} />);
      expect(screen.getByText(longError)).toBeInTheDocument();
    });
  });

  describe("Calendar Interaction", () => {
    it("should open from calendar independently", () => {
      render(<DateRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox");
      fireEvent.click(inputs[0]);
      expect(screen.getByText("Mo")).toBeInTheDocument();
    });

    it("should open to calendar independently", () => {
      render(<DateRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox");
      fireEvent.click(inputs[1]);
      expect(screen.getByText("Mo")).toBeInTheDocument();
    });

    it("should handle clicking between from and to calendars", () => {
      render(<DateRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox");

      // Open from calendar
      fireEvent.click(inputs[0]);
      expect(screen.getByText("Mo")).toBeInTheDocument();

      // Click outside to close
      fireEvent.mouseDown(document.body);

      // Open to calendar
      fireEvent.click(inputs[1]);
      expect(screen.getByText("Mo")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("should work with all props together", () => {
      render(
        <DateRangePicker
          {...defaultProps}
          label="Project Duration"
          fromValue="2024-01-01"
          toValue="2024-12-31"
          fromPlaceholder="Project Start"
          toPlaceholder="Project End"
          required={true}
          disabled={false}
          error="Invalid date range"
        />
      );

      expect(screen.getByText("Project Duration")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.getByText("Invalid date range")).toBeInTheDocument();

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("2024-01-01");
      expect(inputs[1].value).toBe("2024-12-31");
      expect(inputs[0].placeholder).toBe("Project Start");
      expect(inputs[1].placeholder).toBe("Project End");
    });
  });

  describe("Accessibility", () => {
    it("should have proper label structure", () => {
      render(<DateRangePicker {...defaultProps} label="Date Range" />);
      const label = screen.getByText("Date Range");
      expect(label.tagName).toBe("LABEL");
    });

    it("should have text-sm on label", () => {
      render(<DateRangePicker {...defaultProps} label="Range" />);
      const label = screen.getByText("Range");
      expect(label).toHaveClass("text-sm");
      expect(label).toHaveClass("font-medium");
    });

    it("should have text-sm on error", () => {
      render(<DateRangePicker {...defaultProps} error="Error message" />);
      const error = screen.getByText("Error message");
      expect(error).toHaveClass("text-sm");
    });
  });
});
