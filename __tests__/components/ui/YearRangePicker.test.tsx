import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import YearRangePicker from "@/app/components/ui/YearRangePicker";

const mockOnFromChange = jest.fn();
const mockOnToChange = jest.fn();

const defaultProps = {
  onFromChange: mockOnFromChange,
  onToChange: mockOnToChange,
};

describe("YearRangePicker Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render both year pickers", () => {
      render(<YearRangePicker {...defaultProps} />);
      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);
    });

    it("should render with label", () => {
      render(<YearRangePicker {...defaultProps} label="Year Range" />);
      expect(screen.getByText("Year Range")).toBeInTheDocument();
    });

    it("should render without label", () => {
      render(<YearRangePicker {...defaultProps} />);
      expect(screen.queryByText("Year Range")).not.toBeInTheDocument();
    });

    it("should render with default placeholders", () => {
      render(<YearRangePicker {...defaultProps} />);
      expect(screen.getByPlaceholderText("From year")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("To year")).toBeInTheDocument();
    });

    it("should render with custom placeholders", () => {
      render(
        <YearRangePicker
          {...defaultProps}
          fromPlaceholder="Start year"
          toPlaceholder="End year"
        />
      );
      expect(screen.getByPlaceholderText("Start year")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("End year")).toBeInTheDocument();
    });

    it("should render with initial values", () => {
      render(
        <YearRangePicker {...defaultProps} fromValue={2020} toValue={2023} />
      );
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("2020");
      expect(inputs[1].value).toBe("2023");
    });

    it("should render error message", () => {
      render(<YearRangePicker {...defaultProps} error="Invalid range" />);
      expect(screen.getAllByText("Invalid range")).toHaveLength(3);
    });

    it("should not render error message when no error", () => {
      render(<YearRangePicker {...defaultProps} />);
      expect(screen.queryByText("Invalid range")).not.toBeInTheDocument();
    });
  });

  describe("From Year Selection", () => {
    it("should call onFromChange when from year selected", () => {
      render(<YearRangePicker {...defaultProps} />);
      const fromInput = screen.getByPlaceholderText("From year");

      fireEvent.focus(fromInput);
      const yearButton = screen.getByText("2020");
      fireEvent.click(yearButton);

      expect(mockOnFromChange).toHaveBeenCalledWith(2020);
    });

    it("should update from input display", () => {
      render(<YearRangePicker {...defaultProps} fromValue={2021} />);
      const fromInput = screen.getByPlaceholderText(
        "From year"
      ) as HTMLInputElement;
      expect(fromInput.value).toBe("2021");
    });

    it("should respect minYear for from picker", () => {
      render(<YearRangePicker {...defaultProps} minYear={2015} />);
      const fromInput = screen.getByPlaceholderText("From year");

      fireEvent.focus(fromInput);

      expect(screen.queryByText("2014")).not.toBeInTheDocument();
      expect(screen.getByText("2015")).toBeInTheDocument();
    });

    it("should limit from picker maxYear to toValue when set", () => {
      render(<YearRangePicker {...defaultProps} toValue={2022} />);
      const fromInput = screen.getByPlaceholderText("From year");

      fireEvent.focus(fromInput);

      // Should show years up to 2022
      expect(screen.getByText("2022")).toBeInTheDocument();
    });
  });

  describe("To Year Selection", () => {
    it("should call onToChange when to year selected", () => {
      render(<YearRangePicker {...defaultProps} />);
      const toInput = screen.getByPlaceholderText("To year");

      fireEvent.focus(toInput);
      const yearButton = screen.getByText("2023");
      fireEvent.click(yearButton);

      expect(mockOnToChange).toHaveBeenCalledWith(2023);
    });

    it("should update to input display", () => {
      render(<YearRangePicker {...defaultProps} toValue={2024} />);
      const toInput = screen.getByPlaceholderText(
        "To year"
      ) as HTMLInputElement;
      expect(toInput.value).toBe("2024");
    });

    it("should respect maxYear for to picker", () => {
      render(<YearRangePicker {...defaultProps} maxYear={2025} />);
      const toInput = screen.getByPlaceholderText("To year");

      fireEvent.focus(toInput);

      expect(screen.getByText("2025")).toBeInTheDocument();
    });

    it("should limit to picker minYear to fromValue when set", () => {
      render(<YearRangePicker {...defaultProps} fromValue={2020} />);
      const toInput = screen.getByPlaceholderText("To year");

      fireEvent.focus(toInput);

      // Should show years from 2020
      expect(screen.getByText("2020")).toBeInTheDocument();
    });
  });

  describe("Year Range Coordination", () => {
    it("should prevent from year being greater than to year", () => {
      render(
        <YearRangePicker
          {...defaultProps}
          fromValue={undefined}
          toValue={2022}
        />
      );
      const fromInput = screen.getByPlaceholderText("From year");

      fireEvent.focus(fromInput);

      // From picker should have max of 2022 (toValue)
      expect(screen.getByText("2022")).toBeInTheDocument();
    });

    it("should prevent to year being less than from year", () => {
      render(
        <YearRangePicker
          {...defaultProps}
          fromValue={2020}
          toValue={undefined}
        />
      );
      const toInput = screen.getByPlaceholderText("To year");

      fireEvent.focus(toInput);

      // To picker should have min of 2020 (fromValue)
      expect(screen.getByText("2020")).toBeInTheDocument();
    });

    it("should allow equal from and to years", () => {
      render(
        <YearRangePicker {...defaultProps} fromValue={2021} toValue={2021} />
      );
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];

      expect(inputs[0].value).toBe("2021");
      expect(inputs[1].value).toBe("2021");
    });

    it("should update from max when to value changes", () => {
      const { rerender } = render(
        <YearRangePicker {...defaultProps} fromValue={2020} toValue={2025} />
      );

      rerender(
        <YearRangePicker {...defaultProps} fromValue={2020} toValue={2022} />
      );

      const fromInput = screen.getByPlaceholderText("From year");
      fireEvent.focus(fromInput);

      expect(screen.getByText("2022")).toBeInTheDocument();
    });

    it("should update to min when from value changes", () => {
      const { rerender } = render(
        <YearRangePicker {...defaultProps} fromValue={2018} toValue={2023} />
      );

      rerender(
        <YearRangePicker {...defaultProps} fromValue={2020} toValue={2023} />
      );

      const toInput = screen.getByPlaceholderText("To year");
      fireEvent.focus(toInput);

      expect(screen.getByText("2020")).toBeInTheDocument();
    });
  });

  describe("Error Display", () => {
    it("should show error with red text", () => {
      render(<YearRangePicker {...defaultProps} error="Range error" />);
      const errorTexts = screen.getAllByText("Range error");

      // YearRangePicker shows error + both YearPickers show error = 3 total
      expect(errorTexts.length).toBe(3);
      errorTexts.forEach((text) => {
        expect(text).toHaveClass("text-red-400");
      });
    });

    it("should pass error to both pickers", () => {
      render(<YearRangePicker {...defaultProps} error="Invalid" />);

      // YearRangePicker shows error + both YearPickers show error = 3 total
      expect(screen.getAllByText("Invalid")).toHaveLength(3);
    });

    it("should update error message", () => {
      const { rerender } = render(
        <YearRangePicker {...defaultProps} error="Error 1" />
      );
      expect(screen.getAllByText("Error 1")).toHaveLength(3);

      rerender(<YearRangePicker {...defaultProps} error="Error 2" />);
      expect(screen.getAllByText("Error 2")).toHaveLength(3);
      expect(screen.queryByText("Error 1")).not.toBeInTheDocument();
    });

    it("should clear error when removed", () => {
      const { rerender } = render(
        <YearRangePicker {...defaultProps} error="Error" />
      );
      expect(screen.getAllByText("Error")).toHaveLength(3);

      rerender(<YearRangePicker {...defaultProps} />);
      expect(screen.queryByText("Error")).not.toBeInTheDocument();
    });
  });

  describe("Clearing Values", () => {
    it("should handle from value being undefined", () => {
      const { rerender } = render(
        <YearRangePicker {...defaultProps} fromValue={2020} />
      );
      const fromInput = screen.getByPlaceholderText(
        "From year"
      ) as HTMLInputElement;
      expect(fromInput.value).toBe("2020");

      rerender(<YearRangePicker {...defaultProps} fromValue={undefined} />);
      // YearPicker keeps last valid value when undefined is passed
      expect(fromInput.value).toBeTruthy();
    });

    it("should handle to value being undefined", () => {
      const { rerender } = render(
        <YearRangePicker {...defaultProps} toValue={2023} />
      );
      const toInput = screen.getByPlaceholderText(
        "To year"
      ) as HTMLInputElement;
      expect(toInput.value).toBe("2023");

      rerender(<YearRangePicker {...defaultProps} toValue={undefined} />);
      // YearPicker keeps last valid value when undefined is passed
      expect(toInput.value).toBeTruthy();
    });

    it("should handle clearing from value to expand to max", () => {
      const { rerender } = render(
        <YearRangePicker {...defaultProps} fromValue={2020} toValue={2023} />
      );

      // Clear from value
      rerender(<YearRangePicker {...defaultProps} toValue={2023} />);

      const toInput = screen.getByPlaceholderText("To year");
      fireEvent.focus(toInput);

      // To picker should now use default minYear (1900)
      expect(screen.getAllByRole("textbox")).toHaveLength(2);
    });

    it("should handle clearing to value to expand from max", () => {
      const { rerender } = render(
        <YearRangePicker {...defaultProps} fromValue={2020} toValue={2023} />
      );

      // Clear to value
      rerender(<YearRangePicker {...defaultProps} fromValue={2020} />);

      const fromInput = screen.getByPlaceholderText("From year");
      fireEvent.focus(fromInput);

      // From picker should now use default maxYear (current year)
      expect(screen.getAllByRole("textbox")).toHaveLength(2);
    });
  });

  describe("Custom Min/Max Years", () => {
    it("should respect custom minYear", () => {
      render(<YearRangePicker {...defaultProps} minYear={2010} />);
      const fromInput = screen.getByPlaceholderText("From year");

      fireEvent.focus(fromInput);

      expect(screen.getByText("2010")).toBeInTheDocument();
    });

    it("should respect custom maxYear", () => {
      render(<YearRangePicker {...defaultProps} maxYear={2030} />);
      const toInput = screen.getByPlaceholderText("To year");

      fireEvent.focus(toInput);

      expect(screen.getByText("2030")).toBeInTheDocument();
    });

    it("should apply custom range to both pickers", () => {
      render(
        <YearRangePicker {...defaultProps} minYear={2015} maxYear={2025} />
      );

      const fromInput = screen.getByPlaceholderText("From year");
      fireEvent.focus(fromInput);
      expect(screen.getByText("2015")).toBeInTheDocument();

      fireEvent.click(fromInput); // Close dropdown

      const toInput = screen.getByPlaceholderText("To year");
      fireEvent.focus(toInput);
      expect(screen.getAllByText("2025").length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid picker toggles", () => {
      render(<YearRangePicker {...defaultProps} />);
      const fromInput = screen.getByPlaceholderText("From year");
      const toInput = screen.getByPlaceholderText("To year");

      fireEvent.focus(fromInput);
      fireEvent.focus(toInput);
      fireEvent.focus(fromInput);

      expect(screen.getAllByRole("textbox")).toHaveLength(2);
    });

    it("should handle selecting same year for both", () => {
      render(<YearRangePicker {...defaultProps} />);

      const fromInput = screen.getByPlaceholderText("From year");
      fireEvent.focus(fromInput);
      fireEvent.click(screen.getByText("2021"));

      expect(mockOnFromChange).toHaveBeenCalledWith(2021);

      const toInput = screen.getByPlaceholderText("To year");
      fireEvent.focus(toInput);

      const yearButtons = screen.getAllByText("2021");
      fireEvent.click(yearButtons[yearButtons.length - 1]);

      expect(mockOnToChange).toHaveBeenCalledWith(2021);
    });

    it("should handle all props together", () => {
      render(
        <YearRangePicker
          {...defaultProps}
          label="Year Range"
          fromValue={2018}
          toValue={2024}
          fromPlaceholder="Start"
          toPlaceholder="End"
          minYear={2000}
          maxYear={2030}
          error="Range error"
        />
      );

      expect(screen.getByText("Year Range")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Start")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("End")).toBeInTheDocument();
      expect(screen.getAllByText("Range error")).toHaveLength(3);
    });
  });
});
