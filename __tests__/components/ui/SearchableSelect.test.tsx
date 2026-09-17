import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchableSelect from "@/app/components/ui/SearchableSelect";

const mockOnChange = jest.fn();

const mockOptions = [
  { id: "ALL", label: "All Options" },
  { id: "1", label: "Option One", subtitle: "First option" },
  { id: "2", label: "Option Two", subtitle: "Second option" },
  { id: "3", label: "Option Three", subtitle: "Third option" },
  { id: "4", label: "Apple", subtitle: "Fruit" },
  { id: "5", label: "Banana", subtitle: "Yellow fruit" },
];

const defaultProps = {
  value: "",
  onChange: mockOnChange,
  options: mockOptions,
};

describe("SearchableSelect Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render button", () => {
      render(<SearchableSelect {...defaultProps} />);
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<SearchableSelect {...defaultProps} label="Select Item" />);
      expect(screen.getByText("Select Item")).toBeInTheDocument();
    });

    it("should render required indicator", () => {
      render(<SearchableSelect {...defaultProps} label="Item" required />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render placeholder when no value", () => {
      render(<SearchableSelect {...defaultProps} />);
      expect(screen.getByText("Select an option")).toBeInTheDocument();
    });

    it("should render custom placeholder", () => {
      render(<SearchableSelect {...defaultProps} placeholder="Choose one" />);
      expect(screen.getByText("Choose one")).toBeInTheDocument();
    });

    it("should render selected option", () => {
      render(<SearchableSelect {...defaultProps} value="1" />);
      expect(screen.getByText("Option One")).toBeInTheDocument();
    });

    it("should render selected option subtitle", () => {
      render(<SearchableSelect {...defaultProps} value="1" />);
      expect(screen.getByText("First option")).toBeInTheDocument();
    });

    it("should render error message", () => {
      render(<SearchableSelect {...defaultProps} error="Required field" />);
      expect(screen.getByText("Required field")).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const { container } = render(<SearchableSelect {...defaultProps} />);
      expect(
        container.querySelector(".lucide-chevron-down")
      ).toBeInTheDocument();
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<SearchableSelect {...defaultProps} />);
      expect(
        screen.queryByPlaceholderText("Search...")
      ).not.toBeInTheDocument();
    });

    it("should open dropdown when button clicked", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));

      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("should close dropdown when button clicked again", () => {
      render(<SearchableSelect {...defaultProps} />);
      const button = screen.getByRole("combobox");

      fireEvent.click(button);
      fireEvent.click(button);

      expect(
        screen.queryByPlaceholderText("Search...")
      ).not.toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));
      fireEvent.mouseDown(document.body);

      expect(
        screen.queryByPlaceholderText("Search...")
      ).not.toBeInTheDocument();
    });

    it("should focus search input when dropdown opens", async () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search...")).toHaveFocus();
      });
    });

    it("should rotate chevron when open", () => {
      const { container } = render(<SearchableSelect {...defaultProps} />);
      const chevron = container.querySelector(".lucide-chevron-down");

      expect(chevron).not.toHaveClass("rotate-180");

      fireEvent.click(screen.getByRole("combobox"));

      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Option Selection", () => {
    it("should call onChange when option selected", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));
      fireEvent.click(screen.getByText("Option One"));

      expect(mockOnChange).toHaveBeenCalledWith("1");
    });

    it("should close dropdown after selection", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));
      fireEvent.click(screen.getByText("Option Two"));

      expect(
        screen.queryByPlaceholderText("Search...")
      ).not.toBeInTheDocument();
    });

    it("should display all options in dropdown", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));

      expect(screen.getByText("All Options")).toBeInTheDocument();
      expect(screen.getByText("Option One")).toBeInTheDocument();
      expect(screen.getByText("Option Two")).toBeInTheDocument();
      expect(screen.getByText("Option Three")).toBeInTheDocument();
    });

    it("should show checkmark for selected option", () => {
      render(<SearchableSelect {...defaultProps} value="2" />);

      fireEvent.click(screen.getByRole("combobox"));

      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("should highlight selected option", () => {
      render(<SearchableSelect {...defaultProps} value="3" />);

      fireEvent.click(screen.getByRole("combobox"));

      const options = screen.getAllByRole("option");
      const selectedOption = options.find((opt) =>
        opt.textContent?.includes("Option Three")
      );
      expect(selectedOption?.className).toContain("bg-primary-900/40");
    });
  });

  describe("Search Functionality", () => {
    it("should filter options by label", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));
      fireEvent.change(screen.getByPlaceholderText("Search..."), {
        target: { value: "One" },
      });

      expect(screen.getByText("Option One")).toBeInTheDocument();
      expect(screen.queryByText("Option Two")).not.toBeInTheDocument();
    });

    it("should filter options by subtitle", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));
      fireEvent.change(screen.getByPlaceholderText("Search..."), {
        target: { value: "Fruit" },
      });

      expect(screen.getByText("Apple")).toBeInTheDocument();
      expect(screen.getByText("Banana")).toBeInTheDocument();
      expect(screen.queryByText("Option One")).not.toBeInTheDocument();
    });

    it("should be case insensitive", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));
      fireEvent.change(screen.getByPlaceholderText("Search..."), {
        target: { value: "APPLE" },
      });

      expect(screen.getByText("Apple")).toBeInTheDocument();
    });

    it("should show no results message", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));
      fireEvent.change(screen.getByPlaceholderText("Search..."), {
        target: { value: "xyz" },
      });

      expect(screen.getByText('No matches for "xyz"')).toBeInTheDocument();
    });

    it("should clear search on selection", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));
      const searchInput = screen.getByPlaceholderText(
        "Search..."
      ) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: "Apple" } });
      fireEvent.click(screen.getByText("Apple"));

      fireEvent.click(screen.getByRole("combobox"));
      expect(
        (screen.getByPlaceholderText("Search...") as HTMLInputElement).value
      ).toBe("");
    });

    it("should show search icon", () => {
      render(<SearchableSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("combobox"));

      const searchInputContainer = screen
        .getByPlaceholderText("Search...")
        .closest("div");
      expect(
        searchInputContainer?.querySelector(".lucide-search")
      ).toBeTruthy();
    });
  });

  describe("Clear Functionality", () => {
    it("should show clear button when value selected", () => {
      const { container } = render(
        <SearchableSelect {...defaultProps} value="1" />
      );

      expect(container.querySelector(".lucide-x")).toBeInTheDocument();
    });

    it("should not show clear button when no value", () => {
      const { container } = render(<SearchableSelect {...defaultProps} />);

      expect(container.querySelector(".lucide-x")).not.toBeInTheDocument();
    });

    it("should clear to ALL option when available", () => {
      render(<SearchableSelect {...defaultProps} value="1" />);
      const { container } = render(
        <SearchableSelect {...defaultProps} value="1" />
      );
      const clearButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLElement;

      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith("ALL");
    });

    it("should clear to empty string when no ALL option", () => {
      const optionsWithoutAll = mockOptions.filter((opt) => opt.id !== "ALL");
      const { container } = render(
        <SearchableSelect
          {...defaultProps}
          options={optionsWithoutAll}
          value="1"
        />
      );
      const clearButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLElement;

      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("should not open dropdown when clicking clear", () => {
      const { container } = render(
        <SearchableSelect {...defaultProps} value="1" />
      );
      const clearButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLElement;

      fireEvent.click(clearButton);

      expect(
        screen.queryByPlaceholderText("Search...")
      ).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator", () => {
      render(<SearchableSelect {...defaultProps} loading />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should show spinner icon when loading", () => {
      render(<SearchableSelect {...defaultProps} loading />);
      const loadingText = screen.getByText("Loading...");
      const spinnerContainer = loadingText.closest("span");
      const spinner = spinnerContainer?.querySelector("svg.animate-spin");
      expect(spinner).toBeTruthy();
    });

    it("should not open dropdown when loading", () => {
      render(<SearchableSelect {...defaultProps} loading />);

      fireEvent.click(screen.getByRole("combobox"));

      expect(
        screen.queryByPlaceholderText("Search...")
      ).not.toBeInTheDocument();
    });

    it("should disable button when loading", () => {
      render(<SearchableSelect {...defaultProps} loading />);

      expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("should not show clear button when loading", () => {
      const { container } = render(
        <SearchableSelect {...defaultProps} value="1" loading />
      );

      expect(container.querySelector(".lucide-x")).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should disable button", () => {
      render(<SearchableSelect {...defaultProps} disabled />);

      expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("should not open dropdown when disabled", () => {
      render(<SearchableSelect {...defaultProps} disabled />);

      fireEvent.click(screen.getByRole("combobox"));

      expect(
        screen.queryByPlaceholderText("Search...")
      ).not.toBeInTheDocument();
    });

    it("should apply disabled styles", () => {
      render(<SearchableSelect {...defaultProps} disabled />);
      const button = screen.getByRole("combobox");

      expect(button).toHaveClass("opacity-50", "cursor-not-allowed");
    });

    it("should not show clear button when disabled", () => {
      const { container } = render(
        <SearchableSelect {...defaultProps} value="1" disabled />
      );

      expect(container.querySelector(".lucide-x")).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should apply error border", () => {
      render(<SearchableSelect {...defaultProps} error="Error" />);
      const button = screen.getByRole("combobox");
      expect(button).toHaveClass("border-red-500");
    });

    it("should show error message with correct styling", () => {
      render(<SearchableSelect {...defaultProps} error="Required" />);
      const error = screen.getByText("Required");

      expect(error).toHaveClass("text-red-400");
    });
  });

  describe("ALL Option Styling", () => {
    it("should apply gray text to ALL option", () => {
      render(<SearchableSelect {...defaultProps} value="ALL" />);
      const allText = screen.getByText("All Options");

      expect(allText).toHaveClass("text-gray-500");
    });

    it("should apply white text to regular options", () => {
      render(<SearchableSelect {...defaultProps} value="1" />);
      const optionText = screen.getByText("Option One");

      expect(optionText).toHaveClass("text-white");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty options array", () => {
      render(<SearchableSelect {...defaultProps} options={[]} />);

      fireEvent.click(screen.getByRole("combobox"));

      expect(screen.getByText("No options available")).toBeInTheDocument();
    });

    it("should handle option without subtitle", () => {
      const simpleOptions = [{ id: "1", label: "Simple Option" }];
      render(
        <SearchableSelect {...defaultProps} options={simpleOptions} value="1" />
      );

      expect(screen.getByText("Simple Option")).toBeInTheDocument();
    });

    it("should handle rapid dropdown toggles", () => {
      render(<SearchableSelect {...defaultProps} />);
      const button = screen.getByRole("combobox");

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("should handle all props together", () => {
      render(
        <SearchableSelect
          {...defaultProps}
          label="Items"
          value="1"
          placeholder="Choose"
          error="Error message"
          required
          disabled={false}
          loading={false}
        />
      );

      expect(screen.getByText("Items")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.getByText("Option One")).toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
    });
  });

  describe("Background Styling", () => {
    it("should change background when open", () => {
      render(<SearchableSelect {...defaultProps} />);
      const button = screen.getByRole("combobox");

      fireEvent.click(button);

      expect(button).toHaveStyle({ backgroundColor: "#252525" });
    });

    it("should have default background when closed", () => {
      render(<SearchableSelect {...defaultProps} />);
      const button = screen.getByRole("combobox");

      expect(button).toHaveStyle({ backgroundColor: "#1a1a1a" });
    });

    it("should apply focus ring when open", () => {
      render(<SearchableSelect {...defaultProps} />);
      const button = screen.getByRole("combobox");

      fireEvent.click(button);

      expect(button).toHaveClass(
        "ring-2",
        "ring-primary-500/50",
        "border-primary-500"
      );
    });
  });
});
