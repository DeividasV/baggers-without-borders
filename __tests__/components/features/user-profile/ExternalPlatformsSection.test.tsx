import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import ExternalPlatformsSection from "@/app/components/features/user-profile/ExternalPlatformsSection";
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
  default: ({ label, value, onChange, placeholder }: any) => (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-testid={`input-${label}`}
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
  peakbaggerId: "PB123",
  hillBaggingId: "HB456",
};

describe("ExternalPlatformsSection", () => {
  const mockFormData = {
    peakbaggerId: "PB123",
    hillBaggingId: "HB456",
    showPeakbaggerLink: true,
    showHillBaggingLink: false,
  };

  const defaultProps = {
    user: mockUser,
    isEditing: false,
    formData: mockFormData,
    onFormDataChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("View Mode", () => {
    it("should render the section title", () => {
      render(<ExternalPlatformsSection {...defaultProps} />);
      expect(screen.getByText("External Platforms")).toBeInTheDocument();
    });

    it("should display Peakbagger ID in view mode", () => {
      render(<ExternalPlatformsSection {...defaultProps} />);
      expect(screen.getByTestId("infofield-Peakbagger ID")).toBeInTheDocument();
    });

    it("should display Hill Bagging ID in view mode", () => {
      render(<ExternalPlatformsSection {...defaultProps} />);
      expect(
        screen.getByTestId("infofield-Hill Bagging ID")
      ).toBeInTheDocument();
    });

    it("should show 'Not set' for empty values", () => {
      const userWithoutIds: User = {
        ...mockUser,
        peakbaggerId: undefined,
        hillBaggingId: undefined,
      };
      render(
        <ExternalPlatformsSection {...defaultProps} user={userWithoutIds} />
      );

      const infoFields = screen.getAllByText("Not set");
      expect(infoFields.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Edit Mode", () => {
    const editProps = { ...defaultProps, isEditing: true };

    it("should render form inputs in edit mode", () => {
      render(<ExternalPlatformsSection {...editProps} />);

      expect(screen.getByTestId("input-Peakbagger ID")).toBeInTheDocument();
      expect(screen.getByTestId("input-Hill Bagging ID")).toBeInTheDocument();
    });

    it("should call onFormDataChange when Peakbagger ID changes", () => {
      const onFormDataChange = jest.fn();
      render(
        <ExternalPlatformsSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />
      );

      const input = screen.getByTestId("input-Peakbagger ID");
      fireEvent.change(input, { target: { value: "PB789" } });

      expect(onFormDataChange).toHaveBeenCalledWith({ peakbaggerId: "PB789" });
    });

    it("should call onFormDataChange when Hill Bagging ID changes", () => {
      const onFormDataChange = jest.fn();
      render(
        <ExternalPlatformsSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />
      );

      const input = screen.getByTestId("input-Hill Bagging ID");
      fireEvent.change(input, { target: { value: "HB999" } });

      expect(onFormDataChange).toHaveBeenCalledWith({ hillBaggingId: "HB999" });
    });

    it("should render checkboxes for link visibility", () => {
      render(<ExternalPlatformsSection {...editProps} />);

      expect(
        screen.getByText("Show Peakbagger link on profile")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Show Hill Bagging link on profile")
      ).toBeInTheDocument();
    });

    it("should toggle Peakbagger link visibility", () => {
      const onFormDataChange = jest.fn();
      render(
        <ExternalPlatformsSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />
      );

      const checkbox = screen.getByLabelText("Show Peakbagger link on profile");
      fireEvent.click(checkbox);

      expect(onFormDataChange).toHaveBeenCalledWith({
        showPeakbaggerLink: false,
      });
    });

    it("should toggle Hill Bagging link visibility", () => {
      const onFormDataChange = jest.fn();
      render(
        <ExternalPlatformsSection
          {...editProps}
          onFormDataChange={onFormDataChange}
        />
      );

      const checkbox = screen.getByLabelText(
        "Show Hill Bagging link on profile"
      );
      fireEvent.click(checkbox);

      expect(onFormDataChange).toHaveBeenCalledWith({
        showHillBaggingLink: true,
      });
    });

    it("should display correct checkbox states", () => {
      render(<ExternalPlatformsSection {...editProps} />);

      const peakbaggerCheckbox = screen.getByLabelText(
        "Show Peakbagger link on profile"
      ) as HTMLInputElement;
      const hillBaggingCheckbox = screen.getByLabelText(
        "Show Hill Bagging link on profile"
      ) as HTMLInputElement;

      expect(peakbaggerCheckbox.checked).toBe(true);
      expect(hillBaggingCheckbox.checked).toBe(false);
    });

    it("should have proper input placeholders", () => {
      render(<ExternalPlatformsSection {...editProps} />);

      const peakbaggerInput = screen.getByPlaceholderText(
        "Enter Peakbagger ID"
      );
      const hillBaggingInput = screen.getByPlaceholderText(
        "Enter Hill Bagging ID"
      );

      expect(peakbaggerInput).toBeInTheDocument();
      expect(hillBaggingInput).toBeInTheDocument();
    });

    it("should handle empty input values", () => {
      const formDataWithEmptyIds = {
        ...mockFormData,
        peakbaggerId: "",
        hillBaggingId: "",
      };

      render(
        <ExternalPlatformsSection
          {...editProps}
          formData={formDataWithEmptyIds}
        />
      );

      const peakbaggerInput = screen.getByTestId(
        "input-Peakbagger ID"
      ) as HTMLInputElement;
      const hillBaggingInput = screen.getByTestId(
        "input-Hill Bagging ID"
      ) as HTMLInputElement;

      expect(peakbaggerInput.value).toBe("");
      expect(hillBaggingInput.value).toBe("");
    });
  });

  describe("Layout", () => {
    it("should have proper grid layout in view mode", () => {
      const { container } = render(
        <ExternalPlatformsSection {...defaultProps} />
      );
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });

    it("should have proper spacing in edit mode", () => {
      const { container } = render(
        <ExternalPlatformsSection {...defaultProps} isEditing={true} />
      );
      const spacing = container.querySelector(".space-y-6");
      expect(spacing).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible checkboxes with labels", () => {
      render(<ExternalPlatformsSection {...defaultProps} isEditing={true} />);

      const peakbaggerLabel = screen.getByLabelText(
        "Show Peakbagger link on profile"
      );
      const hillBaggingLabel = screen.getByLabelText(
        "Show Hill Bagging link on profile"
      );

      expect(peakbaggerLabel).toBeInTheDocument();
      expect(hillBaggingLabel).toBeInTheDocument();
    });

    it("should render Card component", () => {
      render(<ExternalPlatformsSection {...defaultProps} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });
  });
});
