/**
 * HOF Member Expanded Details - Inline Editing Tests
 * Tests for inline editing functionality in HofMemberExpandedDetails component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HofMemberExpandedDetails from "@/app/components/features/hof-tables/HofMemberExpandedDetails";

// Mock utils
jest.mock("@/src/lib/utils", () => ({
  formatNumber: (num: number | null | undefined) => {
    if (num === null || num === undefined) return "0";
    return num.toLocaleString();
  },
}));

// Mock hofTierUtils
jest.mock("@/src/lib/hofTierUtils", () => ({
  getTierTextColor: (name: string) => {
    const colors: Record<string, string> = {
      Gold: "text-yellow-400",
      Silver: "text-gray-300",
      Bronze: "text-orange-400",
    };
    return colors[name] || "text-gray-400";
  },
  getTierBgColor: (name: string) => {
    const colors: Record<string, string> = {
      Gold: "border-yellow-600/30 bg-yellow-900/20",
      Silver: "border-gray-600/30 bg-gray-900/20",
      Bronze: "border-orange-600/30 bg-orange-900/20",
    };
    return colors[name] || "border-gray-600/30 bg-gray-900/20";
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe("HofMemberExpandedDetails - Inline Editing", () => {
  const mockMemberData = {
    member: {
      id: "m1",
      username: "user1",
      displayName: "John Climber",
      status: "ACTIVE",
      retiredYear: null,
      deceasedYear: null,
    },
    totalPeaks: 250,
    peaksInYear: 20,
    foreignPeaks: 100,
    foreignPeaksInYear: 5,
    fpr: 40.0,
    isNewEntrant: false,
    isFirstTimeAward: false,
    awardTierName: "Silver",
    hasLce: false,
    lceCountryId: null,
    firstQualificationYear: "2020",
    dataNotProvided: false,
    entryId: "entry-123",
  };

  const defaultProps = {
    memberData: mockMemberData,
    yearLabel: "2024",
    yearId: "year-2024",
    hofLabel: "BWB",
    hofId: "hof-bwb",
    isAdmin: true,
    onEditStart: jest.fn(),
    onCancel: jest.fn(),
    onSave: jest.fn(),
    isEditing: false,
    isSaving: false,
    showSuccess: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Edit Button Display", () => {
    it("should show Edit Data button when admin and not editing", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      expect(screen.getByText("Edit Data")).toBeInTheDocument();
    });

    it("should not show Edit Data button when not admin", () => {
      render(<HofMemberExpandedDetails {...defaultProps} isAdmin={false} />);
      expect(screen.queryByText("Edit Data")).not.toBeInTheDocument();
    });

    it("should not show Edit Data button when entryId is missing", () => {
      const dataWithoutEntry = { ...mockMemberData, entryId: undefined };
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          memberData={dataWithoutEntry}
        />
      );
      expect(screen.queryByText("Edit Data")).not.toBeInTheDocument();
    });

    it("should call onEditStart when Edit Data button clicked", () => {
      render(<HofMemberExpandedDetails {...defaultProps} />);
      const editButton = screen.getByText("Edit Data");
      fireEvent.click(editButton);
      expect(defaultProps.onEditStart).toHaveBeenCalledTimes(1);
    });
  });

  describe("Inline Editing UI", () => {
    const editingProps = {
      ...defaultProps,
      isEditing: true,
    };

    it("should show input fields when editing", () => {
      render(<HofMemberExpandedDetails {...editingProps} />);
      expect(
        screen.getByLabelText(`Peaks in ${editingProps.yearLabel}`)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(`Foreign Peaks in ${editingProps.yearLabel}`)
      ).toBeInTheDocument();
    });

    it("should populate inputs with current values", () => {
      render(<HofMemberExpandedDetails {...editingProps} />);
      const peaksInput = screen.getByLabelText(
        `Peaks in ${editingProps.yearLabel}`
      ) as HTMLInputElement;
      const foreignPeaksInput = screen.getByLabelText(
        `Foreign Peaks in ${editingProps.yearLabel}`
      ) as HTMLInputElement;

      expect(peaksInput.value).toBe("20");
      expect(foreignPeaksInput.value).toBe("5");
    });

    it("should show Save and Cancel buttons when editing", () => {
      render(<HofMemberExpandedDetails {...editingProps} />);
      expect(screen.getByText("Save")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should call onCancel when Cancel button clicked", () => {
      render(<HofMemberExpandedDetails {...editingProps} />);
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Real-time Statistics Updates", () => {
    const editingProps = {
      ...defaultProps,
      isEditing: true,
    };

    it("should update Total Peaks in real-time as user types", async () => {
      const user = userEvent.setup();
      render(<HofMemberExpandedDetails {...editingProps} />);

      const peaksInput = screen.getByLabelText(
        `Peaks in ${editingProps.yearLabel}`
      );

      // Clear and type new value
      await user.clear(peaksInput);
      await user.type(peaksInput, "25");

      // Total Peaks should update from 250 to 255 (230 + 25)
      await waitFor(() => {
        // Look for the updated total in the statistics
        const totalPeaksDisplay = screen.getAllByText(/255/);
        expect(totalPeaksDisplay.length).toBeGreaterThan(0);
      });
    });

    it("should update Foreign Peaks in real-time as user types", async () => {
      const user = userEvent.setup();
      render(<HofMemberExpandedDetails {...editingProps} />);

      const foreignPeaksInput = screen.getByLabelText(
        `Foreign Peaks in ${editingProps.yearLabel}`
      );

      // Clear and type new value
      await user.clear(foreignPeaksInput);
      await user.type(foreignPeaksInput, "10");

      // Total Foreign should update from 100 to 105 (95 + 10)
      await waitFor(() => {
        const totalForeignDisplay = screen.getAllByText(/105/);
        expect(totalForeignDisplay.length).toBeGreaterThan(0);
      });
    });

    it("should update FPR in real-time based on new values", async () => {
      const user = userEvent.setup();
      render(<HofMemberExpandedDetails {...editingProps} />);

      const peaksInput = screen.getByLabelText(
        `Peaks in ${editingProps.yearLabel}`
      );
      const foreignPeaksInput = screen.getByLabelText(
        `Foreign Peaks in ${editingProps.yearLabel}`
      );

      // Set peaks to 30 and foreign to 15
      await user.clear(peaksInput);
      await user.type(peaksInput, "30");
      await user.clear(foreignPeaksInput);
      await user.type(foreignPeaksInput, "15");

      // Total: 260, Total Foreign: 110, FPR: 110/260 = 42.3%
      await waitFor(() => {
        const fprDisplay = screen.getAllByText(/42\.3%/);
        expect(fprDisplay.length).toBeGreaterThan(0);
      });
    });

    it("should highlight updated statistics in green when editing", () => {
      const { container } = render(
        <HofMemberExpandedDetails {...editingProps} />
      );
      const greenText = container.querySelectorAll(".text-primary-300");
      // Should have multiple green-highlighted statistics
      expect(greenText.length).toBeGreaterThan(0);
    });
  });

  describe("Validation", () => {
    const editingProps = {
      ...defaultProps,
      isEditing: true,
    };

    it("should show error when peaks value is negative", async () => {
      const user = userEvent.setup();
      render(<HofMemberExpandedDetails {...editingProps} />);

      const peaksInput = screen.getByLabelText(
        `Peaks in ${editingProps.yearLabel}`
      );
      await user.clear(peaksInput);
      await user.type(peaksInput, "-5");

      await waitFor(() => {
        expect(screen.getByText("Must be 0 or greater")).toBeInTheDocument();
      });
    });

    it("should show error when foreign peaks is negative", async () => {
      const user = userEvent.setup();
      render(<HofMemberExpandedDetails {...editingProps} />);

      const foreignPeaksInput = screen.getByLabelText(
        `Foreign Peaks in ${editingProps.yearLabel}`
      );
      await user.clear(foreignPeaksInput);
      await user.type(foreignPeaksInput, "-3");

      await waitFor(() => {
        expect(screen.getByText("Must be 0 or greater")).toBeInTheDocument();
      });
    });

    it("should show error when foreign peaks exceeds total peaks", async () => {
      const user = userEvent.setup();
      render(<HofMemberExpandedDetails {...editingProps} />);

      const peaksInput = screen.getByLabelText(
        `Peaks in ${editingProps.yearLabel}`
      );
      const foreignPeaksInput = screen.getByLabelText(
        `Foreign Peaks in ${editingProps.yearLabel}`
      );

      await user.clear(peaksInput);
      await user.type(peaksInput, "10");
      await user.clear(foreignPeaksInput);
      await user.type(foreignPeaksInput, "15");

      await waitFor(() => {
        expect(
          screen.getByText(/Cannot exceed total peaks \(max: 240\)/)
        ).toBeInTheDocument();
      });
    });

    it("should disable Save button when validation errors exist", async () => {
      const user = userEvent.setup();
      render(<HofMemberExpandedDetails {...editingProps} />);

      const peaksInput = screen.getByLabelText(
        `Peaks in ${editingProps.yearLabel}`
      );
      await user.clear(peaksInput);
      await user.type(peaksInput, "-5");

      await waitFor(() => {
        const saveButton = screen.getByText("Save");
        expect(saveButton).toBeDisabled();
      });
    });

    it("should accept zero values", async () => {
      const user = userEvent.setup();
      render(<HofMemberExpandedDetails {...editingProps} />);

      const peaksInput = screen.getByLabelText(
        `Peaks in ${editingProps.yearLabel}`
      );
      const foreignPeaksInput = screen.getByLabelText(
        `Foreign Peaks in ${editingProps.yearLabel}`
      );

      await user.clear(peaksInput);
      await user.type(peaksInput, "0");
      await user.clear(foreignPeaksInput);
      await user.type(foreignPeaksInput, "0");

      await waitFor(() => {
        expect(
          screen.queryByText("Must be 0 or greater")
        ).not.toBeInTheDocument();
        const saveButton = screen.getByText("Save");
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe("Success Animation", () => {
    it("should show success checkmark when showSuccess is true", () => {
      render(<HofMemberExpandedDetails {...defaultProps} showSuccess={true} />);
      const successMessage = screen.getByText("Updated");
      expect(successMessage).toBeInTheDocument();
    });

    it("should have dark background with primary checkmark", () => {
      const { container } = render(
        <HofMemberExpandedDetails {...defaultProps} showSuccess={true} />
      );
      const successDiv = container.querySelector(".bg-dark-800");
      expect(successDiv).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should disable Save button when saving", () => {
      render(
        <HofMemberExpandedDetails
          {...defaultProps}
          isEditing={true}
          isSaving={true}
        />
      );
      const saveButton = screen.getByText("Save");
      expect(saveButton).toBeDisabled();
    });

    it("should disable Edit Data button when saving", () => {
      render(<HofMemberExpandedDetails {...defaultProps} isSaving={true} />);
      const editButton = screen.getByText("Edit Data");
      expect(editButton).toBeDisabled();
    });
  });

  describe("Responsive Layout", () => {
    it("should render with mobile-first flex column layout", () => {
      const { container } = render(
        <HofMemberExpandedDetails {...defaultProps} isEditing={true} />
      );
      const editingContainer = container.querySelector(".flex-col");
      expect(editingContainer).toBeInTheDocument();
    });

    it("should have responsive breakpoint classes", () => {
      const { container } = render(
        <HofMemberExpandedDetails {...defaultProps} isEditing={true} />
      );
      const editingContainer = container.querySelector(".md\\:flex-row");
      expect(editingContainer).toBeInTheDocument();
    });
  });
});
