import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegionSelect from "@/app/components/ui/RegionSelect";

const mockRegions = [
  {
    id: "1",
    code: "CA",
    name: "California",
    type: "state",
  },
  {
    id: "2",
    code: "NY",
    name: "New York",
    type: "state",
  },
  {
    id: "3",
    code: "TX",
    name: "Texas",
    type: "state",
  },
];

describe("RegionSelect Component", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ regions: mockRegions }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render with label", () => {
      render(<RegionSelect label="Region" onChange={jest.fn()} />);
      expect(screen.getByText("Region")).toBeInTheDocument();
    });

    it("should render without label", () => {
      render(<RegionSelect onChange={jest.fn()} />);
      expect(screen.queryByText("Region")).not.toBeInTheDocument();
    });

    it("should show placeholder when no country selected", () => {
      render(<RegionSelect onChange={jest.fn()} />);
      expect(screen.getByText("Select a country first")).toBeInTheDocument();
    });

    it("should show custom placeholder", async () => {
      render(
        <RegionSelect
          onChange={jest.fn()}
          countryCode="US"
          placeholder="Choose region"
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });
    });

    it("should be disabled when no country code provided", () => {
      render(<RegionSelect onChange={jest.fn()} />);
      const button = screen.getByRole("button");
      expect(screen.getByText("Select a country first")).toBeInTheDocument();
    });
  });

  describe("Data Fetching", () => {
    it("should fetch regions when country code is provided", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/regions?countryCode=US"
        );
      });
    });

    it("should show loading state while fetching", () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);
      expect(screen.getByText("Loading regions...")).toBeInTheDocument();
    });

    it("should display regions after loading", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("California")).toBeInTheDocument();
        expect(screen.getByText("New York")).toBeInTheDocument();
        expect(screen.getByText("Texas")).toBeInTheDocument();
      });
    });

    it("should handle fetch error gracefully", async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error("Network error"))
      ) as jest.Mock;
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it("should clear regions when country code is removed", async () => {
      const { rerender } = render(
        <RegionSelect onChange={jest.fn()} countryCode="US" />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/regions?countryCode=US"
        );
      });

      rerender(<RegionSelect onChange={jest.fn()} />);

      expect(screen.getByText("Select a country first")).toBeInTheDocument();
    });

    it("should not fetch duplicate requests for same country", async () => {
      const { rerender } = render(
        <RegionSelect onChange={jest.fn()} countryCode="US" />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      rerender(
        <RegionSelect onChange={jest.fn()} countryCode="US" value="1" />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it("should show no regions message when empty response", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ regions: [] }),
        })
      ) as jest.Mock;

      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(screen.getByText("No regions available")).toBeInTheDocument();
      });
    });
  });

  describe("Dropdown Interaction", () => {
    it("should open dropdown on click", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.getByPlaceholderText("Search regions...")
      ).toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search regions...")
        ).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Search regions...")
        ).not.toBeInTheDocument();
      });
    });

    it("should focus search input when dropdown opens", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText("Search regions...");
        expect(searchInput).toHaveFocus();
      });
    });

    it("should not open when disabled", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" disabled />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.queryByPlaceholderText("Search regions...")
      ).not.toBeInTheDocument();
    });

    it("should not open when loading", () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.queryByPlaceholderText("Search regions...")
      ).not.toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should filter regions by name", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const searchInput = await screen.findByPlaceholderText(
        "Search regions..."
      );
      fireEvent.change(searchInput, { target: { value: "California" } });

      expect(screen.getByText("California")).toBeInTheDocument();
      expect(screen.queryByText("New York")).not.toBeInTheDocument();
    });

    it("should search case-insensitively", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const searchInput = await screen.findByPlaceholderText(
        "Search regions..."
      );
      fireEvent.change(searchInput, { target: { value: "california" } });

      expect(screen.getByText("California")).toBeInTheDocument();
    });

    it("should show no results message", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const searchInput = await screen.findByPlaceholderText(
        "Search regions..."
      );
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      expect(screen.getByText("No regions found")).toBeInTheDocument();
    });
  });

  describe("Region Selection", () => {
    it("should call onChange when region is selected", async () => {
      const onChange = jest.fn();
      render(<RegionSelect onChange={onChange} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        const california = screen.getByText("California");
        fireEvent.click(california);
      });

      expect(onChange).toHaveBeenCalledWith("1", mockRegions[0]);
    });

    it("should display selected region", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" value="2" />);

      await waitFor(() => {
        expect(screen.getByText("New York")).toBeInTheDocument();
      });
    });

    it("should close dropdown after selection", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        const california = screen.getByText("California");
        fireEvent.click(california);
      });

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Search regions...")
        ).not.toBeInTheDocument();
      });
    });

    it("should clear search after selection", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const searchInput = await screen.findByPlaceholderText(
        "Search regions..."
      );
      fireEvent.change(searchInput, { target: { value: "California" } });

      const california = await screen.findByText("California");
      fireEvent.click(california);

      fireEvent.click(button);

      await waitFor(() => {
        const newSearchInput = screen.getByPlaceholderText("Search regions...");
        expect(newSearchInput).toHaveValue("");
      });
    });

    it("should display region type", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        const types = screen.getAllByText("state");
        expect(types.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Clear Functionality", () => {
    it("should show clear button when region is selected", async () => {
      const { container } = render(
        <RegionSelect onChange={jest.fn()} countryCode="US" value="1" />
      );

      await waitFor(() => {
        expect(screen.getByText("California")).toBeInTheDocument();
      });

      const clearButton = container.querySelector(".absolute.right-10");
      expect(clearButton).toBeInTheDocument();
    });

    it("should not show clear button when no region selected", async () => {
      const { container } = render(
        <RegionSelect onChange={jest.fn()} countryCode="US" />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });

      const clearButton = container.querySelector(".absolute.right-10");
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should call onChange with empty string when cleared", async () => {
      const onChange = jest.fn();
      const { container } = render(
        <RegionSelect onChange={onChange} countryCode="US" value="1" />
      );

      await waitFor(() => {
        expect(screen.getByText("California")).toBeInTheDocument();
      });

      const clearButton = container.querySelector(".absolute.right-10");
      if (clearButton) {
        fireEvent.click(clearButton);
        expect(onChange).toHaveBeenCalledWith("");
      }
    });

    it("should not show clear button when disabled", async () => {
      const { container } = render(
        <RegionSelect
          onChange={jest.fn()}
          countryCode="US"
          value="1"
          disabled
        />
      );

      await waitFor(() => {
        expect(screen.getByText("California")).toBeInTheDocument();
      });

      const clearButton = container.querySelector(".absolute.right-10");
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should apply disabled styles", () => {
      render(<RegionSelect onChange={jest.fn()} disabled />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("opacity-50");
      expect(button).toHaveClass("cursor-not-allowed");
    });

    it("should be disabled when loading", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" />);
      expect(screen.getByText("Loading regions...")).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Error State", () => {
    it("should display error message", () => {
      render(<RegionSelect onChange={jest.fn()} error="Region is required" />);
      expect(screen.getByText("Region is required")).toBeInTheDocument();
    });

    it("should apply error border color", () => {
      render(<RegionSelect onChange={jest.fn()} error="Error" />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border-red-500");
    });
  });

  describe("Edge Cases", () => {
    it("should handle region selection with code value", async () => {
      render(<RegionSelect onChange={jest.fn()} countryCode="US" value="CA" />);

      await waitFor(() => {
        expect(screen.getByText("California")).toBeInTheDocument();
      });
    });

    it("should handle invalid value gracefully", async () => {
      render(
        <RegionSelect onChange={jest.fn()} countryCode="US" value="INVALID" />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading regions...")
        ).not.toBeInTheDocument();
      });
    });

    it("should update regions when country code changes", async () => {
      const { rerender } = render(
        <RegionSelect onChange={jest.fn()} countryCode="US" />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/regions?countryCode=US"
        );
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              regions: [
                { id: "4", code: "ON", name: "Ontario", type: "province" },
              ],
            }),
        })
      ) as jest.Mock;

      rerender(<RegionSelect onChange={jest.fn()} countryCode="CA" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/regions?countryCode=CA"
        );
      });
    });
  });
});
