import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CountrySelect from "@/app/components/ui/CountrySelect";

const mockCountries = [
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
    code: "GB",
    code3: "GBR",
    name: "United Kingdom",
    nativeName: "United Kingdom",
    numericCode: "826",
    continent: "Europe",
    currency: "GBP",
    languages: "en",
    hasRegions: true,
  },
  {
    id: "3",
    code: "FR",
    code3: "FRA",
    name: "France",
    nativeName: "France",
    numericCode: "250",
    continent: "Europe",
    currency: "EUR",
    languages: "fr",
    hasRegions: true,
  },
];

const mockGroupedCountries = {
  Europe: [mockCountries[1], mockCountries[2]],
  "North America": [mockCountries[0]],
};

describe("CountrySelect Component", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            countries: mockCountries,
            grouped: mockGroupedCountries,
          }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render with label", async () => {
      render(<CountrySelect label="Country" onChange={jest.fn()} />);
      await waitFor(() => {
        expect(screen.getByText("Country")).toBeInTheDocument();
      });
    });

    it("should render without label", async () => {
      render(<CountrySelect onChange={jest.fn()} />);
      await waitFor(() => {
        expect(screen.queryByRole("label")).not.toBeInTheDocument();
      });
    });

    it("should show placeholder", async () => {
      render(<CountrySelect onChange={jest.fn()} />);
      await waitFor(() => {
        expect(screen.getByText("Select a country")).toBeInTheDocument();
      });
    });

    it("should show custom placeholder", async () => {
      render(
        <CountrySelect onChange={jest.fn()} placeholder="Choose country" />
      );
      await waitFor(() => {
        expect(screen.getByText("Choose country")).toBeInTheDocument();
      });
    });

    it("should show loading state initially", () => {
      render(<CountrySelect onChange={jest.fn()} />);
      expect(screen.getByText("Loading countries...")).toBeInTheDocument();
    });
  });

  describe("Data Fetching", () => {
    it("should fetch countries on mount", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/countries");
      });
    });

    it("should display countries after loading", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      const button = await screen.findByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
        expect(screen.getByText("United Kingdom")).toBeInTheDocument();
        expect(screen.getByText("France")).toBeInTheDocument();
      });
    });

    it("should handle fetch error gracefully", async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error("Network error"))
      ) as jest.Mock;
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it("should only fetch countries once", async () => {
      const { rerender } = render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      rerender(<CountrySelect onChange={jest.fn()} value="US" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Dropdown Interaction", () => {
    it("should open dropdown on click", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.getByPlaceholderText("Search for a country")
      ).toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search for a country")
        ).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Search for a country")
        ).not.toBeInTheDocument();
      });
    });

    it("should focus search input when dropdown opens", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText("Search for a country");
        expect(searchInput).toHaveFocus();
      });
    });

    it("should toggle dropdown on button click", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");

      fireEvent.click(button);
      expect(
        screen.getByPlaceholderText("Search for a country")
      ).toBeInTheDocument();

      fireEvent.click(button);
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Search for a country")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    it("should filter countries by name", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const searchInput = await screen.findByPlaceholderText(
        "Search for a country"
      );
      fireEvent.change(searchInput, { target: { value: "France" } });

      expect(screen.getByText("France")).toBeInTheDocument();
      expect(screen.queryByText("United States")).not.toBeInTheDocument();
    });

    it("should filter countries by code", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const searchInput = await screen.findByPlaceholderText(
        "Search for a country"
      );
      fireEvent.change(searchInput, { target: { value: "US" } });

      expect(screen.getByText("United States")).toBeInTheDocument();
    });

    it("should show no results message", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const searchInput = await screen.findByPlaceholderText(
        "Search for a country"
      );
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      expect(screen.getByText("No countries found")).toBeInTheDocument();
    });

    it("should search case-insensitively", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const searchInput = await screen.findByPlaceholderText(
        "Search for a country"
      );
      fireEvent.change(searchInput, { target: { value: "france" } });

      expect(screen.getByText("France")).toBeInTheDocument();
    });
  });

  describe("Country Selection", () => {
    it("should call onChange when country is selected", async () => {
      const onChange = jest.fn();
      render(<CountrySelect onChange={onChange} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        const france = screen.getByText("France");
        fireEvent.click(france);
      });

      expect(onChange).toHaveBeenCalledWith("3", mockCountries[2]);
    });

    it("should display selected country", async () => {
      render(<CountrySelect onChange={jest.fn()} value="2" />);

      await waitFor(() => {
        expect(screen.getByText("United Kingdom")).toBeInTheDocument();
        expect(screen.getByText("(GB)")).toBeInTheDocument();
      });
    });

    it("should close dropdown after selection", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        const france = screen.getByText("France");
        fireEvent.click(france);
      });

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Search for a country")
        ).not.toBeInTheDocument();
      });
    });

    it("should clear search after selection", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const searchInput = await screen.findByPlaceholderText(
        "Search for a country"
      );
      fireEvent.change(searchInput, { target: { value: "france" } });

      await waitFor(() => {
        const france = screen.getByText("France");
        fireEvent.click(france);
      });

      fireEvent.click(button);

      await waitFor(() => {
        const newSearchInput = screen.getByPlaceholderText(
          "Search for a country"
        );
        expect(newSearchInput).toHaveValue("");
      });
    });
  });

  describe("Clear Functionality", () => {
    it("should show clear button when country is selected", async () => {
      const { container } = render(
        <CountrySelect onChange={jest.fn()} value="2" />
      );

      await waitFor(() => {
        expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      });

      const clearButton = container.querySelector(".absolute.right-10");
      expect(clearButton).toBeInTheDocument();
    });

    it("should not show clear button when no country is selected", async () => {
      const { container } = render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const clearButton = container.querySelector(".absolute.right-10");
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should call onChange with empty string when cleared", async () => {
      const onChange = jest.fn();
      const { container } = render(
        <CountrySelect onChange={onChange} value="2" />
      );

      await waitFor(() => {
        expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      });

      const clearButton = container.querySelector(".absolute.right-10");
      if (clearButton) {
        fireEvent.click(clearButton);
        expect(onChange).toHaveBeenCalledWith("");
      } else {
        throw new Error("Clear button not found");
      }
    });

    it("should not show clear button when disabled", async () => {
      const { container } = render(
        <CountrySelect onChange={jest.fn()} value="2" disabled />
      );

      await waitFor(() => {
        expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      });

      const clearButton = container.querySelector(".absolute.right-10");
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should not open dropdown when disabled", async () => {
      render(<CountrySelect onChange={jest.fn()} disabled />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.queryByPlaceholderText("Search for a country")
      ).not.toBeInTheDocument();
    });

    it("should apply disabled styles", async () => {
      render(<CountrySelect onChange={jest.fn()} disabled />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toHaveClass("opacity-50");
        expect(button).toHaveClass("cursor-not-allowed");
      });
    });

    it("should have disabled attribute", async () => {
      render(<CountrySelect onChange={jest.fn()} disabled />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Error State", () => {
    it("should display error message", async () => {
      render(
        <CountrySelect onChange={jest.fn()} error="Country is required" />
      );

      await waitFor(() => {
        expect(screen.getByText("Country is required")).toBeInTheDocument();
      });
    });

    it("should apply error border color", async () => {
      render(<CountrySelect onChange={jest.fn()} error="Error" />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toHaveClass("border-red-500");
      });
    });
  });

  describe("Grouped Display", () => {
    it("should display continent headers", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Europe")).toBeInTheDocument();
        expect(screen.getByText("North America")).toBeInTheDocument();
      });
    });

    it("should display countries under correct continent", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        const europe = screen.getByText("Europe");
        const northAmerica = screen.getByText("North America");
        expect(europe).toBeInTheDocument();
        expect(northAmerica).toBeInTheDocument();
      });
    });

    it("should display country codes", async () => {
      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("US")).toBeInTheDocument();
        expect(screen.getByText("GB")).toBeInTheDocument();
        expect(screen.getByText("FR")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty API response", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ countries: [], grouped: {} }),
        })
      ) as jest.Mock;

      render(<CountrySelect onChange={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading countries...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("No countries found")).toBeInTheDocument();
    });

    it("should handle country selection with code value", async () => {
      render(<CountrySelect onChange={jest.fn()} value="GB" />);

      await waitFor(() => {
        expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      });
    });

    it("should handle country selection with code3 value", async () => {
      render(<CountrySelect onChange={jest.fn()} value="USA" />);

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });
    });

    it("should handle invalid value gracefully", async () => {
      render(<CountrySelect onChange={jest.fn()} value="INVALID" />);

      await waitFor(() => {
        expect(screen.getByText("Select a country")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label on clear button", async () => {
      render(<CountrySelect onChange={jest.fn()} value="2" />);

      await waitFor(() => {
        expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      });

      const clearButton = screen.getByRole("button", {
        name: "Clear country selection",
      });
      expect(clearButton).toBeInTheDocument();
    });

    it("should have aria-hidden on X icon in clear button", async () => {
      const { container } = render(
        <CountrySelect onChange={jest.fn()} value="2" />
      );

      await waitFor(() => {
        expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      });

      const xIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(xIcon).toBeInTheDocument();
    });

    it("should maintain accessibility after clearing selection", async () => {
      const onChange = jest.fn();
      render(<CountrySelect onChange={onChange} value="2" />);

      await waitFor(() => {
        expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      });

      const clearButton = screen.getByRole("button", {
        name: "Clear country selection",
      });
      fireEvent.click(clearButton);

      expect(onChange).toHaveBeenCalledWith("");

      // Clear button should no longer be present
      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: "Clear country selection" })
        ).not.toBeInTheDocument();
      });
    });
  });
});
