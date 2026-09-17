import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import PersonalInformationSection from "@/app/components/features/user-profile/PersonalInformationSection";
import type { User } from "@/src/types";

// Mock UI components
jest.mock("@/app/components/ui/Card", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
}));

jest.mock("@/app/components/ui/Input", () => ({
  __esModule: true,
  default: ({
    label,
    value,
    onChange,
    onBlur,
    placeholder,
    type,
    className,
  }: any) => (
    <div>
      <label>{label}</label>
      <input
        type={type || "text"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        data-testid={`input-${label}`}
      />
    </div>
  ),
}));

jest.mock("@/app/components/ui/CountrySelect", () => ({
  __esModule: true,
  default: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => {
          const country = e.target.value
            ? { code: e.target.value, name: "Test Country" }
            : null;
          onChange(e.target.value, country);
        }}
        data-testid={`countryselect-${label}`}
      >
        <option value="">Select country</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
      </select>
    </div>
  ),
}));

jest.mock("@/app/components/ui/RegionSelect", () => ({
  __esModule: true,
  default: ({ label, value, onChange, countryCode }: any) => (
    <div>
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!countryCode}
        data-testid={`regionselect-${label}`}
      >
        <option value="">Select region</option>
        <option value="NY">New York</option>
        <option value="CA">California</option>
      </select>
    </div>
  ),
}));

jest.mock("@/app/components/ui/GenderSelect", () => ({
  __esModule: true,
  default: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`genderselect-${label}`}
      >
        <option value="">Select gender</option>
        <option value="M">Male</option>
        <option value="F">Female</option>
        <option value="O">Other</option>
      </select>
    </div>
  ),
}));

jest.mock("@/app/components/ui/YearPicker", () => ({
  __esModule: true,
  default: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
        data-testid={`yearpicker-${label}`}
      />
    </div>
  ),
}));

jest.mock("@/app/components/features/user-profile/InfoField", () => ({
  __esModule: true,
  default: ({ label, value }: { label: string; value?: string }) => (
    <div data-testid={`infofield-${label}`}>
      <label>{label}</label>
      <span>{value || "Not set"}</span>
    </div>
  ),
}));

const mockUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  role: "USER",
  createdAt: "2019-01-01T00:00:00.000Z",
  givenName: "John",
  familyName: "Doe",
  email: "john.doe@example.com",
  gender: "M",
  birthYear: 1990,
  birthCountry: { id: "country-1", code: "US", name: "United States" },
  residenceCountry: { id: "country-2", code: "CA", name: "Canada" },
  residenceRegion: { id: "region-1", code: "ON", name: "Ontario" },
};

describe("PersonalInformationSection", () => {
  const mockFormData = {
    givenName: "John",
    familyName: "Doe",
    email: "john.doe@example.com",
    gender: "M",
    birthYear: "1990",
    birthCountry: "country-1",
    residenceCountry: "country-2",
    residenceRegion: "region-1",
  };

  const defaultProps = {
    user: mockUser,
    isEditing: false,
    formData: mockFormData,
    onFormDataChange: jest.fn(),
    selectedResidenceCountry: { id: "country-2", code: "CA", name: "Canada" },
    setSelectedResidenceCountry: jest.fn(),
    errors: {},
    touched: {},
    onBlur: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("View Mode", () => {
    it("should render the section title", () => {
      render(<PersonalInformationSection {...defaultProps} />);
      expect(screen.getByText("Personal Information")).toBeInTheDocument();
    });

    it("should display all personal information fields", () => {
      render(<PersonalInformationSection {...defaultProps} />);

      expect(screen.getByTestId("infofield-Given Name")).toBeInTheDocument();
      expect(screen.getByTestId("infofield-Family Name")).toBeInTheDocument();
      expect(screen.getByTestId("infofield-Gender")).toBeInTheDocument();
      expect(screen.getByTestId("infofield-Birth Year")).toBeInTheDocument();
    });

    it("should display country and region information", () => {
      render(<PersonalInformationSection {...defaultProps} />);

      expect(screen.getByTestId("infofield-Birth Country")).toBeInTheDocument();
      expect(
        screen.getByTestId("infofield-Residence Country"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("infofield-Residence Region/State"),
      ).toBeInTheDocument();
    });
  });

  describe("Edit Mode", () => {
    const editProps = { ...defaultProps, isEditing: true };

    it("should render form inputs in edit mode", () => {
      render(<PersonalInformationSection {...editProps} />);

      expect(screen.getByTestId("input-Given Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-Family Name")).toBeInTheDocument();
    });

    it("should call onFormDataChange when given name changes", () => {
      const onFormDataChange = jest.fn();
      render(
        <PersonalInformationSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />,
      );

      const input = screen.getByTestId("input-Given Name");
      fireEvent.change(input, { target: { value: "Jane" } });

      expect(onFormDataChange).toHaveBeenCalledWith({ givenName: "Jane" });
    });

    it("should call onFormDataChange when family name changes", () => {
      const onFormDataChange = jest.fn();
      render(
        <PersonalInformationSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />,
      );

      const input = screen.getByTestId("input-Family Name");
      fireEvent.change(input, { target: { value: "Smith" } });

      expect(onFormDataChange).toHaveBeenCalledWith({ familyName: "Smith" });
    });

    it("should call onBlur when given name field loses focus", () => {
      const onBlur = jest.fn();
      render(<PersonalInformationSection {...editProps} onBlur={onBlur} />);

      const input = screen.getByTestId("input-Given Name");
      fireEvent.blur(input);

      expect(onBlur).toHaveBeenCalledWith("givenName");
    });
  });

  describe("Validation", () => {
    const editProps = { ...defaultProps, isEditing: true };

    it("should display error for given name when touched and invalid", () => {
      render(
        <PersonalInformationSection
          {...editProps}
          errors={{ givenName: "Given name is required" }}
          touched={{ givenName: true }}
        />,
      );

      expect(screen.getByText("Given name is required")).toBeInTheDocument();
    });

    it("should display error for family name when touched and invalid", () => {
      render(
        <PersonalInformationSection
          {...editProps}
          errors={{ familyName: "Family name is required" }}
          touched={{ familyName: true }}
        />,
      );

      expect(screen.getByText("Family name is required")).toBeInTheDocument();
    });

    it("should display error for birth year when touched and invalid", () => {
      render(
        <PersonalInformationSection
          {...editProps}
          errors={{ birthYear: "Invalid year" }}
          touched={{ birthYear: true }}
        />,
      );

      expect(screen.getByText("Invalid year")).toBeInTheDocument();
    });

    it("should not display error when field is not touched", () => {
      render(
        <PersonalInformationSection
          {...editProps}
          errors={{ givenName: "Given name is required" }}
          touched={{ givenName: false }}
        />,
      );

      expect(
        screen.queryByText("Given name is required"),
      ).not.toBeInTheDocument();
    });

    it("should apply error styling to input when error exists", () => {
      render(
        <PersonalInformationSection
          {...editProps}
          errors={{ givenName: "Required" }}
          touched={{ givenName: true }}
        />,
      );

      const input = screen.getByTestId("input-Given Name");
      expect(input.className).toContain("border-red-500");
    });
  });

  describe("Country and Region Selection", () => {
    const editProps = { ...defaultProps, isEditing: true };

    it("should render country select components", () => {
      render(<PersonalInformationSection {...editProps} />);

      expect(
        screen.getByTestId("countryselect-Birth Country"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("countryselect-Residence Country"),
      ).toBeInTheDocument();
    });

    it("should render region select component", () => {
      render(<PersonalInformationSection {...editProps} />);

      expect(
        screen.getByTestId("regionselect-Residence Region/State"),
      ).toBeInTheDocument();
    });

    it("should call setSelectedResidenceCountry when residence country changes", () => {
      const setSelectedResidenceCountry = jest.fn();
      render(
        <PersonalInformationSection
          {...editProps}
          setSelectedResidenceCountry={setSelectedResidenceCountry}
        />,
      );

      const select = screen.getByTestId("countryselect-Residence Country");
      fireEvent.change(select, { target: { value: "US" } });

      expect(setSelectedResidenceCountry).toHaveBeenCalled();
    });

    it("should clear region when country changes", () => {
      const onFormDataChange = jest.fn();
      render(
        <PersonalInformationSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />,
      );

      const select = screen.getByTestId("countryselect-Residence Country");
      fireEvent.change(select, { target: { value: "US" } });

      expect(onFormDataChange).toHaveBeenCalledWith({
        residenceCountry: "US",
        residenceRegion: "",
      });
    });

    it("should update region when region select changes", () => {
      const onFormDataChange = jest.fn();
      render(
        <PersonalInformationSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />,
      );

      const select = screen.getByTestId("regionselect-Residence Region/State");
      fireEvent.change(select, { target: { value: "NY" } });

      expect(onFormDataChange).toHaveBeenCalledWith({ residenceRegion: "NY" });
    });
  });

  describe("Gender and Birth Year", () => {
    const editProps = { ...defaultProps, isEditing: true };

    it("should render gender select", () => {
      render(<PersonalInformationSection {...editProps} />);
      expect(screen.getByTestId("genderselect-Gender")).toBeInTheDocument();
    });

    it("should render year picker for birth year", () => {
      render(<PersonalInformationSection {...editProps} />);
      expect(
        screen.getByTestId("yearpicker-Year of Birth"),
      ).toBeInTheDocument();
    });

    it("should call onFormDataChange when gender changes", () => {
      const onFormDataChange = jest.fn();
      render(
        <PersonalInformationSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />,
      );

      const select = screen.getByTestId("genderselect-Gender");
      fireEvent.change(select, { target: { value: "F" } });

      expect(onFormDataChange).toHaveBeenCalledWith({ gender: "F" });
    });

    it("should call onFormDataChange when birth year changes", () => {
      const onFormDataChange = jest.fn();
      render(
        <PersonalInformationSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />,
      );

      const yearPicker = screen.getByTestId("yearpicker-Year of Birth");
      fireEvent.change(yearPicker, { target: { value: "1985" } });

      expect(onFormDataChange).toHaveBeenCalledWith({ birthYear: "1985" });
    });

    it("should call onBlur when birth year loses focus", () => {
      const onBlur = jest.fn();
      const onFormDataChange = jest.fn();
      render(
        <PersonalInformationSection
          {...editProps}
          onFormDataChange={onFormDataChange}
          onBlur={onBlur}
        />,
      );

      const yearPicker = screen.getByTestId("yearpicker-Year of Birth");
      fireEvent.change(yearPicker, { target: { value: "1985" } });

      expect(onBlur).toHaveBeenCalledWith("birthYear");
    });
  });

  describe("Layout", () => {
    it("should use grid layout in view mode", () => {
      const { container } = render(
        <PersonalInformationSection {...defaultProps} />,
      );
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });

    it("should use grid layout in edit mode", () => {
      const { container } = render(
        <PersonalInformationSection {...defaultProps} isEditing={true} />,
      );
      const grids = container.querySelectorAll(".grid");
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("should render Card component", () => {
      render(<PersonalInformationSection {...defaultProps} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("should have proper section heading", () => {
      render(<PersonalInformationSection {...defaultProps} />);
      const heading = screen.getByText("Personal Information");
      expect(heading.tagName).toBe("H3");
    });
  });
});
