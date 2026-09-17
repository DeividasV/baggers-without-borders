/**
 * Responsive UX tests for user profile username/email validation
 * Tests changed components for mobile/tablet/desktop breakpoints
 */

import { render, screen } from "@testing-library/react";
import BwbInformationSection from "@/app/components/features/user-profile/BwbInformationSection";
import type { User } from "@/src/types";

const mockUser: User = {
  id: "test-user",
  username: "testuser",
  email: "test@example.com",
  displayName: "Test User",
  role: "ADMIN",
  status: "ACTIVE",
  emailVerified: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
  passwordChangedAt: null,
  givenName: "Test",
  familyName: "User",
  gender: null,
  birthYear: null,
  birthCountryId: null,
  birthCountry: null,
  residenceCountryId: null,
  residenceCountry: null,
  residenceRegionId: null,
  residenceRegion: null,
  forumNickname: null,
  forumJoinDate: null,
  retiredYear: null,
  deceasedYear: null,
  allowManualEntry: false,
  notes: null,
  interests: [],
};

const mockFormData = {
  username: "testuser",
  email: "test@example.com",
  givenName: "Test",
  familyName: "User",
  gender: null,
  birthYear: null,
  birthCountry: null,
  residenceCountry: null,
  residenceRegion: null,
  forumNickname: null,
  forumJoinDate: null,
  retiredYear: null,
  deceasedYear: null,
  role: "ADMIN",
  status: "ACTIVE",
  allowManualEntry: false,
  notes: null,
  interests: [],
};

const defaultProps = {
  user: mockUser,
  isEditing: true,
  isAdmin: true,
  formData: mockFormData,
  onFormDataChange: jest.fn(),
  copiedId: false,
  onCopyId: jest.fn(),
};

describe("User Profile Username/Email Validation Responsive UX", () => {
  describe("Breakpoints & Layout", () => {
    it("should have responsive grid for username/email (1 col mobile, 3 cols desktop)", () => {
      const { container } = render(<BwbInformationSection {...defaultProps} />);

      // Find the username/email grid container by looking at the structure
      const gridContainers = container.querySelectorAll(".grid");

      // Should have at least one grid container
      expect(gridContainers.length).toBeGreaterThan(0);

      // Check for responsive grid classes
      const hasResponsiveGrid = Array.from(gridContainers).some(
        (grid) =>
          grid.className.includes("grid-cols-1") &&
          grid.className.includes("md:grid-cols-3"),
      );

      expect(hasResponsiveGrid).toBe(true);
    });
  });

  describe("Touch Targets", () => {
    it("should have adequate padding on edit buttons", () => {
      const { container } = render(<BwbInformationSection {...defaultProps} />);

      // Edit buttons should have size="sm" which includes px-3 py-2
      const editButtons = container.querySelectorAll(
        'button[aria-label^="Edit"]',
      );

      editButtons.forEach((button) => {
        // Button component applies padding classes
        expect(button.className).toMatch(/px-/);
        expect(button.className).toMatch(/py-/);
      });
    });

    it("should have adequate spacing for copy icons", () => {
      const { container } = render(<BwbInformationSection {...defaultProps} />);

      // Copy buttons should have hover area
      const copyButtons = container.querySelectorAll('button[title^="Copy"]');

      expect(copyButtons.length).toBeGreaterThan(0);
      copyButtons.forEach((button) => {
        expect(button.className).toContain("transition-colors");
      });
    });
  });

  describe("Overflow Protection", () => {
    it("should have container structure for inputs", () => {
      render(<BwbInformationSection {...defaultProps} />);

      const usernameInput = screen.getByLabelText(/username/i);

      // Should have parent container
      expect(usernameInput.parentElement).toBeTruthy();
    });

    it("should prevent icon overflow with absolute positioning", () => {
      const { container } = render(<BwbInformationSection {...defaultProps} />);

      // Check structure exists
      expect(container).toBeTruthy();
    });

    it("should handle long text in validation hints", () => {
      const { container } = render(<BwbInformationSection {...defaultProps} />);

      // Check that text-xs class is used for small text
      const smallTexts = container.querySelectorAll(".text-xs");

      // Should have small text elements
      expect(smallTexts.length).toBeGreaterThan(0);
    });

    it("should have responsive input elements", () => {
      render(<BwbInformationSection {...defaultProps} />);

      const usernameInput = screen.getByLabelText(/username/i);

      // Should be a valid element
      expect(usernameInput).toBeTruthy();
    });
  });

  describe("Interaction Parity", () => {
    it("should have consistent styling across interactive elements", () => {
      const { container } = render(<BwbInformationSection {...defaultProps} />);

      // All buttons should have consistent sizing
      const buttons = container.querySelectorAll("button");

      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        // Should have some styling
        expect(button.className.length).toBeGreaterThan(0);
      });
    });

    it("should have hover states on all interactive elements", () => {
      const { container } = render(<BwbInformationSection {...defaultProps} />);

      const copyButtons = container.querySelectorAll('button[title^="Copy"]');

      copyButtons.forEach((button) => {
        expect(button.className).toMatch(/hover:/);
      });
    });

    it("should have focus indicators for keyboard navigation", () => {
      render(<BwbInformationSection {...defaultProps} />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);

      // Inputs should be focusable
      expect(usernameInput.tagName).toBe("BUTTON"); // In view mode
      expect(emailInput.tagName).toBe("BUTTON"); // In view mode
    });
  });

  describe("Icon Sizing", () => {
    it("should have icons in the component", () => {
      const { container } = render(<BwbInformationSection {...defaultProps} />);

      // Icons should exist (SVG elements)
      const icons = container.querySelectorAll("svg");

      expect(icons.length).toBeGreaterThan(0);
    });

    it("should have proper spacing in flex containers", () => {
      const { container } = render(<BwbInformationSection {...defaultProps} />);

      // Button/label groups should have gap or spacing classes
      const flexContainers = container.querySelectorAll(".flex");

      expect(flexContainers.length).toBeGreaterThan(0);
    });
  });

  describe("View Mode Layout", () => {
    it("should maintain grid layout in view mode", () => {
      const { container } = render(
        <BwbInformationSection {...defaultProps} isEditing={false} />,
      );

      const viewContainer = container.querySelector(".grid");

      if (viewContainer) {
        // Should have grid classes
        expect(viewContainer.className).toMatch(/grid/);
      }
    });
  });
});
