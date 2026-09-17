import { render, screen, fireEvent } from "@testing-library/react";
import HofTableFilters from "@/app/components/features/hof-tables/HofTableFilters";

describe("HofTableFilters Component", () => {
  const mockYears = [
    { id: "1", code: "2023", title: "2023 Season", displayOrder: 1 },
    { id: "2", code: "2024", title: "2024 Season", displayOrder: 2 },
    { id: "3", code: "2025", title: "2025 Season", displayOrder: 3 },
  ];

  const mockHofs = [
    { id: "h1", code: "BWB", title: "British Winter & Black", displayOrder: 1 },
    {
      id: "h2",
      code: "BWI",
      title: "British Winter Internationalist",
      displayOrder: 2,
    },
    { id: "h3", code: "BGH", title: "British Gritstone Hero", displayOrder: 3 },
  ];

  const mockConfig = {
    minPeaks: 100,
    minForeignPeaks: 20,
    minFpr: 15,
  };

  const defaultProps = {
    years: mockYears,
    hofs: mockHofs,
    selectedYearId: "2",
    selectedHofId: "h1",
    config: mockConfig,
    hofLabel: "BWB",
    yearLabel: "2024",
    isAdmin: false,
    onYearChange: jest.fn(),
    onHofChange: jest.fn(),
    selectedBadges: new Set<string>(),
    onBadgeToggle: jest.fn(),
    searchText: "",
    onSearchChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render Hall of Fame selection before year selection", () => {
    render(<HofTableFilters {...defaultProps} />);

    const hofHeading = screen.getByText("Select Hall of Fame");
    const yearHeading = screen.getByText("Select Year");

    expect(
      hofHeading.compareDocumentPosition(yearHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  describe("Year Selection", () => {
    it("should render year selection section", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(screen.getByText("Select Year")).toBeInTheDocument();
    });

    it("should render all year options", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(screen.getByRole("button", { name: "2023" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "2024" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "2025" })).toBeInTheDocument();
    });

    it("should highlight selected year", () => {
      render(<HofTableFilters {...defaultProps} selectedYearId="2" />);
      const selectedBtn = screen.getByRole("button", { name: "2024" });
      expect(selectedBtn).toHaveClass(
        "bg-primary-600",
        "text-white",
        "shadow-lg",
      );
    });

    it("should not highlight non-selected years", () => {
      render(<HofTableFilters {...defaultProps} selectedYearId="2" />);
      const nonSelectedBtn = screen.getByRole("button", { name: "2023" });
      expect(nonSelectedBtn).toHaveClass("text-gray-400");
      expect(nonSelectedBtn).not.toHaveClass("bg-primary-600");
    });

    it("should call onYearChange when year is clicked", () => {
      render(<HofTableFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole("button", { name: "2023" }));
      expect(defaultProps.onYearChange).toHaveBeenCalledWith("1");
    });

    it("should set aria-pressed to true for selected year", () => {
      render(<HofTableFilters {...defaultProps} selectedYearId="2" />);
      const selectedBtn = screen.getByRole("button", { name: "2024" });
      expect(selectedBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("should set aria-pressed to false for non-selected years", () => {
      render(<HofTableFilters {...defaultProps} selectedYearId="2" />);
      const nonSelectedBtn = screen.getByRole("button", { name: "2023" });
      expect(nonSelectedBtn).toHaveAttribute("aria-pressed", "false");
    });

    it("should not render year section when years array is empty", () => {
      render(<HofTableFilters {...defaultProps} years={[]} />);
      expect(screen.queryByText("Select Year")).not.toBeInTheDocument();
    });

    it("should have proper aria-label on year group", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(
        screen.getByRole("group", { name: "Year filter" }),
      ).toBeInTheDocument();
    });
  });

  describe("Hall of Fame Selection", () => {
    it("should render HOF selection section", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(screen.getByText("Select Hall of Fame")).toBeInTheDocument();
    });

    it("should render all HOF options", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(screen.getByRole("button", { name: "BWB" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "BWI" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "BGH" })).toBeInTheDocument();
    });

    it("should highlight selected HOF", () => {
      render(<HofTableFilters {...defaultProps} selectedHofId="h1" />);
      const selectedBtn = screen.getByRole("button", { name: "BWB" });
      expect(selectedBtn).toHaveClass(
        "bg-primary-600",
        "text-white",
        "shadow-lg",
      );
    });

    it("should not highlight non-selected HOFs", () => {
      render(<HofTableFilters {...defaultProps} selectedHofId="h1" />);
      const nonSelectedBtn = screen.getByRole("button", { name: "BWI" });
      expect(nonSelectedBtn).toHaveClass("text-gray-400");
      expect(nonSelectedBtn).not.toHaveClass("bg-primary-600");
    });

    it("should call onHofChange when HOF is clicked", () => {
      render(<HofTableFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole("button", { name: "BWI" }));
      expect(defaultProps.onHofChange).toHaveBeenCalledWith("h2");
    });

    it("should set aria-pressed to true for selected HOF", () => {
      render(<HofTableFilters {...defaultProps} selectedHofId="h1" />);
      const selectedBtn = screen.getByRole("button", { name: "BWB" });
      expect(selectedBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("should set aria-pressed to false for non-selected HOFs", () => {
      render(<HofTableFilters {...defaultProps} selectedHofId="h1" />);
      const nonSelectedBtn = screen.getByRole("button", { name: "BWI" });
      expect(nonSelectedBtn).toHaveAttribute("aria-pressed", "false");
    });

    it("should not render HOF section when hofs array is empty", () => {
      render(<HofTableFilters {...defaultProps} hofs={[]} />);
      expect(screen.queryByText("Select Hall of Fame")).not.toBeInTheDocument();
    });

    it("should have proper aria-label on HOF group", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(
        screen.getByRole("group", { name: "Hall of Fame filter" }),
      ).toBeInTheDocument();
    });
  });

  describe("Badge Filters", () => {
    it("should render badge filter section", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(screen.getByText("Filter by Badge")).toBeInTheDocument();
    });

    it("should render all badge filter buttons", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Me" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New Entrant" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New Award" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Retired" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Deceased" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "LCE" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Junior" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "National" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Missing Data" }),
      ).toBeInTheDocument();
    });

    it("should highlight selected badge", () => {
      const selectedBadges = new Set(["me"]);
      render(
        <HofTableFilters {...defaultProps} selectedBadges={selectedBadges} />,
      );
      const meBtn = screen.getByRole("button", { name: "Me" });
      expect(meBtn).toHaveClass(
        "bg-primary-600/20",
        "text-primary-400",
        "border-primary-600/50",
      );
    });

    it("should not highlight non-selected badges", () => {
      const selectedBadges = new Set(["me"]);
      render(
        <HofTableFilters {...defaultProps} selectedBadges={selectedBadges} />,
      );
      const newEntrantBtn = screen.getByRole("button", { name: "New Entrant" });
      expect(newEntrantBtn).toHaveClass("bg-dark-700/50", "text-gray-400");
    });

    it("should call onBadgeToggle when badge is clicked", () => {
      render(<HofTableFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole("button", { name: "New Entrant" }));
      expect(defaultProps.onBadgeToggle).toHaveBeenCalledWith("newEntrant");
    });

    it("should handle multiple selected badges", () => {
      const selectedBadges = new Set(["me", "newEntrant", "lce"]);
      render(
        <HofTableFilters {...defaultProps} selectedBadges={selectedBadges} />,
      );
      expect(screen.getByRole("button", { name: "Me" })).toHaveClass(
        "bg-primary-600/20",
      );
      expect(screen.getByRole("button", { name: "New Entrant" })).toHaveClass(
        "bg-green-600/20",
      );
      expect(screen.getByRole("button", { name: "LCE" })).toHaveClass(
        "bg-primary-600/20",
      );
    });

    it("should apply correct color classes to New Entrant badge", () => {
      const selectedBadges = new Set(["newEntrant"]);
      render(
        <HofTableFilters {...defaultProps} selectedBadges={selectedBadges} />,
      );
      const btn = screen.getByRole("button", { name: "New Entrant" });
      expect(btn).toHaveClass(
        "bg-green-600/20",
        "text-green-400",
        "border-green-600/50",
      );
    });

    it("should apply correct color classes to New Award badge", () => {
      const selectedBadges = new Set(["newAward"]);
      render(
        <HofTableFilters {...defaultProps} selectedBadges={selectedBadges} />,
      );
      const btn = screen.getByRole("button", { name: "New Award" });
      expect(btn).toHaveClass(
        "bg-yellow-600/20",
        "text-yellow-400",
        "border-yellow-600/50",
      );
    });

    it("should apply correct color classes to Retired badge", () => {
      const selectedBadges = new Set(["retired"]);
      render(
        <HofTableFilters {...defaultProps} selectedBadges={selectedBadges} />,
      );
      const btn = screen.getByRole("button", { name: "Retired" });
      expect(btn).toHaveClass(
        "bg-blue-600/20",
        "text-blue-400",
        "border-blue-600/50",
      );
    });

    it("should apply correct color classes to Deceased badge", () => {
      const selectedBadges = new Set(["deceased"]);
      render(
        <HofTableFilters {...defaultProps} selectedBadges={selectedBadges} />,
      );
      const btn = screen.getByRole("button", { name: "Deceased" });
      expect(btn).toHaveClass(
        "bg-gray-600/20",
        "text-gray-400",
        "border-gray-600/50",
      );
    });
  });

  describe("Search Functionality", () => {
    it("should render search section", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(screen.getByText("Search by Name")).toBeInTheDocument();
    });

    it("should render search input", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(
        screen.getByPlaceholderText("Search by name..."),
      ).toBeInTheDocument();
    });

    it("should display search text value", () => {
      render(<HofTableFilters {...defaultProps} searchText="John" />);
      expect(screen.getByPlaceholderText("Search by name...")).toHaveValue(
        "John",
      );
    });

    it("should call onSearchChange when typing", () => {
      render(<HofTableFilters {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search by name...");
      fireEvent.change(input, { target: { value: "test" } });
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith("test");
    });

    it("should show clear button when search text exists", () => {
      render(<HofTableFilters {...defaultProps} searchText="test" />);
      expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
    });

    it("should not show clear button when search text is empty", () => {
      render(<HofTableFilters {...defaultProps} searchText="" />);
      expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
    });

    it("should call onSearchChange with empty string when clear button is clicked", () => {
      render(<HofTableFilters {...defaultProps} searchText="test" />);
      fireEvent.click(screen.getByLabelText("Clear search"));
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith("");
    });

    it("should apply correct styling to search input", () => {
      render(<HofTableFilters {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search by name...");
      expect(input).toHaveClass(
        "bg-dark-700",
        "border-dark-600",
        "text-gray-300",
      );
    });
  });

  describe("Active Filters Display", () => {
    it("should show filter status when badges are selected", () => {
      const selectedBadges = new Set(["me", "newEntrant"]);
      render(
        <HofTableFilters {...defaultProps} selectedBadges={selectedBadges} />,
      );
      expect(
        screen.getByText("Showing records with selected badges"),
      ).toBeInTheDocument();
    });

    it("should show search status when search text exists", () => {
      render(<HofTableFilters {...defaultProps} searchText="John" />);
      expect(screen.getByText(/Searching for "John"/)).toBeInTheDocument();
    });

    it("should show both statuses when badges and search are active", () => {
      const selectedBadges = new Set(["me"]);
      render(
        <HofTableFilters
          {...defaultProps}
          selectedBadges={selectedBadges}
          searchText="John"
        />,
      );
      expect(
        screen.getByText(/Showing records with selected badges/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Searching for "John"/)).toBeInTheDocument();
    });

    it("should not show filter status when no filters are active", () => {
      render(<HofTableFilters {...defaultProps} />);
      expect(screen.queryByText(/Showing records/)).not.toBeInTheDocument();
    });

    it("should show clear all button when filters are active", () => {
      const selectedBadges = new Set(["me"]);
      render(
        <HofTableFilters {...defaultProps} selectedBadges={selectedBadges} />,
      );
      expect(
        screen.getByRole("button", { name: "Clear all" }),
      ).toBeInTheDocument();
    });

    it("should call onBadgeToggle for each selected badge and onSearchChange when clear all is clicked", () => {
      const selectedBadges = new Set(["me", "newEntrant"]);
      render(
        <HofTableFilters
          {...defaultProps}
          selectedBadges={selectedBadges}
          searchText="test"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
      expect(defaultProps.onBadgeToggle).toHaveBeenCalledTimes(2);
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith("");
    });
  });

  describe("Missing Configuration Warning", () => {
    it("should show warning when config is null and user is admin", () => {
      render(
        <HofTableFilters
          {...defaultProps}
          config={null}
          isAdmin={true}
          selectedYearId="2"
          selectedHofId="h1"
        />,
      );
      expect(screen.getByText("Configuration Missing")).toBeInTheDocument();
    });

    it("should not show warning when config exists", () => {
      render(
        <HofTableFilters
          {...defaultProps}
          config={mockConfig}
          isAdmin={true}
        />,
      );
      expect(
        screen.queryByText("Configuration Missing"),
      ).not.toBeInTheDocument();
    });

    it("should not show warning when user is not admin", () => {
      render(
        <HofTableFilters {...defaultProps} config={null} isAdmin={false} />,
      );
      expect(
        screen.queryByText("Configuration Missing"),
      ).not.toBeInTheDocument();
    });

    it("should not show warning when no year is selected", () => {
      render(
        <HofTableFilters
          {...defaultProps}
          config={null}
          isAdmin={true}
          selectedYearId={null}
          selectedHofId="h1"
        />,
      );
      expect(
        screen.queryByText("Configuration Missing"),
      ).not.toBeInTheDocument();
    });

    it("should not show warning when no HOF is selected", () => {
      render(
        <HofTableFilters
          {...defaultProps}
          config={null}
          isAdmin={true}
          selectedYearId="2"
          selectedHofId={null}
        />,
      );
      expect(
        screen.queryByText("Configuration Missing"),
      ).not.toBeInTheDocument();
    });

    it("should display correct HOF and year labels in warning", () => {
      render(
        <HofTableFilters
          {...defaultProps}
          config={null}
          isAdmin={true}
          hofLabel="BWB"
          yearLabel="2024"
        />,
      );
      expect(screen.getByText(/BWB - 2024/)).toBeInTheDocument();
    });

    it("should show create configuration link in warning", () => {
      render(
        <HofTableFilters
          {...defaultProps}
          config={null}
          isAdmin={true}
          selectedYearId="2"
          selectedHofId="h1"
        />,
      );
      const link = screen.getByText("Create Configuration").closest("a");
      expect(link).toHaveAttribute("href", "/admin/configuration/new");
    });

    it("should show warning icon", () => {
      render(
        <HofTableFilters
          {...defaultProps}
          config={null}
          isAdmin={true}
          selectedYearId="2"
          selectedHofId="h1"
        />,
      );
      const configMissing = screen.getByText("Configuration Missing");
      const warningDiv = configMissing.closest(".bg-yellow-900\\/20");
      expect(warningDiv).toBeInTheDocument();
      expect(warningDiv).toHaveClass("border-yellow-600/30");
    });

    it("should display detailed warning message", () => {
      render(
        <HofTableFilters
          {...defaultProps}
          config={null}
          isAdmin={true}
          selectedYearId="2"
          selectedHofId="h1"
        />,
      );
      expect(
        screen.getByText(/No filtering configuration exists for/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/All members with entries are shown without filters/),
      ).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("should render year buttons in a flex container", () => {
      render(<HofTableFilters {...defaultProps} />);
      const yearGroup = screen.getByRole("group", { name: "Year filter" });
      expect(yearGroup).toHaveClass("inline-flex", "rounded-lg", "bg-dark-700");
    });

    it("should render HOF buttons in a flex container", () => {
      render(<HofTableFilters {...defaultProps} />);
      const hofGroup = screen.getByRole("group", {
        name: "Hall of Fame filter",
      });
      expect(hofGroup).toHaveClass("inline-flex", "rounded-lg", "bg-dark-700");
    });

    it("should render badge filters in a flex wrap container", () => {
      render(<HofTableFilters {...defaultProps} />);
      const badgeContainer = screen.getByRole("button", {
        name: "Me",
      }).parentElement;
      expect(badgeContainer).toHaveClass("flex", "flex-wrap", "gap-2");
    });

    it("should apply hover styles to year buttons", () => {
      render(<HofTableFilters {...defaultProps} selectedYearId="1" />);
      const nonSelectedBtn = screen.getByRole("button", { name: "2024" });
      expect(nonSelectedBtn).toHaveClass("hover:text-gray-300");
    });

    it("should apply hover styles to HOF buttons", () => {
      render(<HofTableFilters {...defaultProps} selectedHofId="h2" />);
      const nonSelectedBtn = screen.getByRole("button", { name: "BWB" });
      expect(nonSelectedBtn).toHaveClass("hover:text-gray-300");
    });

    it("should apply hover styles to non-selected badges", () => {
      render(<HofTableFilters {...defaultProps} />);
      const badge = screen.getByRole("button", { name: "Me" });
      expect(badge).toHaveClass("hover:text-gray-300", "hover:border-gray-500");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null selectedYearId", () => {
      render(<HofTableFilters {...defaultProps} selectedYearId={null} />);
      mockYears.forEach((year) => {
        const btn = screen.getByRole("button", { name: year.code });
        expect(btn).not.toHaveClass("bg-primary-600");
      });
    });

    it("should handle null selectedHofId", () => {
      render(<HofTableFilters {...defaultProps} selectedHofId={null} />);
      mockHofs.forEach((hof) => {
        const btn = screen.getByRole("button", { name: hof.code });
        expect(btn).not.toHaveClass("bg-primary-600");
      });
    });

    it("should handle empty selectedBadges set", () => {
      render(<HofTableFilters {...defaultProps} selectedBadges={new Set()} />);
      expect(screen.queryByText(/Showing records/)).not.toBeInTheDocument();
    });

    it("should handle single year", () => {
      const singleYear = [mockYears[0]];
      render(<HofTableFilters {...defaultProps} years={singleYear} />);
      expect(screen.getByRole("button", { name: "2023" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "2024" }),
      ).not.toBeInTheDocument();
    });

    it("should handle single HOF", () => {
      const singleHof = [mockHofs[0]];
      render(<HofTableFilters {...defaultProps} hofs={singleHof} />);
      expect(screen.getByRole("button", { name: "BWB" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "BWI" }),
      ).not.toBeInTheDocument();
    });

    it("should handle long search text", () => {
      const longText = "a".repeat(100);
      render(<HofTableFilters {...defaultProps} searchText={longText} />);
      expect(screen.getByPlaceholderText("Search by name...")).toHaveValue(
        longText,
      );
    });

    it("should handle special characters in search text", () => {
      render(<HofTableFilters {...defaultProps} searchText="O'Brien-Smith" />);
      expect(screen.getByPlaceholderText("Search by name...")).toHaveValue(
        "O'Brien-Smith",
      );
    });

    it("should handle all badges selected", () => {
      const allBadges = new Set([
        "me",
        "newEntrant",
        "newAward",
        "retired",
        "deceased",
        "lce",
        "junior",
        "national",
        "missingData",
      ]);
      render(<HofTableFilters {...defaultProps} selectedBadges={allBadges} />);
      allBadges.forEach((badge) => {
        const btnName =
          badge === "me"
            ? "Me"
            : badge === "newEntrant"
              ? "New Entrant"
              : badge === "newAward"
                ? "New Award"
                : badge === "lce"
                  ? "LCE"
                  : badge === "missingData"
                    ? "Missing Data"
                    : badge.charAt(0).toUpperCase() + badge.slice(1);
        const btn = screen.getByRole("button", { name: btnName });
        expect(btn).not.toHaveClass("bg-dark-700/50");
      });
    });
  });

  describe("Hofmeister Display", () => {
    it("shows hofmeister name when assigned", () => {
      const propsWithHofmeister = {
        ...defaultProps,
        config: {
          ...mockConfig,
          hofmeister: {
            id: "user-1",
            displayName: "John Doe",
            username: "johndoe",
          },
        },
      };

      render(<HofTableFilters {...propsWithHofmeister} />);

      expect(screen.getByText("HoF Meister:")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Responsible for organizing and maintaining BWB in 2024/i,
        ),
      ).toBeInTheDocument();
    });

    it("shows 'not assigned' message when no hofmeister", () => {
      const propsWithoutHofmeister = {
        ...defaultProps,
        config: {
          ...mockConfig,
          hofmeister: null,
        },
      };

      render(<HofTableFilters {...propsWithoutHofmeister} />);

      expect(screen.getByText("HoF Meister:")).toBeInTheDocument();
      expect(screen.getByText("HoF Meister not assigned")).toBeInTheDocument();
    });

    it("shows 'not assigned' message when hofmeister undefined", () => {
      render(<HofTableFilters {...defaultProps} config={mockConfig} />);

      expect(screen.getByText("HoF Meister:")).toBeInTheDocument();
      expect(screen.getByText("HoF Meister not assigned")).toBeInTheDocument();
    });

    it("handles missing config gracefully", () => {
      const propsWithoutConfig = {
        ...defaultProps,
        config: null,
      };

      render(<HofTableFilters {...propsWithoutConfig} />);

      // Should not throw error, hofmeister section should not appear
      expect(screen.queryByText("HoF Meister:")).not.toBeInTheDocument();
    });

    it("uses correct HOF and year labels in description", () => {
      const propsWithCustomLabels = {
        ...defaultProps,
        hofLabel: "P1000",
        yearLabel: "2025",
        config: {
          ...mockConfig,
          hofmeister: {
            id: "user-2",
            displayName: "Jane Smith",
            username: "janesmith",
          },
        },
      };

      render(<HofTableFilters {...propsWithCustomLabels} />);

      expect(
        screen.getByText(
          /Responsible for organizing and maintaining P1000 in 2025/i,
        ),
      ).toBeInTheDocument();
    });

    it("applies correct styling to hofmeister section", () => {
      const propsWithHofmeister = {
        ...defaultProps,
        config: {
          ...mockConfig,
          hofmeister: {
            id: "user-1",
            displayName: "Bob Wilson",
            username: "bobwilson",
          },
        },
      };

      const { container } = render(
        <HofTableFilters {...propsWithHofmeister} />,
      );

      // Check for border-top separator
      const hofmeisterSection = container.querySelector(
        ".border-t.border-dark-600",
      );
      expect(hofmeisterSection).toBeInTheDocument();

      // Check text color for "not assigned" vs assigned
      const nameElement = screen.getByText("Bob Wilson");
      expect(nameElement).toHaveClass("text-gray-300");
    });

    it("applies warning color to 'not assigned' message", () => {
      const propsWithoutHofmeister = {
        ...defaultProps,
        config: {
          ...mockConfig,
          hofmeister: null,
        },
      };

      render(<HofTableFilters {...propsWithoutHofmeister} />);

      const notAssignedElement = screen.getByText("HoF Meister not assigned");
      expect(notAssignedElement).toHaveClass("text-red-400");
    });
  });
});
