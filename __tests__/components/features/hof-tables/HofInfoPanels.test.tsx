import { render, screen } from "@testing-library/react";
import HofInfoPanels from "@/app/components/features/hof-tables/HofInfoPanels";

// Mock hofTierUtils
jest.mock("@/src/lib/hofTierUtils", () => ({
  getTierBorderColor: (tierName: string) => {
    if (tierName === "Gold") return "border-l-yellow-500";
    if (tierName === "Silver") return "border-l-gray-300";
    if (tierName === "Bronze") return "border-l-orange-600";
    return "border-l-primary-500";
  },
  getTierTextColor: (tierName: string) => {
    if (tierName === "Gold") return "text-yellow-400";
    if (tierName === "Silver") return "text-gray-300";
    if (tierName === "Bronze") return "text-orange-400";
    return "text-primary-400";
  },
  getTierGradient: (tierName: string) => {
    if (tierName === "Gold") return "bg-gradient-to-r from-yellow-500/10";
    if (tierName === "Silver") return "bg-gradient-to-r from-gray-300/10";
    if (tierName === "Bronze") return "bg-gradient-to-r from-orange-600/10";
    return "";
  },
}));

describe("HofInfoPanels Component", () => {
  const mockAwardTiers = [
    { id: "t1", name: "Bronze", minPeaks: 100, maxPeaks: 199, displayOrder: 1 },
    { id: "t2", name: "Silver", minPeaks: 200, maxPeaks: 299, displayOrder: 2 },
    { id: "t3", name: "Gold", minPeaks: 300, maxPeaks: null, displayOrder: 3 },
  ];

  const mockConfig = {
    minPeaks: 100,
    minForeignPeaks: 25,
    minFpr: 20,
    minimumAge: 18,
    lceEnabled: false,
    lceMinFpr: 15,
    lceCountries: [],
  };

  const mockCountries = [
    { id: "c1", name: "United States", code: "US" },
    { id: "c2", name: "Canada", code: "CA" },
    { id: "c3", name: "Australia", code: "AU" },
  ];

  const defaultProps = {
    config: mockConfig,
    awardTiers: mockAwardTiers,
    hofLabel: "BWB",
    yearLabel: "2024",
    isAdmin: false,
    countries: mockCountries,
  };

  describe("Table Guide Section", () => {
    it("should render table guide header", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Hall of Fame Table")).toBeInTheDocument();
    });

    it("should explain Year Filter", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText(/Year Filter:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Select a specific year to view climbing statistics/)
      ).toBeInTheDocument();
    });

    it("should explain Hall of Fame Filter", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText(/Hall of Fame Filter:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Choose different prominence categories/)
      ).toBeInTheDocument();
    });

    it("should explain Total Peaks", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText(/Total Peaks:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Cumulative number of peaks/)
      ).toBeInTheDocument();
    });

    it("should explain Peaks in year with dynamic year label", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText(/Peaks in 2024:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Number of peaks climbed in the selected year only/)
      ).toBeInTheDocument();
    });

    it("should explain FPR", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(
        screen.getByText(/FPR \(Foreign Peaks Ratio\):/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Percentage of foreign peaks/)
      ).toBeInTheDocument();
    });

    it("should explain Progress Register", () => {
      render(<HofInfoPanels {...defaultProps} />);
      const progressRegisterElements =
        screen.getAllByText(/Progress Register:/);
      expect(progressRegisterElements.length).toBeGreaterThan(0);
      expect(
        screen.getByText(
          /Members who participated but didn't meet all qualification requirements/
        )
      ).toBeInTheDocument();
    });
  });

  describe("Expandable Member Details Section", () => {
    it("should render expandable details header", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Expandable member details")).toBeInTheDocument();
    });

    it("should explain HOF table expansion", () => {
      render(<HofInfoPanels {...defaultProps} />);
      const hofTableElements = screen.getAllByText(/Hall of Fame Table:/);
      expect(hofTableElements.length).toBeGreaterThan(0);
      expect(
        screen.getByText(/Yearly history, country details, award progression/)
      ).toBeInTheDocument();
    });

    it("should explain Progress Register expansion", () => {
      render(<HofInfoPanels {...defaultProps} />);
      const progressRegisterElements =
        screen.getAllByText(/Progress Register:/);
      expect(progressRegisterElements.length).toBeGreaterThan(0);
      expect(
        screen.getByText(/Progress tracking with visual indicators/)
      ).toBeInTheDocument();
    });
  });

  describe("Member Badges Section", () => {
    it("should render badges header", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Member badges")).toBeInTheDocument();
    });

    it("should show You badge with explanation", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("You")).toBeInTheDocument();
      expect(screen.getByText("This is you")).toBeInTheDocument();
    });

    it("should show New Entrant badge with explanation", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("New Entrant")).toBeInTheDocument();
      expect(
        screen.getByText("First time qualifying for this table")
      ).toBeInTheDocument();
    });

    it("should show New Award badge with explanation", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("New Award")).toBeInTheDocument();
      expect(screen.getByText("Reached a new award level")).toBeInTheDocument();
    });

    it("should show Retired badge with explanation", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Retired in XXXX")).toBeInTheDocument();
      expect(
        screen.getByText("No longer actively climbing")
      ).toBeInTheDocument();
    });

    it("should show Deceased badge with explanation", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Deceased in XXXX")).toBeInTheDocument();
      expect(screen.getByText("Member has passed away")).toBeInTheDocument();
    });

    it("should show LCE badge with explanation", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("LCE")).toBeInTheDocument();
      expect(
        screen.getByText("Lower requirement for large countries")
      ).toBeInTheDocument();
    });

    it("should show Junior badge with explanation", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Junior")).toBeInTheDocument();
      expect(
        screen.getByText("Below minimum age requirement")
      ).toBeInTheDocument();
    });

    it("should show National badge with explanation", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("National")).toBeInTheDocument();
      expect(
        screen.getByText(/Has sufficient peaks but Foreign Peak Ratio/)
      ).toBeInTheDocument();
    });

    it("should show No Data badge with dynamic year label", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("No Data in 2024")).toBeInTheDocument();
      expect(
        screen.getByText("Did not submit data this year")
      ).toBeInTheDocument();
    });

    it("should show Missing Data badge with explanation", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Missing Data")).toBeInTheDocument();
      expect(screen.getByText(/Birth year not provided/)).toBeInTheDocument();
    });

    it("should apply correct styling to badge examples", () => {
      render(<HofInfoPanels {...defaultProps} />);
      const youBadge = screen.getByText("You");
      expect(youBadge).toHaveClass("bg-primary-600/20", "text-primary-400");

      const newEntrantBadge = screen.getByText("New Entrant");
      expect(newEntrantBadge).toHaveClass("bg-green-600/20", "text-green-400");

      const newAwardBadge = screen.getByText("New Award");
      expect(newAwardBadge).toHaveClass("bg-yellow-600/20", "text-yellow-400");
    });
  });

  describe("Minimum Requirements Section - With Config", () => {
    it("should render requirements header", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Minimum Requirements")).toBeInTheDocument();
    });

    it("should show HOF and year labels", () => {
      render(<HofInfoPanels {...defaultProps} />);
      const labels = screen.getAllByText(/Hall of Fame BWB of 2024/);
      expect(labels.length).toBeGreaterThan(0);
    });

    it("should display minimum peaks requirement", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText(/Minimum 100 peaks/)).toBeInTheDocument();
      const elements = screen.getAllByText(
        /Total peaks climbed across all years/
      );
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should display minimum foreign peaks requirement", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText(/Minimum 25 foreign peaks/)).toBeInTheDocument();
      const elements = screen.getAllByText(
        /Total foreign peaks climbed across all years/
      );
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should display minimum FPR requirement", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText(/Minimum 20% FPR/)).toBeInTheDocument();
      expect(
        screen.getByText(/Foreign Peak Ratio percentage/)
      ).toBeInTheDocument();
    });

    it("should display minimum age requirement", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText(/Minimum age 18 years/)).toBeInTheDocument();
      expect(screen.getByText(/Member's age during 2024/)).toBeInTheDocument();
    });

    it("should show only non-zero requirements", () => {
      const configWithSomeZeros = {
        ...mockConfig,
        minForeignPeaks: 0,
        minimumAge: 0,
      };
      render(<HofInfoPanels {...defaultProps} config={configWithSomeZeros} />);
      expect(screen.getByText(/Minimum 100 peaks/)).toBeInTheDocument();
      expect(
        screen.queryByText(/Minimum 0 foreign peaks/)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Minimum age 0/)).not.toBeInTheDocument();
    });
  });

  describe("Minimum Requirements Section - No Config", () => {
    it("should show no requirements message when config is null", () => {
      render(<HofInfoPanels {...defaultProps} config={null} />);
      expect(
        screen.getByText("No filtering requirements are set.")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "All participants with HOF entries are shown in the table."
        )
      ).toBeInTheDocument();
    });

    it("should show create config link for admins when no config", () => {
      render(<HofInfoPanels {...defaultProps} config={null} isAdmin={true} />);
      const link = screen.getByRole("link", {
        name: /Create filtering configuration/,
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/admin/configuration/new");
    });

    it("should not show create config link for non-admins", () => {
      render(<HofInfoPanels {...defaultProps} config={null} isAdmin={false} />);
      expect(
        screen.queryByText(/Create filtering configuration/)
      ).not.toBeInTheDocument();
    });

    it("should show no requirements when all requirements are zero", () => {
      const allZeroConfig = {
        minPeaks: 0,
        minForeignPeaks: 0,
        minFpr: 0,
        minimumAge: 0,
        lceEnabled: false,
      };
      render(<HofInfoPanels {...defaultProps} config={allZeroConfig} />);
      expect(
        screen.getByText("No filtering requirements are set.")
      ).toBeInTheDocument();
    });
  });

  describe("Large Country Exception (LCE) Section", () => {
    it("should show LCE section when enabled with countries", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceMinFpr: 15,
        lceCountries: [
          { countryId: "c1", hasLce: true },
          { countryId: "c2", hasLce: true },
        ],
      };
      render(<HofInfoPanels {...defaultProps} config={lceConfig} />);
      expect(
        screen.getByText(/Large country exception \(LCE\)/)
      ).toBeInTheDocument();
    });

    it("should display standard FPR", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceMinFpr: 15,
        lceCountries: [{ countryId: "c1", hasLce: true }],
      };
      render(<HofInfoPanels {...defaultProps} config={lceConfig} />);
      expect(screen.getByText(/Standard FPR: 20%/)).toBeInTheDocument();
    });

    it("should display LCE FPR", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceMinFpr: 15,
        lceCountries: [{ countryId: "c1", hasLce: true }],
      };
      render(<HofInfoPanels {...defaultProps} config={lceConfig} />);
      expect(screen.getByText(/LCE FPR: 15%/)).toBeInTheDocument();
    });

    it("should display exempt country names", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceCountries: [
          { countryId: "c1", hasLce: true },
          { countryId: "c3", hasLce: true },
        ],
      };
      render(<HofInfoPanels {...defaultProps} config={lceConfig} />);
      expect(screen.getByText(/Exempt Countries:/)).toBeInTheDocument();
      expect(screen.getByText(/Australia, United States/)).toBeInTheDocument();
    });

    it("should sort country names alphabetically", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceCountries: [
          { countryId: "c3", hasLce: true }, // Australia
          { countryId: "c1", hasLce: true }, // United States
        ],
      };
      render(<HofInfoPanels {...defaultProps} config={lceConfig} />);
      const text = screen.getByText(/Australia, United States/);
      expect(text).toBeInTheDocument();
    });

    it("should not show LCE section when disabled", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: false,
        lceCountries: [{ countryId: "c1", hasLce: true }],
      };
      render(<HofInfoPanels {...defaultProps} config={lceConfig} />);
      expect(
        screen.queryByText(/Large country exception/)
      ).not.toBeInTheDocument();
    });

    it("should not show LCE section when no countries have LCE", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceCountries: [
          { countryId: "c1", hasLce: false },
          { countryId: "c2", hasLce: false },
        ],
      };
      render(<HofInfoPanels {...defaultProps} config={lceConfig} />);
      expect(
        screen.queryByText(/Large country exception/)
      ).not.toBeInTheDocument();
    });

    it("should use minFpr as fallback when lceMinFpr is not set", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceMinFpr: undefined,
        lceCountries: [{ countryId: "c1", hasLce: true }],
      };
      render(<HofInfoPanels {...defaultProps} config={lceConfig} />);
      expect(screen.getByText(/LCE FPR: 20%/)).toBeInTheDocument();
    });
  });

  describe("Award Tier Colors Section", () => {
    it("should render award tiers header", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Award tier colors")).toBeInTheDocument();
    });

    it("should show description of colored borders", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(
        screen.getByText(/Rows have colored left borders and rank backgrounds/)
      ).toBeInTheDocument();
    });

    it("should display all award tiers", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("Bronze")).toBeInTheDocument();
      expect(screen.getByText("Silver")).toBeInTheDocument();
      expect(screen.getByText("Gold")).toBeInTheDocument();
    });

    it("should display tier peak ranges", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("100-199")).toBeInTheDocument();
      expect(screen.getByText("200-299")).toBeInTheDocument();
      expect(screen.getByText("300-∞")).toBeInTheDocument();
    });

    it("should sort tiers by displayOrder", () => {
      const unorderedTiers = [
        {
          id: "t1",
          name: "Gold",
          minPeaks: 300,
          maxPeaks: null,
          displayOrder: 3,
        },
        {
          id: "t2",
          name: "Bronze",
          minPeaks: 100,
          maxPeaks: 199,
          displayOrder: 1,
        },
        {
          id: "t3",
          name: "Silver",
          minPeaks: 200,
          maxPeaks: 299,
          displayOrder: 2,
        },
      ];
      render(<HofInfoPanels {...defaultProps} awardTiers={unorderedTiers} />);

      const tierNames = screen.getAllByText(/Bronze|Silver|Gold/);
      const filteredNames = tierNames.filter(
        (el) =>
          el.textContent === "Bronze" ||
          el.textContent === "Silver" ||
          el.textContent === "Gold"
      );
      expect(filteredNames[0]).toHaveTextContent("Bronze");
      expect(filteredNames[1]).toHaveTextContent("Silver");
      expect(filteredNames[2]).toHaveTextContent("Gold");
    });

    it("should apply tier border colors", () => {
      render(<HofInfoPanels {...defaultProps} />);
      const bronzeTier = screen
        .getByText("Bronze")
        .closest("div")?.parentElement;
      expect(bronzeTier).toHaveClass("border-l-orange-600");

      const silverTier = screen
        .getByText("Silver")
        .closest("div")?.parentElement;
      expect(silverTier).toHaveClass("border-l-gray-300");

      const goldTier = screen.getByText("Gold").closest("div")?.parentElement;
      expect(goldTier).toHaveClass("border-l-yellow-500");
    });

    it("should apply tier text colors", () => {
      render(<HofInfoPanels {...defaultProps} />);
      const bronzeName = screen.getByText("Bronze");
      expect(bronzeName).toHaveClass("text-orange-400");

      const silverName = screen.getByText("Silver");
      expect(silverName).toHaveClass("text-gray-300");

      const goldName = screen.getByText("Gold");
      expect(goldName).toHaveClass("text-yellow-400");
    });

    it("should not render award tiers section when empty", () => {
      render(<HofInfoPanels {...defaultProps} awardTiers={[]} />);
      expect(screen.queryByText("Award tier colors")).not.toBeInTheDocument();
    });
  });

  describe("Layout and Responsiveness", () => {
    it("should use grid layout", () => {
      const { container } = render(<HofInfoPanels {...defaultProps} />);
      const gridDiv = container.querySelector(".grid");
      expect(gridDiv).toBeInTheDocument();
      expect(gridDiv).toHaveClass("grid-cols-1", "lg:grid-cols-2", "gap-4");
    });

    it("should have two main info cards", () => {
      const { container } = render(<HofInfoPanels {...defaultProps} />);
      const cards = container.querySelectorAll(".card");
      expect(cards.length).toBe(2);
    });
  });

  describe("Dynamic Content", () => {
    it("should update year label in multiple places", () => {
      render(<HofInfoPanels {...defaultProps} yearLabel="2023" />);
      expect(screen.getByText(/Peaks in 2023:/)).toBeInTheDocument();
      expect(screen.getByText(/No Data in 2023/)).toBeInTheDocument();
      expect(screen.getByText(/Member's age during 2023/)).toBeInTheDocument();
    });

    it("should update HOF label in multiple places", () => {
      render(<HofInfoPanels {...defaultProps} hofLabel="BWI" />);
      const hofLabels = screen.getAllByText(/Hall of Fame BWI of 2024/);
      expect(hofLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing countries array", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceCountries: [{ countryId: "c1", hasLce: true }],
      };
      render(
        <HofInfoPanels
          {...defaultProps}
          config={lceConfig}
          countries={undefined}
        />
      );
      expect(screen.queryByText(/Exempt Countries:/)).not.toBeInTheDocument();
    });

    it("should handle empty countries array", () => {
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceCountries: [{ countryId: "c1", hasLce: true }],
      };
      render(
        <HofInfoPanels {...defaultProps} config={lceConfig} countries={[]} />
      );
      expect(screen.queryByText(/Exempt Countries:/)).not.toBeInTheDocument();
    });

    it("should handle tier with null maxPeaks", () => {
      render(<HofInfoPanels {...defaultProps} />);
      expect(screen.getByText("300-∞")).toBeInTheDocument();
    });

    it("should handle single award tier", () => {
      const singleTier = [
        {
          id: "t1",
          name: "Bronze",
          minPeaks: 100,
          maxPeaks: null,
          displayOrder: 1,
        },
      ];
      render(<HofInfoPanels {...defaultProps} awardTiers={singleTier} />);
      expect(screen.getByText("Bronze")).toBeInTheDocument();
      expect(screen.getByText("100-∞")).toBeInTheDocument();
    });

    it("should handle config with only one requirement", () => {
      const singleReqConfig = {
        minPeaks: 100,
        minForeignPeaks: 0,
        minFpr: 0,
        minimumAge: 0,
        lceEnabled: false,
      };
      render(<HofInfoPanels {...defaultProps} config={singleReqConfig} />);
      expect(screen.getByText(/Minimum 100 peaks/)).toBeInTheDocument();
      expect(screen.queryByText(/Minimum 0/)).not.toBeInTheDocument();
    });

    it("should handle very long country names in LCE", () => {
      const longNameCountries = [
        {
          id: "c1",
          name: "Very Long Country Name That Should Display",
          code: "VL",
        },
        { id: "c2", name: "Another Long Country Name", code: "AL" },
      ];
      const lceConfig = {
        ...mockConfig,
        lceEnabled: true,
        lceCountries: [
          { countryId: "c1", hasLce: true },
          { countryId: "c2", hasLce: true },
        ],
      };
      render(
        <HofInfoPanels
          {...defaultProps}
          config={lceConfig}
          countries={longNameCountries}
        />
      );
      expect(
        screen.getByText(
          /Another Long Country Name, Very Long Country Name That Should Display/
        )
      ).toBeInTheDocument();
    });
  });
});
