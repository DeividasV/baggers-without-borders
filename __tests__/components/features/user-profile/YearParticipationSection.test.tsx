import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import YearParticipationSection from "@/app/components/features/user-profile/YearParticipationSection";
import type { User } from "@/src/types";

// Mock UI components
jest.mock("@/app/components/ui/Card", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
}));

jest.mock("@/app/components/ui/Switch", () => ({
  __esModule: true,
  default: ({ id, checked, onChange, label }: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked);
    };
    return (
      <div>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={handleChange}
          data-testid={`switch-${id}`}
          aria-label={label || id}
        />
        {label && <label htmlFor={id}>{label}</label>}
      </div>
    );
  },
}));

jest.mock("@/app/components/ui/CountrySelect", () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder }: any) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value || null)}
      data-testid="country-select"
    >
      <option value="">{placeholder}</option>
      <option value="country-1">United States</option>
      <option value="country-2">Canada</option>
    </select>
  ),
}));

jest.mock("@/app/components/ui/LoadingSpinner", () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

const mockUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  role: "USER",
  createdAt: "2019-01-01T00:00:00.000Z",
  residenceCountry: { id: "country-1", code: "US", name: "United States" },
};

const mockYearParticipations = [
  {
    id: "part-1",
    enabled: true,
    dataNotProvided: false,
    countryId: null,
    country: null,
    year: {
      id: "year-1",
      code: "2023",
      title: "2023",
    },
  },
  {
    id: "part-2",
    enabled: false,
    dataNotProvided: true,
    countryId: null,
    country: null,
    year: {
      id: "year-2",
      code: "2024",
      title: "2024",
    },
  },
  {
    id: "part-3",
    enabled: true,
    dataNotProvided: false,
    countryId: "country-2",
    country: { id: "country-2", code: "CA", name: "Canada" },
    year: {
      id: "year-3",
      code: "2025",
      title: "2025",
    },
  },
];

describe("YearParticipationSection", () => {
  const defaultProps = {
    user: mockUser,
    isEditing: false,
    yearParticipations: mockYearParticipations,
    setYearParticipations: jest.fn(),
    loadingParticipations: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("View Mode", () => {
    it("should render the section title in view mode", () => {
      render(<YearParticipationSection {...defaultProps} />);
      expect(screen.getByText("Year Participation")).toBeInTheDocument();
    });

    it("should display all year codes", () => {
      render(<YearParticipationSection {...defaultProps} />);

      expect(screen.getByText("2023")).toBeInTheDocument();
      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.getByText("2025")).toBeInTheDocument();
    });

    it("should show enabled/disabled status", () => {
      render(<YearParticipationSection {...defaultProps} />);

      const enabledStatuses = screen.getAllByText("Enabled");
      const disabledStatuses = screen.getAllByText("Disabled");

      expect(enabledStatuses).toHaveLength(2);
      expect(disabledStatuses).toHaveLength(1);
    });

    it("should display country information", () => {
      render(<YearParticipationSection {...defaultProps} />);

      // Check that country names are displayed (there are multiple instances)
      expect(screen.getAllByText("United States").length).toBeGreaterThan(0);
      expect(screen.getByText("Canada")).toBeInTheDocument();
    });

    it("should show 'No Data Provided' indicator when applicable", () => {
      render(<YearParticipationSection {...defaultProps} />);

      expect(screen.getByText("No Data Provided")).toBeInTheDocument();
    });

    it("should highlight country override", () => {
      render(<YearParticipationSection {...defaultProps} />);

      expect(screen.getByText("Override")).toBeInTheDocument();
    });

    it("should apply correct styling for enabled participations", () => {
      const { container } = render(
        <YearParticipationSection {...defaultProps} />
      );

      const enabledCards = container.querySelectorAll(".bg-green-900\\/20");
      expect(enabledCards.length).toBeGreaterThan(0);
    });

    it("should apply correct styling for disabled participations", () => {
      const { container } = render(
        <YearParticipationSection {...defaultProps} />
      );

      const disabledCards = container.querySelectorAll(".bg-red-900\\/20");
      expect(disabledCards.length).toBeGreaterThan(0);
    });
  });

  describe("Edit Mode", () => {
    const editProps = { ...defaultProps, isEditing: true };

    it("should render the section title in edit mode", () => {
      render(<YearParticipationSection {...editProps} />);
      expect(
        screen.getByText("Year Participation & Country Override")
      ).toBeInTheDocument();
    });

    it("should show helper text in edit mode", () => {
      render(<YearParticipationSection {...editProps} />);

      expect(
        screen.getByText(/Control which years this user participates/)
      ).toBeInTheDocument();
    });

    it("should render switches for each year", () => {
      render(<YearParticipationSection {...editProps} />);

      expect(screen.getByTestId("switch-year-year-1")).toBeInTheDocument();
      expect(screen.getByTestId("switch-year-year-2")).toBeInTheDocument();
      expect(screen.getByTestId("switch-year-year-3")).toBeInTheDocument();
    });

    it("should render data not provided switches", () => {
      render(<YearParticipationSection {...editProps} />);

      expect(
        screen.getByTestId("switch-data-not-provided-year-1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("switch-data-not-provided-year-2")
      ).toBeInTheDocument();
    });

    it("should render country selects for each year", () => {
      render(<YearParticipationSection {...editProps} />);

      const countrySelects = screen.getAllByTestId("country-select");
      expect(countrySelects).toHaveLength(3);
    });

    it("should toggle year participation when switch is clicked", () => {
      const setYearParticipations = jest.fn();
      render(
        <YearParticipationSection
          {...editProps}
          setYearParticipations={setYearParticipations}
        />
      );

      const switchElement = screen.getByTestId("switch-year-year-1");
      fireEvent.click(switchElement);

      expect(setYearParticipations).toHaveBeenCalled();
      const updatedParticipations = setYearParticipations.mock.calls[0][0];
      const firstItem = updatedParticipations.find(
        (p: any) => p.id === "part-1"
      );
      expect(firstItem.enabled).toBe(false);
    });

    it("should toggle dataNotProvided when switch is clicked", () => {
      const setYearParticipations = jest.fn();
      render(
        <YearParticipationSection
          {...editProps}
          setYearParticipations={setYearParticipations}
        />
      );

      const switchElement = screen.getByTestId(
        "switch-data-not-provided-year-1"
      );
      fireEvent.click(switchElement);

      expect(setYearParticipations).toHaveBeenCalled();
      const updatedParticipations = setYearParticipations.mock.calls[0][0];
      const firstItem = updatedParticipations.find(
        (p: any) => p.id === "part-1"
      );
      expect(firstItem.dataNotProvided).toBe(true);
    });

    it("should update country when country select changes", () => {
      const setYearParticipations = jest.fn();
      render(
        <YearParticipationSection
          {...editProps}
          setYearParticipations={setYearParticipations}
        />
      );

      const countrySelects = screen.getAllByTestId("country-select");
      fireEvent.change(countrySelects[0], { target: { value: "country-2" } });

      expect(setYearParticipations).toHaveBeenCalled();
      const updatedParticipations = setYearParticipations.mock.calls[0][0];
      const firstItem = updatedParticipations.find(
        (p: any) => p.id === "part-1"
      );
      expect(firstItem.countryId).toBe("country-2");
    });

    it("should maintain correct switch states", () => {
      render(<YearParticipationSection {...editProps} />);

      const switch1 = screen.getByTestId(
        "switch-year-year-1"
      ) as HTMLInputElement;
      const switch2 = screen.getByTestId(
        "switch-year-year-2"
      ) as HTMLInputElement;
      const switch3 = screen.getByTestId(
        "switch-year-year-3"
      ) as HTMLInputElement;

      expect(switch1.checked).toBe(true);
      expect(switch2.checked).toBe(false);
      expect(switch3.checked).toBe(true);
    });

    it("should maintain correct dataNotProvided switch states", () => {
      render(<YearParticipationSection {...editProps} />);

      const switch1 = screen.getByTestId(
        "switch-data-not-provided-year-1"
      ) as HTMLInputElement;
      const switch2 = screen.getByTestId(
        "switch-data-not-provided-year-2"
      ) as HTMLInputElement;

      expect(switch1.checked).toBe(false);
      expect(switch2.checked).toBe(true);
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when loading", () => {
      render(
        <YearParticipationSection
          {...defaultProps}
          loadingParticipations={true}
        />
      );

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should not show year list when loading", () => {
      render(
        <YearParticipationSection
          {...defaultProps}
          loadingParticipations={true}
        />
      );

      expect(screen.queryByText("2023")).not.toBeInTheDocument();
      expect(screen.queryByText("2024")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show message when no participations available", () => {
      render(
        <YearParticipationSection {...defaultProps} yearParticipations={[]} />
      );

      expect(
        screen.getByText("No participation data available")
      ).toBeInTheDocument();
    });

    it("should not show year list when empty", () => {
      render(
        <YearParticipationSection {...defaultProps} yearParticipations={[]} />
      );

      expect(screen.queryByText("2023")).not.toBeInTheDocument();
    });
  });

  describe("Country Override Logic", () => {
    it("should use default country when no override is set", () => {
      render(<YearParticipationSection {...defaultProps} />);

      // The first year (2023) should show the user's default residence country
      expect(screen.getAllByText("United States")[0]).toBeInTheDocument();
    });

    it("should handle null countryId", () => {
      const setYearParticipations = jest.fn();
      render(
        <YearParticipationSection
          {...defaultProps}
          isEditing={true}
          setYearParticipations={setYearParticipations}
        />
      );

      const countrySelects = screen.getAllByTestId("country-select");
      fireEvent.change(countrySelects[0], { target: { value: "" } });

      expect(setYearParticipations).toHaveBeenCalled();
      const updatedParticipations = setYearParticipations.mock.calls[0][0];
      const firstItem = updatedParticipations.find(
        (p: any) => p.id === "part-1"
      );
      expect(firstItem.countryId).toBeNull();
    });
  });

  describe("Multiple Toggles", () => {
    it("should handle multiple consecutive toggles", () => {
      const setYearParticipations = jest.fn();
      render(
        <YearParticipationSection
          {...defaultProps}
          isEditing={true}
          setYearParticipations={setYearParticipations}
        />
      );

      const switch1 = screen.getByTestId("switch-year-year-1");
      const switch2 = screen.getByTestId("switch-year-year-2");

      fireEvent.click(switch1);
      fireEvent.click(switch2);

      expect(setYearParticipations).toHaveBeenCalledTimes(2);
    });

    it("should preserve other participations when toggling one", () => {
      const setYearParticipations = jest.fn();
      render(
        <YearParticipationSection
          {...defaultProps}
          isEditing={true}
          setYearParticipations={setYearParticipations}
        />
      );

      const switchElement = screen.getByTestId("switch-year-year-2");
      fireEvent.click(switchElement);

      const updatedParticipations = setYearParticipations.mock.calls[0][0];

      // Check that only the toggled item changed
      expect(updatedParticipations[0].enabled).toBe(true); // unchanged
      expect(updatedParticipations[1].enabled).toBe(true); // changed
      expect(updatedParticipations[2].enabled).toBe(true); // unchanged
    });
  });

  describe("Accessibility", () => {
    it("should render Card component", () => {
      render(<YearParticipationSection {...defaultProps} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("should have proper section heading", () => {
      render(<YearParticipationSection {...defaultProps} />);
      const heading = screen.getByText("Year Participation");
      expect(heading.tagName).toBe("H3");
    });
  });

  describe("Layout Responsiveness", () => {
    it("should use responsive grid classes in view mode", () => {
      const { container } = render(
        <YearParticipationSection {...defaultProps} />
      );

      const grid = container.querySelector(".grid");
      expect(grid?.className).toMatch(/md:grid-cols-/);
      expect(grid?.className).toMatch(/lg:grid-cols-/);
    });

    it("should use responsive grid classes in edit mode", () => {
      const { container } = render(
        <YearParticipationSection {...defaultProps} isEditing={true} />
      );

      const grid = container.querySelector(".grid");
      expect(grid?.className).toMatch(/md:grid-cols-/);
      expect(grid?.className).toMatch(/lg:grid-cols-/);
    });
  });
});
