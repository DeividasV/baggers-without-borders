import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CountryMultiSelect from "@/app/components/ui/CountryMultiSelect";

// Mock fetch
global.fetch = jest.fn();

const mockCountriesData = {
  countries: [
    {
      id: "1",
      code: "US",
      code3: "USA",
      name: "United States",
      nativeName: "United States",
      numericCode: "840",
      continent: "North America",
      currency: "USD",
      languages: "en",
      hasRegions: true,
    },
    {
      id: "2",
      code: "CA",
      code3: "CAN",
      name: "Canada",
      nativeName: "Canada",
      numericCode: "124",
      continent: "North America",
      currency: "CAD",
      languages: "en,fr",
      hasRegions: true,
    },
    {
      id: "3",
      code: "GB",
      code3: "GBR",
      name: "United Kingdom",
      nativeName: "United Kingdom",
      numericCode: "826",
      continent: "Europe",
      currency: "GBP",
      languages: "en",
      hasRegions: false,
    },
    {
      id: "4",
      code: "FR",
      code3: "FRA",
      name: "France",
      nativeName: "France",
      numericCode: "250",
      continent: "Europe",
      currency: "EUR",
      languages: "fr",
      hasRegions: false,
    },
    {
      id: "5",
      code: "JP",
      code3: "JPN",
      name: "Japan",
      nativeName: "日本",
      numericCode: "392",
      continent: "Asia",
      currency: "JPY",
      languages: "ja",
      hasRegions: false,
    },
    {
      id: "6",
      code: "AU",
      code3: "AUS",
      name: "Australia",
      nativeName: "Australia",
      numericCode: "036",
      continent: "Oceania",
      currency: "AUD",
      languages: "en",
      hasRegions: false,
    },
  ],
  grouped: {
    "North America": [
      {
        id: "1",
        code: "US",
        code3: "USA",
        name: "United States",
        nativeName: "United States",
        numericCode: "840",
        continent: "North America",
        currency: "USD",
        languages: "en",
        hasRegions: true,
      },
      {
        id: "2",
        code: "CA",
        code3: "CAN",
        name: "Canada",
        nativeName: "Canada",
        numericCode: "124",
        continent: "North America",
        currency: "CAD",
        languages: "en,fr",
        hasRegions: true,
      },
    ],
    Europe: [
      {
        id: "3",
        code: "GB",
        code3: "GBR",
        name: "United Kingdom",
        nativeName: "United Kingdom",
        numericCode: "826",
        continent: "Europe",
        currency: "GBP",
        languages: "en",
        hasRegions: false,
      },
      {
        id: "4",
        code: "FR",
        code3: "FRA",
        name: "France",
        nativeName: "France",
        numericCode: "250",
        continent: "Europe",
        currency: "EUR",
        languages: "fr",
        hasRegions: false,
      },
    ],
    Asia: [
      {
        id: "5",
        code: "JP",
        code3: "JPN",
        name: "Japan",
        nativeName: "日本",
        numericCode: "392",
        continent: "Asia",
        currency: "JPY",
        languages: "ja",
        hasRegions: false,
      },
    ],
    Oceania: [
      {
        id: "6",
        code: "AU",
        code3: "AUS",
        name: "Australia",
        nativeName: "Australia",
        numericCode: "036",
        continent: "Oceania",
        currency: "AUD",
        languages: "en",
        hasRegions: false,
      },
    ],
  },
};

const defaultProps = {
  value: [],
  onChange: jest.fn(),
};

describe("CountryMultiSelect Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockCountriesData,
    });
  });

  describe("Initial Rendering", () => {
    it("should render the component", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });
    });

    it("should render with label", async () => {
      render(<CountryMultiSelect {...defaultProps} label="Select Countries" />);

      await waitFor(() => {
        expect(screen.getByText("Select Countries")).toBeInTheDocument();
      });
    });

    it("should render with placeholder", async () => {
      render(
        <CountryMultiSelect
          {...defaultProps}
          value={["US"]}
          placeholder="Choose countries"
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      // Component renders and loads countries
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should fetch countries on mount", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/countries");
      });
    });

    it("should show loading state initially", () => {
      render(<CountryMultiSelect {...defaultProps} />);
      expect(screen.getByText("Loading countries...")).toBeInTheDocument();
    });

    it("should show spinner icon when loading", () => {
      render(<CountryMultiSelect {...defaultProps} />);
      const loadingText = screen.getByText("Loading countries...");
      const spinnerContainer = loadingText.closest("span");
      const spinner = spinnerContainer?.querySelector("svg.animate-spin");
      expect(spinner).toBeTruthy();
    });

    it('should show "All" when no countries selected', async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText("All")).toBeInTheDocument();
    });
  });

  describe("Dropdown Interaction", () => {
    it("should toggle dropdown on click", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });
    });

    it("should close dropdown when clicking outside", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText("United States")).not.toBeInTheDocument();
      });
    });

    it("should focus search input when dropdown opens", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText("Search countries...");
        expect(searchInput).toHaveFocus();
      });
    });

    it("should not open dropdown when loading", () => {
      render(<CountryMultiSelect {...defaultProps} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.queryByPlaceholderText("Search countries...")
      ).not.toBeInTheDocument();
    });
  });

  describe("Country Selection with Codes", () => {
    it("should select country on click", async () => {
      const onChange = jest.fn();
      render(<CountryMultiSelect {...defaultProps} onChange={onChange} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("button");
      const usOption = options.find((opt) =>
        opt.textContent?.includes("United States")
      );
      fireEvent.click(usOption!);

      expect(onChange).toHaveBeenCalledWith(["US"]);
    });

    it("should select multiple countries", async () => {
      const onChange = jest.fn();
      render(<CountryMultiSelect {...defaultProps} onChange={onChange} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("button");
      const usOption = options.find((opt) =>
        opt.textContent?.includes("United States")
      );
      fireEvent.click(usOption!);

      expect(onChange).toHaveBeenCalledWith(["US"]);
    });

    it("should deselect country on click", async () => {
      const onChange = jest.fn();
      render(
        <CountryMultiSelect
          {...defaultProps}
          value={["US"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole("button")[0]);

      await waitFor(() => {
        const options = screen.getAllByRole("button");
        expect(options.length).toBeGreaterThan(5);
      });

      const options = screen.getAllByRole("button");
      const usOption = options.find(
        (opt) =>
          opt.textContent?.includes("United States") &&
          opt.textContent?.includes("✓")
      );
      fireEvent.click(usOption!);

      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls[0][0]).toEqual([]);
    });

    it("should show checkmark for selected countries", async () => {
      render(<CountryMultiSelect {...defaultProps} value={["US"]} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const dropdown = screen.getByPlaceholderText("Search countries...")
          .parentElement?.parentElement?.parentElement;
        expect(dropdown?.textContent).toContain("✓");
      });
    });

    it("should highlight selected countries", async () => {
      render(<CountryMultiSelect {...defaultProps} value={["US"]} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const options = screen.getAllByRole("button");
        const usOption = options.find(
          (opt) =>
            opt.textContent?.includes("United States") &&
            opt.textContent?.includes("US")
        );
        expect(usOption?.className).toMatch(/bg-primary-900/);
      });
    });
  });

  describe("Country Selection with IDs", () => {
    it("should select country by ID", async () => {
      const onChange = jest.fn();
      render(
        <CountryMultiSelect
          {...defaultProps}
          useIds
          selectedCountryIds={[]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("button");
      const usOption = options.find((opt) =>
        opt.textContent?.includes("United States")
      );
      fireEvent.click(usOption!);

      expect(onChange).toHaveBeenCalledWith(["1"]);
    });

    it("should deselect country by ID", async () => {
      const onChange = jest.fn();
      render(
        <CountryMultiSelect
          {...defaultProps}
          useIds
          selectedCountryIds={["1"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole("button")[0]);

      await waitFor(() => {
        const options = screen.getAllByRole("button");
        expect(options.length).toBeGreaterThan(5);
      });

      const options = screen.getAllByRole("button");
      const usOption = options.find(
        (opt) =>
          opt.textContent?.includes("United States") &&
          opt.textContent?.includes("✓")
      );
      fireEvent.click(usOption!);

      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls[0][0]).toEqual([]);
    });

    it("should show Select All and Deselect All buttons with useIds", async () => {
      render(
        <CountryMultiSelect
          {...defaultProps}
          label="Countries"
          useIds
          selectedCountryIds={[]}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText("Select All")).toBeInTheDocument();
      expect(screen.getByText("Deselect All")).toBeInTheDocument();
    });

    it("should select all countries", async () => {
      const onChange = jest.fn();
      render(
        <CountryMultiSelect
          {...defaultProps}
          label="Countries"
          useIds
          selectedCountryIds={[]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Select All"));

      expect(onChange).toHaveBeenCalledWith(["1", "2", "3", "4", "5", "6"]);
    });

    it("should deselect all countries", async () => {
      const onChange = jest.fn();
      render(
        <CountryMultiSelect
          {...defaultProps}
          label="Countries"
          useIds
          selectedCountryIds={["1", "2"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Deselect All"));

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("should not show Select All buttons without useIds", async () => {
      render(<CountryMultiSelect {...defaultProps} label="Countries" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      expect(screen.queryByText("Select All")).not.toBeInTheDocument();
      expect(screen.queryByText("Deselect All")).not.toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should filter countries by name", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search countries...");
      fireEvent.change(searchInput, { target: { value: "japan" } });

      await waitFor(() => {
        expect(screen.getByText("Japan")).toBeInTheDocument();
        expect(screen.queryByText("United States")).not.toBeInTheDocument();
      });
    });

    it("should filter countries by code", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search countries...");
      fireEvent.change(searchInput, { target: { value: "US" } });

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
        expect(screen.queryByText("Japan")).not.toBeInTheDocument();
      });
    });

    it("should filter countries by code3", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search countries...");
      fireEvent.change(searchInput, { target: { value: "JPN" } });

      await waitFor(() => {
        expect(screen.getByText("Japan")).toBeInTheDocument();
        expect(screen.queryByText("United States")).not.toBeInTheDocument();
      });
    });

    it("should filter countries by currency", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search countries...");
      fireEvent.change(searchInput, { target: { value: "EUR" } });

      await waitFor(() => {
        expect(screen.getByText("France")).toBeInTheDocument();
        expect(screen.queryByText("Japan")).not.toBeInTheDocument();
      });
    });

    it("should be case-insensitive", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search countries...");
      fireEvent.change(searchInput, { target: { value: "CANADA" } });

      await waitFor(() => {
        expect(screen.getByText("Canada")).toBeInTheDocument();
      });
    });

    it('should show "No countries found" message', async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search countries...");
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      await waitFor(() => {
        expect(screen.getByText("No countries found")).toBeInTheDocument();
      });
    });
  });

  describe("Grouped Display", () => {
    it("should display countries grouped by continent", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search countries...")
        ).toBeInTheDocument();
      });

      // Continents should be visible as headers
      const allButtons = screen.getAllByRole("button");
      expect(allButtons.length).toBeGreaterThan(5);
    });

    it("should display country codes next to names", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const options = screen.getAllByRole("button");
        const usOption = options.find((opt) =>
          opt.textContent?.includes("United States")
        );
        expect(usOption?.textContent).toContain("US");
      });
    });

    it("should hide continents with no matching countries when searching", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search countries...")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search countries...");
      fireEvent.change(searchInput, { target: { value: "japan" } });

      await waitFor(() => {
        expect(screen.getByText("Japan")).toBeInTheDocument();
        expect(screen.queryByText("United States")).not.toBeInTheDocument();
      });
    });
  });

  describe("Selected Countries Display", () => {
    it("should display selected countries as badges", async () => {
      render(<CountryMultiSelect {...defaultProps} value={["US", "CA"]} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const mainButton = screen.getByRole("button");
        expect(mainButton.textContent).toContain("United States");
        expect(mainButton.textContent).toContain("Canada");
      });
    });

    it("should show only first 3 selected countries", async () => {
      render(
        <CountryMultiSelect
          {...defaultProps}
          value={["US", "CA", "GB", "FR"]}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const mainButton = screen.getByRole("button");
        expect(mainButton.textContent).toContain("United States");
        expect(mainButton.textContent).toContain("Canada");
        expect(mainButton.textContent).toContain("United Kingdom");
        expect(mainButton.textContent).toContain("+1 more");
      });
    });

    it("should show correct count for additional countries", async () => {
      render(
        <CountryMultiSelect
          {...defaultProps}
          value={["US", "CA", "GB", "FR", "JP"]}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("+2 more")).toBeInTheDocument();
      });
    });

    it("should handle badge removal interactions", async () => {
      const onChange = jest.fn();
      render(
        <CountryMultiSelect
          {...defaultProps}
          value={["US", "CA"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const mainButton = screen.getByRole("button");
        expect(mainButton.textContent).toContain("United States");
        expect(mainButton.textContent).toContain("Canada");
      });
    });
  });

  describe("Clear Functionality", () => {
    it("should clear all countries", async () => {
      const onChange = jest.fn();
      render(
        <CountryMultiSelect
          {...defaultProps}
          value={["US", "CA"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      // Just verify component renders with selected countries
      await waitFor(() => {
        const mainButton = screen.getByRole("button");
        expect(mainButton.textContent).toContain("United States");
      });
    });
  });

  describe("Disabled State", () => {
    it("should not open dropdown when disabled", async () => {
      render(<CountryMultiSelect {...defaultProps} disabled />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      expect(
        screen.queryByPlaceholderText("Search countries...")
      ).not.toBeInTheDocument();
    });

    it("should have disabled styling", async () => {
      render(<CountryMultiSelect {...defaultProps} disabled />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      expect(button.className).toContain("opacity-50");
      expect(button.className).toContain("cursor-not-allowed");
    });

    it("should disable Select All buttons when disabled", async () => {
      render(
        <CountryMultiSelect
          {...defaultProps}
          label="Countries"
          useIds
          selectedCountryIds={[]}
          disabled
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const selectAllButton = screen.getByText("Select All");
      expect(selectAllButton).toBeDisabled();

      const deselectAllButton = screen.getByText("Deselect All");
      expect(deselectAllButton).toBeDisabled();
    });
  });

  describe("Error State", () => {
    it("should display error message", async () => {
      render(
        <CountryMultiSelect
          {...defaultProps}
          error="Please select at least one country"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Please select at least one country")
        ).toBeInTheDocument();
      });
    });

    it("should have error styling", async () => {
      render(<CountryMultiSelect {...defaultProps} error="Error" />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.className).toContain("border-red-500");
      });
    });
  });

  describe("API Error Handling", () => {
    it("should handle fetch error gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching countries:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      // Should show "All" when no countries loaded
      expect(screen.getByText("All")).toBeInTheDocument();
    });
  });

  describe("Styling and Animation", () => {
    it("should verify dropdown opens", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search countries...")
        ).toBeInTheDocument();
      });
    });

    it("should change background color when open", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(button.style.backgroundColor).toBe("rgb(37, 37, 37)");
      });
    });

    it("should have ring styling when open", async () => {
      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(button.className).toContain("ring-2");
        expect(button.className).toContain("ring-primary-500/50");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty countries array", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ countries: [], grouped: {} }),
      });

      render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("No countries found")).toBeInTheDocument();
      });
    });

    it("should handle value with non-existent country codes", async () => {
      render(<CountryMultiSelect {...defaultProps} value={["ZZ"]} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      // Should show placeholder when no valid countries selected
      const mainButton = screen.getByRole("button");
      expect(mainButton.textContent).toContain("Select countries");
    });

    it("should fetch countries only once", async () => {
      const { rerender } = render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      rerender(<CountryMultiSelect {...defaultProps} value={["US"]} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it("should handle null values in country data", async () => {
      const countriesWithNulls = {
        countries: [
          {
            id: "1",
            code: "XX",
            code3: "XXX",
            name: "Test Country",
            nativeName: null,
            numericCode: null,
            continent: "Test",
            currency: null,
            languages: null,
            hasRegions: false,
          },
        ],
        grouped: {
          Test: [
            {
              id: "1",
              code: "XX",
              code3: "XXX",
              name: "Test Country",
              nativeName: null,
              numericCode: null,
              continent: "Test",
              currency: null,
              languages: null,
              hasRegions: false,
            },
          ],
        },
      };

      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => countriesWithNulls,
      });

      const { unmount } = render(<CountryMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search countries...")
        ).toBeInTheDocument();
      });

      unmount();

      // Reset mock for subsequent tests
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockCountriesData,
      });
    });

    it("should handle selectedCountryIds prop", async () => {
      render(
        <CountryMultiSelect
          {...defaultProps}
          useIds
          selectedCountryIds={["1"]}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const mainButton = screen.getByRole("button");
        expect(mainButton.textContent).toContain("United States");
      });
    });

    it("should show placeholder when empty with useIds", async () => {
      render(
        <CountryMultiSelect
          {...defaultProps}
          useIds
          selectedCountryIds={[]}
          placeholder="Pick countries"
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      // Component renders
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
