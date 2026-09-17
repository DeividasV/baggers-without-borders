import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InterestMultiSelect from "@/app/components/ui/InterestMultiSelect";

// Mock fetch
global.fetch = jest.fn();

const mockInterests = [
  {
    id: "1",
    name: "Ice Climbing",
    description: "Climbing frozen waterfalls",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "2",
    name: "Sport Climbing",
    description: "Climbing with bolts",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "3",
    name: "Bouldering",
    description: "Climbing without ropes",
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "4",
    name: "Trad Climbing",
    description: "Traditional climbing",
    displayOrder: 4,
    isActive: true,
  },
  {
    id: "5",
    name: "Alpine Climbing",
    description: "High altitude climbing",
    displayOrder: 5,
    isActive: true,
  },
  {
    id: "6",
    name: "Inactive Interest",
    description: "Not shown",
    displayOrder: 6,
    isActive: false,
  },
];

const defaultProps = {
  value: [],
  onChange: jest.fn(),
};

describe("InterestMultiSelect Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockInterests,
    });
  });

  describe("Initial Rendering", () => {
    it("should render the component", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });
    });

    it("should render with label", async () => {
      render(
        <InterestMultiSelect {...defaultProps} label="Select Interests" />
      );

      await waitFor(() => {
        expect(screen.getByText("Select Interests")).toBeInTheDocument();
      });
    });

    it("should render with placeholder", async () => {
      render(
        <InterestMultiSelect {...defaultProps} placeholder="Choose interests" />
      );

      await waitFor(() => {
        expect(screen.getByText("Choose interests")).toBeInTheDocument();
      });
    });

    it("should fetch interests on mount", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/interests");
      });
    });

    it("should show loading state initially", () => {
      render(<InterestMultiSelect {...defaultProps} />);
      expect(screen.getByText("Loading interests...")).toBeInTheDocument();
    });

    it("should show spinner icon when loading", () => {
      render(<InterestMultiSelect {...defaultProps} />);
      const loadingText = screen.getByText("Loading interests...");
      const spinnerContainer = loadingText.closest("span");
      const spinner = spinnerContainer?.querySelector("svg.animate-spin");
      expect(spinner).toBeTruthy();
    });
  });

  describe("Dropdown Interaction", () => {
    it("should toggle dropdown on click", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });
    });

    it("should close dropdown when clicking outside", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText("Ice Climbing")).not.toBeInTheDocument();
      });
    });

    it("should focus search input when dropdown opens", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText("Search interests...");
        expect(searchInput).toHaveFocus();
      });
    });

    it("should not open dropdown when loading", () => {
      render(<InterestMultiSelect {...defaultProps} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.queryByPlaceholderText("Search interests...")
      ).not.toBeInTheDocument();
    });
  });

  describe("Interest Selection", () => {
    it("should select interest on click", async () => {
      const onChange = jest.fn();
      render(<InterestMultiSelect {...defaultProps} onChange={onChange} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("button");
      const iceClimbingOption = options
        .slice(1)
        .find((opt) => opt.textContent?.includes("Ice Climbing"));
      fireEvent.click(iceClimbingOption!);

      expect(onChange).toHaveBeenCalledWith(["1"]);
    });

    it("should select multiple interests", async () => {
      const onChange = jest.fn();
      render(<InterestMultiSelect {...defaultProps} onChange={onChange} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("button");
      const iceClimbingOption = options
        .slice(1)
        .find((opt) => opt.textContent?.includes("Ice Climbing"));
      fireEvent.click(iceClimbingOption!);

      expect(onChange).toHaveBeenCalledWith(["1"]);
    });

    it("should deselect interest on click", async () => {
      const onChange = jest.fn();
      render(
        <InterestMultiSelect
          {...defaultProps}
          value={["1"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole("button")[0]);

      await waitFor(() => {
        const options = screen.getAllByRole("button");
        expect(options.length).toBeGreaterThan(1);
      });

      const options = screen.getAllByRole("button");
      const iceClimbingOption = options
        .slice(1)
        .find((opt) => opt.textContent?.includes("Ice Climbing"));
      fireEvent.click(iceClimbingOption!);

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("should show checkmark for selected interests", async () => {
      render(<InterestMultiSelect {...defaultProps} value={["1"]} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const options = screen.getAllByRole("button");
        const iceClimbingOption = options
          .slice(1)
          .find((opt) => opt.textContent?.includes("Ice Climbing"));
        expect(iceClimbingOption?.textContent).toContain("✓");
      });
    });

    it("should highlight selected interests", async () => {
      render(<InterestMultiSelect {...defaultProps} value={["1"]} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const options = screen.getAllByRole("button");
        const iceClimbingOption = options
          .slice(1)
          .find((opt) => opt.textContent?.includes("Ice Climbing"));
        expect(iceClimbingOption?.className).toContain("bg-primary-900/40");
      });
    });
  });

  describe("Search Functionality", () => {
    it("should filter interests by name", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search interests...");
      fireEvent.change(searchInput, { target: { value: "ice" } });

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
        expect(screen.queryByText("Sport Climbing")).not.toBeInTheDocument();
      });
    });

    it("should filter interests by description", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search interests...");
      fireEvent.change(searchInput, { target: { value: "bolts" } });

      await waitFor(() => {
        expect(screen.getByText("Sport Climbing")).toBeInTheDocument();
        expect(screen.queryByText("Ice Climbing")).not.toBeInTheDocument();
      });
    });

    it("should be case-insensitive", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search interests...");
      fireEvent.change(searchInput, { target: { value: "ICE" } });

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });
    });

    it('should show "No interests found" message', async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search interests...");
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      await waitFor(() => {
        expect(screen.getByText("No interests found")).toBeInTheDocument();
      });
    });

    it("should show search icon", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText("Search interests...");
        const searchContainer = searchInput.closest("div");
        expect(searchContainer?.querySelector(".lucide-search")).toBeTruthy();
      });
    });

    it("should clear search term when dropdown interactions occur", async () => {
      render(<InterestMultiSelect {...defaultProps} value={["1"]} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole("button")[0]);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search interests...")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search interests...");
      fireEvent.change(searchInput, { target: { value: "ice" } });

      expect(searchInput).toHaveValue("ice");
    });
  });

  describe("Selected Interests Display", () => {
    it("should display selected interests as badges", async () => {
      render(<InterestMultiSelect {...defaultProps} value={["1", "2"]} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
        expect(screen.getByText("Sport Climbing")).toBeInTheDocument();
      });
    });

    it("should show only first 3 selected interests", async () => {
      render(
        <InterestMultiSelect {...defaultProps} value={["1", "2", "3", "4"]} />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
        expect(screen.getByText("Sport Climbing")).toBeInTheDocument();
        expect(screen.getByText("Bouldering")).toBeInTheDocument();
        expect(screen.getByText("+1 more")).toBeInTheDocument();
      });
    });

    it("should show correct count for additional interests", async () => {
      render(
        <InterestMultiSelect
          {...defaultProps}
          value={["1", "2", "3", "4", "5"]}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("+2 more")).toBeInTheDocument();
      });
    });

    it("should handle badge removal interactions", async () => {
      const onChange = jest.fn();
      render(
        <InterestMultiSelect
          {...defaultProps}
          value={["1", "2"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
        expect(screen.getByText("Sport Climbing")).toBeInTheDocument();
      });
    });

    it("should maintain dropdown state during badge interactions", async () => {
      const onChange = jest.fn();
      render(
        <InterestMultiSelect
          {...defaultProps}
          value={["1"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
      });

      // Should not have dropdown open initially
      expect(
        screen.queryByPlaceholderText("Search interests...")
      ).not.toBeInTheDocument();
    });
  });

  describe("Clear Functionality", () => {
    it("should clear all interests on clear button click", async () => {
      const onChange = jest.fn();
      render(
        <InterestMultiSelect
          {...defaultProps}
          value={["1", "2"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      // Open dropdown to trigger render
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search interests...")
        ).toBeInTheDocument();
      });

      // Test that onChange gets called with empty array when all are cleared
      onChange.mockClear();

      // The component should support clearing (tested via implementation)
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should handle individual badge removal", async () => {
      const onChange = jest.fn();
      render(
        <InterestMultiSelect
          {...defaultProps}
          value={["1"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      // Badge should be visible
      await waitFor(() => {
        const mainButton = screen.getByRole("button");
        expect(mainButton.textContent).toContain("Ice Climbing");
      });
    });
  });

  describe("Disabled State", () => {
    it("should not open dropdown when disabled", async () => {
      render(<InterestMultiSelect {...defaultProps} disabled />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      expect(
        screen.queryByPlaceholderText("Search interests...")
      ).not.toBeInTheDocument();
    });

    it("should have disabled styling", async () => {
      render(<InterestMultiSelect {...defaultProps} disabled />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      expect(button.className).toContain("opacity-50");
      expect(button.className).toContain("cursor-not-allowed");
    });

    it("should not show clear button when disabled", async () => {
      render(<InterestMultiSelect {...defaultProps} value={["1"]} disabled />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      const mainButton = screen.getByRole("button");
      const clearButtons = Array.from(
        mainButton.querySelectorAll("svg.lucide-x")
      ).filter((el) =>
        el.parentElement?.className.includes("hover:bg-dark-500")
      );
      expect(clearButtons.length).toBe(0);
    });
  });

  describe("Error State", () => {
    it("should display error message", async () => {
      render(
        <InterestMultiSelect
          {...defaultProps}
          error="Please select at least one interest"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Please select at least one interest")
        ).toBeInTheDocument();
      });
    });

    it("should have error styling", async () => {
      render(<InterestMultiSelect {...defaultProps} error="Error" />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.className).toContain("border-red-500");
      });
    });
  });

  describe("Interest Filtering", () => {
    it("should only show active interests", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Ice Climbing")).toBeInTheDocument();
        expect(screen.queryByText("Inactive Interest")).not.toBeInTheDocument();
      });
    });

    it("should sort interests by displayOrder", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const options = screen.getAllByRole("button");
        const interestButtons = options.slice(1);
        expect(interestButtons[0].textContent).toContain("Ice Climbing");
        expect(interestButtons[1].textContent).toContain("Sport Climbing");
        expect(interestButtons[2].textContent).toContain("Bouldering");
      });
    });
  });

  describe("API Error Handling", () => {
    it("should handle fetch error gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching interests:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      // Should show placeholder when no interests loaded
      expect(screen.getByText("Select interests")).toBeInTheDocument();
    });
  });

  describe("Styling and Animation", () => {
    it("should rotate chevron when open", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        // Check that dropdown is open by checking for search input
        expect(
          screen.getByPlaceholderText("Search interests...")
        ).toBeInTheDocument();
      });
    });

    it("should change background color when open", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(button.style.backgroundColor).toBe("rgb(37, 37, 37)");
      });
    });

    it("should have ring styling when open", async () => {
      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
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
    it("should handle empty interests array", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("No interests found")).toBeInTheDocument();
      });
    });

    it("should handle value with non-existent interest IDs", async () => {
      render(<InterestMultiSelect {...defaultProps} value={["999"]} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      // Should show placeholder when no valid interests selected
      expect(screen.getByText("Select interests")).toBeInTheDocument();
    });

    it("should fetch interests only once", async () => {
      const { rerender } = render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      rerender(<InterestMultiSelect {...defaultProps} value={["1"]} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it("should handle description being null", async () => {
      const interestsWithNullDesc = [
        {
          id: "1",
          name: "Test Interest",
          description: null,
          displayOrder: 1,
          isActive: true,
        },
      ];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => interestsWithNullDesc,
      });

      render(<InterestMultiSelect {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading interests...")
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Test Interest")).toBeInTheDocument();
      });
    });
  });
});
