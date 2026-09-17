import { render, screen, fireEvent, within } from "@testing-library/react";
import SearchControls from "@/app/components/features/members/SearchControls";
import {
  SearchMode,
  AdvancedFilters,
  Pagination,
} from "@/src/types/user-management";

// Mock UI components
jest.mock("@/app/components/ui/Card", () => {
  return function Card({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <div data-testid="card" className={className}>
        {children}
      </div>
    );
  };
});

jest.mock("@/app/components/ui/Button", () => {
  return function Button({
    children,
    onClick,
    disabled,
    variant,
    size,
    icon,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    icon?: React.ReactNode;
  }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        data-variant={variant}
        data-size={size}
      >
        {icon && <span data-testid="button-icon">{icon}</span>}
        {children}
      </button>
    );
  };
});

jest.mock("@/app/components/ui/Input", () => {
  return function Input({
    label,
    value,
    onChange,
    placeholder,
    type,
  }: {
    label?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          data-testid={`input-${label?.toLowerCase().replace(/\s+/g, "-")}`}
        />
      </div>
    );
  };
});

jest.mock("@/app/components/ui/SearchInput", () => {
  return function SearchInput({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  }) {
    return (
      <input
        data-testid="search-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  };
});

jest.mock("@/app/components/ui/GenderSelect", () => {
  return function GenderSelect({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <select
          data-testid="gender-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">All</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
    );
  };
});

jest.mock("@/app/components/ui/YearRangePicker", () => {
  return function YearRangePicker({
    label,
    fromValue,
    toValue,
    onFromChange,
    onToChange,
  }: {
    label?: string;
    fromValue?: number;
    toValue?: number;
    onFromChange: (year?: number) => void;
    onToChange: (year?: number) => void;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <input
          data-testid="year-range-from"
          type="number"
          value={fromValue || ""}
          onChange={(e) =>
            onFromChange(e.target.value ? parseInt(e.target.value) : undefined)
          }
        />
        <input
          data-testid="year-range-to"
          type="number"
          value={toValue || ""}
          onChange={(e) =>
            onToChange(e.target.value ? parseInt(e.target.value) : undefined)
          }
        />
      </div>
    );
  };
});

jest.mock("@/app/components/ui/CountryMultiSelect", () => {
  return function CountryMultiSelect({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label?: string;
    value: string[];
    onChange: (countries: string[]) => void;
    placeholder?: string;
    showAllOption?: boolean;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <select
          data-testid={`country-multi-${label
            ?.toLowerCase()
            .replace(/\s+/g, "-")}`}
          multiple
          value={value}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              (option) => option.value,
            );
            onChange(selected);
          }}
        >
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="FR">France</option>
        </select>
      </div>
    );
  };
});

jest.mock("@/app/components/ui/DateRangePicker", () => {
  return function DateRangePicker({
    label,
    fromValue,
    toValue,
    onFromChange,
    onToChange,
  }: {
    label?: string;
    fromValue: string;
    toValue: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <input
          data-testid={`date-range-${label?.toLowerCase()}-from`}
          type="date"
          value={fromValue}
          onChange={(e) => onFromChange(e.target.value)}
        />
        <input
          data-testid={`date-range-${label?.toLowerCase()}-to`}
          type="date"
          value={toValue}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
    );
  };
});

jest.mock("@/app/components/ui/RoleSelect", () => {
  return function RoleSelect({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <select
          data-testid="role-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">All</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
    );
  };
});

jest.mock("@/app/components/ui/StatusSelect", () => {
  return function StatusSelect({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <select
          data-testid="status-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
    );
  };
});

jest.mock("@/app/components/ui/ShowPerPageSelect", () => {
  return function ShowPerPageSelect({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value: number;
    onChange: (value: number) => void;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <select
          data-testid="show-per-page-select"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
    );
  };
});

jest.mock("@/app/components/ui/SortBySelect", () => {
  return function SortBySelect({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <select
          data-testid="sort-by-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">None</option>
          <option value="givenName">Given Name</option>
          <option value="familyName">Family Name</option>
          <option value="email">Email</option>
        </select>
      </div>
    );
  };
});

jest.mock("@/app/components/ui/SortDirectionSelect", () => {
  return function SortDirectionSelect({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
  }) {
    return (
      <div>
        {label && <label>{label}</label>}
        <select
          data-testid="sort-direction-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    );
  };
});

describe("SearchControls Component", () => {
  const defaultAdvancedFilters: AdvancedFilters = {
    givenName: "",
    familyName: "",
    email: "",
    gender: "",
    residenceCountry: [],
    birthCountry: [],
    birthYearMin: "",
    birthYearMax: "",
    forumNickname: "",
    role: "",
    status: "",
    notes: "",
    createdDateFrom: "",
    createdDateTo: "",
    updatedDateFrom: "",
    updatedDateTo: "",
    sortBy: "",
    sortOrder: "asc",
  };

  const defaultPagination: Pagination = {
    page: 1,
    limit: 25,
    totalCount: 100,
    totalPages: 4,
    hasMore: true,
  };

  const defaultProps = {
    searchMode: "simple" as SearchMode,
    basicSearch: "",
    advancedFilters: defaultAdvancedFilters,
    pagination: defaultPagination,
    filtering: false,
    displayedCount: 25,
    onSearchModeChange: jest.fn(),
    onBasicSearchChange: jest.fn(),
    onAdvancedFilterChange: jest.fn(),
    onClearBasicSearch: jest.fn(),
    onClearAdvancedFilters: jest.fn(),
    onPageSizeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Structure", () => {
    it("should render card container", () => {
      render(<SearchControls {...defaultProps} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("should render mode toggle buttons", () => {
      render(<SearchControls {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /basic/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /advanced/i }),
      ).toBeInTheDocument();
    });

    it("should apply correct styling to card", () => {
      render(<SearchControls {...defaultProps} />);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("bg-dark-800", "border-dark-700");
    });
  });

  describe("Search Mode Toggle", () => {
    it("should show active state for simple mode", () => {
      render(<SearchControls {...defaultProps} searchMode="simple" />);
      const simpleBtn = screen.getByRole("button", { name: /basic/i });
      expect(simpleBtn).toHaveClass(
        "bg-primary-900",
        "text-primary-400",
        "border-primary-700",
      );
    });

    it("should show active state for advanced mode", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      const advancedBtn = screen.getByRole("button", { name: /advanced/i });
      expect(advancedBtn).toHaveClass(
        "bg-primary-900",
        "text-primary-400",
        "border-primary-700",
      );
    });

    it("should call onSearchModeChange when clicking simple mode", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.click(screen.getByRole("button", { name: /basic/i }));
      expect(defaultProps.onSearchModeChange).toHaveBeenCalledWith("simple");
    });

    it("should call onSearchModeChange when clicking advanced mode", () => {
      render(<SearchControls {...defaultProps} searchMode="simple" />);
      fireEvent.click(screen.getByRole("button", { name: /advanced/i }));
      expect(defaultProps.onSearchModeChange).toHaveBeenCalledWith("advanced");
    });

    it("should show indicator dot when basic search has value", () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          basicSearch="test"
        />,
      );
      const simpleBtn = screen.getByRole("button", { name: /basic/i });
      expect(simpleBtn).toHaveTextContent("●");
    });

    it("should show filter count when advanced filters are active", () => {
      const filtersWithValues: AdvancedFilters = {
        ...defaultAdvancedFilters,
        givenName: "John",
        email: "test@example.com",
        role: "ADMIN",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="advanced"
          advancedFilters={filtersWithValues}
        />,
      );
      const advancedBtn = screen.getByRole("button", { name: /advanced/i });
      // Count includes all non-empty filters: givenName, email, role + sortOrder (asc)
      expect(advancedBtn.textContent).toContain("(4)");
    });
  });

  describe("Basic Search Mode", () => {
    it("should render search input in simple mode", () => {
      render(<SearchControls {...defaultProps} searchMode="simple" />);
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });

    it("should not render search input in advanced mode", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
    });

    it("should display search input value", () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          basicSearch="test query"
        />,
      );
      expect(screen.getByTestId("search-input")).toHaveValue("test query");
    });

    it("should call onBasicSearchChange when typing", () => {
      render(<SearchControls {...defaultProps} searchMode="simple" />);
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "new search" },
      });
      expect(defaultProps.onBasicSearchChange).toHaveBeenCalledWith(
        "new search",
      );
    });

    it("should show filtering spinner when filtering is true", () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          filtering={true}
        />,
      );
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should show helper text when search has value", () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          basicSearch="test"
        />,
      );
      expect(
        screen.getByText(/searching across all member fields/i),
      ).toBeInTheDocument();
    });

    it("should not show helper text when search is empty", () => {
      render(
        <SearchControls {...defaultProps} searchMode="simple" basicSearch="" />,
      );
      expect(
        screen.queryByText(/searching across all member fields/i),
      ).not.toBeInTheDocument();
    });

    it("should render clear button", () => {
      render(<SearchControls {...defaultProps} searchMode="simple" />);
      expect(
        screen.getByRole("button", { name: /clear/i }),
      ).toBeInTheDocument();
    });

    it("should disable clear button when search is empty", () => {
      render(
        <SearchControls {...defaultProps} searchMode="simple" basicSearch="" />,
      );
      expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
    });

    it("should enable clear button when search has value", () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          basicSearch="test"
        />,
      );
      expect(screen.getByRole("button", { name: /clear/i })).not.toBeDisabled();
    });

    it("should call onClearBasicSearch when clicking clear", () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          basicSearch="test"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /clear/i }));
      expect(defaultProps.onClearBasicSearch).toHaveBeenCalled();
    });
  });

  describe("Advanced Filters Mode", () => {
    it("should render all input fields in advanced mode", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(screen.getByTestId("input-first-name")).toBeInTheDocument();
      expect(screen.getByTestId("input-last-name")).toBeInTheDocument();
      expect(screen.getByTestId("input-email")).toBeInTheDocument();
      expect(screen.getByTestId("input-forum-nickname")).toBeInTheDocument();
      expect(screen.getByTestId("input-notes")).toBeInTheDocument();
    });

    it("should render all select fields", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(screen.getByTestId("gender-select")).toBeInTheDocument();
      expect(screen.getByTestId("role-select")).toBeInTheDocument();
      expect(screen.getByTestId("status-select")).toBeInTheDocument();
    });

    it("should render country multi-selects", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(
        screen.getByTestId("country-multi-residence-country"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("country-multi-birth-country"),
      ).toBeInTheDocument();
    });

    it("should render year range picker", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(screen.getByTestId("year-range-from")).toBeInTheDocument();
      expect(screen.getByTestId("year-range-to")).toBeInTheDocument();
    });

    it("should render date range pickers", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(screen.getByTestId("date-range-created-from")).toBeInTheDocument();
      expect(screen.getByTestId("date-range-created-to")).toBeInTheDocument();
      expect(screen.getByTestId("date-range-updated-from")).toBeInTheDocument();
      expect(screen.getByTestId("date-range-updated-to")).toBeInTheDocument();
    });

    it("should render sorting controls", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(screen.getByTestId("sort-by-select")).toBeInTheDocument();
      expect(screen.getByTestId("sort-direction-select")).toBeInTheDocument();
    });

    it("should render show per page select", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(screen.getByTestId("show-per-page-select")).toBeInTheDocument();
    });
  });

  describe("Advanced Filter Interactions", () => {
    it("should call onAdvancedFilterChange when changing given name", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.change(screen.getByTestId("input-given-name"), {
        target: { value: "John" },
      });
      expect(defaultProps.onAdvancedFilterChange).toHaveBeenCalledWith({
        givenName: "John",
      });
    });

    it("should call onAdvancedFilterChange when changing family name", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.change(screen.getByTestId("input-family-name"), {
        target: { value: "Doe" },
      });
      expect(defaultProps.onAdvancedFilterChange).toHaveBeenCalledWith({
        familyName: "Doe",
      });
    });

    it("should call onAdvancedFilterChange when changing email", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.change(screen.getByTestId("input-email"), {
        target: { value: "test@example.com" },
      });
      expect(defaultProps.onAdvancedFilterChange).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });

    it("should call onAdvancedFilterChange when changing gender", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.change(screen.getByTestId("gender-select"), {
        target: { value: "male" },
      });
      expect(defaultProps.onAdvancedFilterChange).toHaveBeenCalledWith({
        gender: "male",
      });
    });

    it("should call onAdvancedFilterChange when changing role", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.change(screen.getByTestId("role-select"), {
        target: { value: "ADMIN" },
      });
      expect(defaultProps.onAdvancedFilterChange).toHaveBeenCalledWith({
        role: "ADMIN",
      });
    });

    it("should call onAdvancedFilterChange when changing status", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.change(screen.getByTestId("status-select"), {
        target: { value: "ACTIVE" },
      });
      expect(defaultProps.onAdvancedFilterChange).toHaveBeenCalledWith({
        status: "ACTIVE",
      });
    });

    it("should call onAdvancedFilterChange when changing forum nickname", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.change(screen.getByTestId("input-forum-nickname"), {
        target: { value: "climber123" },
      });
      expect(defaultProps.onAdvancedFilterChange).toHaveBeenCalledWith({
        forumNickname: "climber123",
      });
    });

    it("should call onAdvancedFilterChange when changing notes", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.change(screen.getByTestId("input-notes"), {
        target: { value: "test notes" },
      });
      expect(defaultProps.onAdvancedFilterChange).toHaveBeenCalledWith({
        notes: "test notes",
      });
    });

    it("should call onPageSizeChange when changing page size", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      fireEvent.change(screen.getByTestId("show-per-page-select"), {
        target: { value: "50" },
      });
      expect(defaultProps.onPageSizeChange).toHaveBeenCalledWith(50);
    });
  });

  describe("Statistics Display", () => {
    it("should display total count", () => {
      render(<SearchControls {...defaultProps} searchMode="simple" />);
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText(/records/i)).toBeInTheDocument();
    });

    it("should display displayed count", () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          displayedCount={25}
        />,
      );
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText(/displayed/i)).toBeInTheDocument();
    });

    it('should show singular "record" for count of 1', () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          pagination={{ ...defaultPagination, totalCount: 1 }}
        />,
      );
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/record/)).toBeInTheDocument();
    });

    it('should show plural "records" for count > 1', () => {
      render(<SearchControls {...defaultProps} searchMode="simple" />);
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText(/records/)).toBeInTheDocument();
    });

    it("should display sort information when sortBy is set", () => {
      const filtersWithSort: AdvancedFilters = {
        ...defaultAdvancedFilters,
        sortBy: "givenName",
        sortOrder: "asc",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          advancedFilters={filtersWithSort}
        />,
      );
      expect(screen.getByText(/sorted by:/i)).toBeInTheDocument();
      expect(screen.getByText("First Name")).toBeInTheDocument();
      expect(screen.getByText(/↑/)).toBeInTheDocument();
    });

    it("should show descending arrow for desc sort order", () => {
      const filtersWithSort: AdvancedFilters = {
        ...defaultAdvancedFilters,
        sortBy: "email",
        sortOrder: "desc",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          advancedFilters={filtersWithSort}
        />,
      );
      expect(screen.getByText(/↓/)).toBeInTheDocument();
    });

    it("should not display sort info when sortBy is empty", () => {
      render(<SearchControls {...defaultProps} searchMode="simple" />);
      expect(screen.queryByText(/sorted by:/i)).not.toBeInTheDocument();
    });

    it("should display statistics in both simple and advanced modes", () => {
      const { rerender } = render(
        <SearchControls {...defaultProps} searchMode="simple" />,
      );
      expect(screen.getByText("100")).toBeInTheDocument();

      rerender(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(screen.getByText("100")).toBeInTheDocument();
    });
  });

  describe("Clear Filters", () => {
    it("should render clear button in advanced mode", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(
        screen.getByRole("button", { name: /clear/i }),
      ).toBeInTheDocument();
    });

    it("should disable clear button when no filters are active", () => {
      render(<SearchControls {...defaultProps} searchMode="advanced" />);
      expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
    });

    it("should enable clear button when filters are active", () => {
      const filtersWithValues: AdvancedFilters = {
        ...defaultAdvancedFilters,
        givenName: "John",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="advanced"
          advancedFilters={filtersWithValues}
        />,
      );
      expect(screen.getByRole("button", { name: /clear/i })).not.toBeDisabled();
    });

    it("should call onClearAdvancedFilters when clicking clear in advanced mode", () => {
      const filtersWithValues: AdvancedFilters = {
        ...defaultAdvancedFilters,
        email: "test@example.com",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="advanced"
          advancedFilters={filtersWithValues}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /clear/i }));
      expect(defaultProps.onClearAdvancedFilters).toHaveBeenCalled();
    });

    it("should not count sortBy and sortOrder as active filters", () => {
      const filtersWithSort: AdvancedFilters = {
        ...defaultAdvancedFilters,
        sortBy: "email",
        sortOrder: "desc",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="advanced"
          advancedFilters={filtersWithSort}
        />,
      );
      expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
    });

    it("should count array filters as active when they have values", () => {
      const filtersWithArrays: AdvancedFilters = {
        ...defaultAdvancedFilters,
        residenceCountry: ["US", "UK"],
        birthCountry: ["FR"],
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="advanced"
          advancedFilters={filtersWithArrays}
        />,
      );
      expect(screen.getByRole("button", { name: /clear/i })).not.toBeDisabled();
    });
  });

  describe("Sort Label Mapping", () => {
    it("should map givenName to Given Name", () => {
      const filtersWithSort: AdvancedFilters = {
        ...defaultAdvancedFilters,
        sortBy: "givenName",
        sortOrder: "asc",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          advancedFilters={filtersWithSort}
        />,
      );
      expect(screen.getByText("Given Name")).toBeInTheDocument();
    });

    it("should map familyName to Family Name", () => {
      const filtersWithSort: AdvancedFilters = {
        ...defaultAdvancedFilters,
        sortBy: "familyName",
        sortOrder: "asc",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          advancedFilters={filtersWithSort}
        />,
      );
      expect(screen.getByText("Family Name")).toBeInTheDocument();
    });

    it("should map email to Email", () => {
      const filtersWithSort: AdvancedFilters = {
        ...defaultAdvancedFilters,
        sortBy: "email",
        sortOrder: "asc",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          advancedFilters={filtersWithSort}
        />,
      );
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("should map createdAt to Date Created", () => {
      const filtersWithSort: AdvancedFilters = {
        ...defaultAdvancedFilters,
        sortBy: "createdAt",
        sortOrder: "asc",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          advancedFilters={filtersWithSort}
        />,
      );
      expect(screen.getByText("Date Created")).toBeInTheDocument();
    });

    it("should map updatedAt to Date Updated", () => {
      const filtersWithSort: AdvancedFilters = {
        ...defaultAdvancedFilters,
        sortBy: "updatedAt",
        sortOrder: "asc",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          advancedFilters={filtersWithSort}
        />,
      );
      expect(screen.getByText("Date Updated")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero total count", () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          pagination={{ ...defaultPagination, totalCount: 0 }}
        />,
      );
      expect(screen.queryByText(/records/i)).not.toBeInTheDocument();
    });

    it("should handle empty string in filters", () => {
      const filtersWithEmpty: AdvancedFilters = {
        ...defaultAdvancedFilters,
        givenName: "",
        email: "",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="advanced"
          advancedFilters={filtersWithEmpty}
        />,
      );
      expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
    });

    it("should handle whitespace in basic search correctly", () => {
      render(
        <SearchControls
          {...defaultProps}
          searchMode="simple"
          basicSearch="   "
        />,
      );
      expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
    });

    it("should handle mixed active and empty filters", () => {
      const mixedFilters: AdvancedFilters = {
        ...defaultAdvancedFilters,
        givenName: "John",
        familyName: "",
        email: "test@example.com",
        gender: "",
      };
      render(
        <SearchControls
          {...defaultProps}
          searchMode="advanced"
          advancedFilters={mixedFilters}
        />,
      );
      const advancedBtn = screen.getByRole("button", { name: /advanced/i });
      // Counts: givenName, email, sortOrder (asc) = 3
      expect(advancedBtn.textContent).toContain("(3)");
    });
  });
});
