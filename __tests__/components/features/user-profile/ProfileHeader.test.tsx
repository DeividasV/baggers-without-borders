import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileHeader from "@/app/components/features/user-profile/ProfileHeader";
import type { User } from "@/src/types";

const mockUser: User = {
  id: "1",
  username: "johndoe",
  displayName: "John Doe",
  role: "USER",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("ProfileHeader Component", () => {
  const defaultProps = {
    user: mockUser,
    isEditing: false,
    saving: false,
    onEdit: jest.fn(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("User Information Display", () => {
    it("should render user display name", () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should render username with @ prefix", () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByText("@johndoe")).toBeInTheDocument();
    });

    it("should truncate long display names", () => {
      const longNameUser = { ...mockUser, displayName: "A".repeat(100) };
      const { container } = render(
        <ProfileHeader {...defaultProps} user={longNameUser} />,
      );
      const heading = container.querySelector("h2.truncate");
      expect(heading).toBeInTheDocument();
    });

    it("should truncate long usernames", () => {
      const longUsernameUser = { ...mockUser, username: "a".repeat(100) };
      const { container } = render(
        <ProfileHeader {...defaultProps} user={longUsernameUser} />,
      );
      const username = container.querySelector("p.truncate");
      expect(username).toBeInTheDocument();
    });
  });

  describe("View Mode - Not Editing", () => {
    it("should show Back to List button", () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByText("Back to List")).toBeInTheDocument();
    });

    it("should show Edit button", () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("should not show Save button", () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.queryByText("Save")).not.toBeInTheDocument();
    });

    it("should not show Cancel button", () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    });

    it("should call onBack when Back to List clicked", () => {
      const onBack = jest.fn();
      render(<ProfileHeader {...defaultProps} onBack={onBack} />);
      fireEvent.click(screen.getByText("Back to List"));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("should call onEdit when Edit clicked", () => {
      const onEdit = jest.fn();
      render(<ProfileHeader {...defaultProps} onEdit={onEdit} />);
      fireEvent.click(screen.getByText("Edit"));
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edit Mode - Editing", () => {
    const editingProps = { ...defaultProps, isEditing: true };

    it("should show Cancel button", () => {
      render(<ProfileHeader {...editingProps} />);
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should show Save button", () => {
      render(<ProfileHeader {...editingProps} />);
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("should not show Back to List button", () => {
      render(<ProfileHeader {...editingProps} />);
      expect(screen.queryByText("Back to List")).not.toBeInTheDocument();
    });

    it("should not show Edit button", () => {
      render(<ProfileHeader {...editingProps} />);
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });

    it("should call onCancel when Cancel clicked", () => {
      const onCancel = jest.fn();
      render(<ProfileHeader {...editingProps} onCancel={onCancel} />);
      fireEvent.click(screen.getByText("Cancel"));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("should call onSave when Save clicked", () => {
      const onSave = jest.fn();
      render(<ProfileHeader {...editingProps} onSave={onSave} />);
      fireEvent.click(screen.getByText("Save"));
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe("Saving State", () => {
    const savingProps = { ...defaultProps, isEditing: true, saving: true };

    it('should show "Saving..." text when saving', () => {
      render(<ProfileHeader {...savingProps} />);
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should disable Cancel button when saving", () => {
      render(<ProfileHeader {...savingProps} />);
      const cancelButton = screen.getByText("Cancel").closest("button");
      expect(cancelButton).toBeDisabled();
    });

    it("should disable Save button when saving", () => {
      render(<ProfileHeader {...savingProps} />);
      const saveButton = screen.getByText("Saving...").closest("button");
      expect(saveButton).toBeDisabled();
    });

    it("should not call onCancel when Cancel clicked while saving", () => {
      const onCancel = jest.fn();
      render(<ProfileHeader {...savingProps} onCancel={onCancel} />);
      const cancelButton = screen.getByText("Cancel").closest("button");
      fireEvent.click(cancelButton!);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("should not call onSave when Save clicked while saving", () => {
      const onSave = jest.fn();
      render(<ProfileHeader {...savingProps} onSave={onSave} />);
      const saveButton = screen.getByText("Saving...").closest("button");
      fireEvent.click(saveButton!);
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Button Styling", () => {
    it("should apply secondary styling to Back button", () => {
      render(<ProfileHeader {...defaultProps} />);
      const backButton = screen.getByText("Back to List").closest("button");
      expect(backButton).toHaveClass("bg-dark-700");
    });

    it("should apply primary styling to Edit button", () => {
      render(<ProfileHeader {...defaultProps} />);
      const editButton = screen.getByText("Edit").closest("button");
      expect(editButton).toHaveClass("bg-primary-600");
    });

    it("should apply small size styling to all buttons", () => {
      render(<ProfileHeader {...defaultProps} />);
      const backButton = screen.getByText("Back to List").closest("button");
      const editButton = screen.getByText("Edit").closest("button");
      expect(backButton).toHaveClass("px-3", "py-2", "text-sm");
      expect(editButton).toHaveClass("px-3", "py-2", "text-sm");
    });
  });

  describe("Layout and Responsiveness", () => {
    it("should use flexbox layout", () => {
      const { container } = render(<ProfileHeader {...defaultProps} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass("flex");
    });

    it("should have responsive flex direction", () => {
      const { container } = render(<ProfileHeader {...defaultProps} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass("flex-col", "sm:flex-row");
    });

    it("should have proper gap spacing", () => {
      const { container } = render(<ProfileHeader {...defaultProps} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass("gap-4");
    });

    it("should have responsive text size for display name", () => {
      const { container } = render(<ProfileHeader {...defaultProps} />);
      const heading = container.querySelector("h2");
      expect(heading).toHaveClass("text-xl", "sm:text-2xl");
    });
  });

  describe("Typography", () => {
    it("should apply primary color to display name", () => {
      const { container } = render(<ProfileHeader {...defaultProps} />);
      const heading = container.querySelector("h2");
      expect(heading).toHaveClass("text-primary-400");
    });

    it("should apply bold font to display name", () => {
      const { container } = render(<ProfileHeader {...defaultProps} />);
      const heading = container.querySelector("h2");
      expect(heading).toHaveClass("font-bold");
    });

    it("should apply gray color to username", () => {
      const { container } = render(<ProfileHeader {...defaultProps} />);
      const username = container.querySelector("p");
      expect(username).toHaveClass("text-gray-400");
    });

    it("should apply small text size to username", () => {
      const { container } = render(<ProfileHeader {...defaultProps} />);
      const username = container.querySelector("p");
      expect(username).toHaveClass("text-sm");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty display name", () => {
      const emptyNameUser = { ...mockUser, displayName: "" };
      render(<ProfileHeader {...defaultProps} user={emptyNameUser} />);
      expect(screen.getByRole("heading")).toHaveTextContent("");
    });

    it("should handle special characters in display name", () => {
      const specialUser = {
        ...mockUser,
        displayName: 'John "The Rock" Doe <test>',
      };
      render(<ProfileHeader {...defaultProps} user={specialUser} />);
      expect(
        screen.getByText('John "The Rock" Doe <test>'),
      ).toBeInTheDocument();
    });

    it("should handle special characters in username", () => {
      const specialUser = { ...mockUser, username: "user_name-123" };
      render(<ProfileHeader {...defaultProps} user={specialUser} />);
      expect(screen.getByText("@user_name-123")).toBeInTheDocument();
    });

    it("should handle multiple rapid button clicks", () => {
      const onEdit = jest.fn();
      render(<ProfileHeader {...defaultProps} onEdit={onEdit} />);
      const editButton = screen.getByText("Edit");

      fireEvent.click(editButton);
      fireEvent.click(editButton);
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(3);
    });

    it("should handle transition between edit modes", () => {
      const { rerender } = render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByText("Edit")).toBeInTheDocument();

      rerender(<ProfileHeader {...defaultProps} isEditing={true} />);
      expect(screen.getByText("Save")).toBeInTheDocument();
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });
  });
});
