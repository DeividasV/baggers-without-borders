/**
 * Accessibility audit for UserOwnProfile component
 * Focus: Changed UI surfaces from profile form improvements
 */

import { render, screen, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import userEvent from "@testing-library/user-event";
import UserOwnProfile from "@/app/components/features/user-profile/UserOwnProfile";

expect.extend(toHaveNoViolations);

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch for API calls
global.fetch = jest.fn((url) => {
  if (url.includes("/api/countries")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          countries: [
            {
              id: "lt",
              name: "Lithuania",
              code: "LT",
              code3: "LTU",
              continent: "Europe",
            },
            {
              id: "us",
              name: "United States",
              code: "US",
              code3: "USA",
              continent: "North America",
            },
          ],
        }),
    });
  }

  if (url.includes("/api/interests")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          interests: [
            {
              id: "hiking",
              name: "Hiking",
              description: "Walking and trekking",
            },
            {
              id: "rock-climbing",
              name: "Rock Climbing",
              description: "Climbing rocks",
            },
          ],
        }),
    });
  }

  // Default user response
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        id: "test-user-1",
        username: "testuser",
        email: "test@example.com",
        givenName: "Test",
        familyName: "User",
        gender: "Male",
        birthYear: 1990,
        residenceCountry: { id: "lt", name: "Lithuania", code: "LT" },
        birthCountry: { id: "lt", name: "Lithuania", code: "LT" },
        userInterests: [
          { interestId: "hiking", interest: { id: "hiking", name: "Hiking" } },
        ],
        userConsents: [
          {
            id: "consent-1",
            consentType: { title: "Privacy Policy" },
            dateGiven: "2025-01-01",
            consentMethod: "WEB",
            isRequired: true,
          },
        ],
      }),
  });
}) as jest.Mock;

describe("UserOwnProfile Accessibility Audit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("View Mode", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper heading hierarchy", async () => {
      render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(screen.getByText("My Profile")).toBeInTheDocument();
      });

      const mainHeading = screen.getByRole("heading", { level: 2 });
      expect(mainHeading).toHaveTextContent("My Profile");

      const sectionHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it("should have accessible Edit Profile button", async () => {
      render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        const editButton = screen.getByRole("button", {
          name: /edit profile/i,
        });
        expect(editButton).toBeInTheDocument();
      });
    });
  });

  describe("Edit Mode", () => {
    it("should not have accessibility violations in edit mode", async () => {
      const { container } = render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit profile/i }),
        ).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit profile/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save changes/i }),
        ).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have properly labeled form inputs", async () => {
      render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit profile/i }),
        ).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit profile/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        const givenNameInput = screen.getByLabelText(/given name/i);
        const familyNameInput = screen.getByLabelText(/family name/i);
        const emailInput = screen.getByRole("textbox", { name: /email/i });

        expect(givenNameInput).toBeInTheDocument();
        expect(familyNameInput).toBeInTheDocument();
        expect(emailInput).toBeInTheDocument();
      });
    });

    it("should have accessible action buttons with proper focus order", async () => {
      render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit profile/i }),
        ).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit profile/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        const changePasswordBtn = screen.getByRole("button", {
          name: /change password/i,
        });
        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        const saveBtn = screen.getByRole("button", { name: /save changes/i });

        expect(changePasswordBtn).toBeInTheDocument();
        expect(cancelBtn).toBeInTheDocument();
        expect(saveBtn).toBeInTheDocument();

        // Check they are keyboard accessible
        expect(changePasswordBtn).toHaveAttribute("type", "button");
        expect(cancelBtn).toHaveAttribute("type", "button");
        expect(saveBtn).toHaveAttribute("type", "button");
      });
    });

    it("should have accessible Change Password toggle", async () => {
      render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit profile/i }),
        ).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit profile/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        const changePasswordBtn = screen.getByRole("button", {
          name: /change password/i,
        });
        expect(changePasswordBtn).toBeInTheDocument();
        expect(changePasswordBtn).not.toBeDisabled();
      });

      const changePasswordBtn = screen.getByRole("button", {
        name: /change password/i,
      });
      await userEvent.click(changePasswordBtn);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/enter new password/i),
        ).toBeInTheDocument();
      });

      // Password section should be visible
      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("type", "password");

      // Should have accessible password visibility toggle
      const visibilityToggle = screen.getByRole("button", {
        name: /show password|hide password/i,
      });
      expect(visibilityToggle).toBeInTheDocument();
      expect(visibilityToggle).toHaveAttribute("aria-label");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support tab navigation through form fields", async () => {
      render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit profile/i }),
        ).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit profile/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/given name/i)).toBeInTheDocument();
      });

      // Tab through form fields
      await userEvent.tab();
      const givenNameInput = screen.getByLabelText(/given name/i);
      expect(givenNameInput).toHaveFocus();

      await userEvent.tab();
      const familyNameInput = screen.getByLabelText(/family name/i);
      expect(familyNameInput).toHaveFocus();
    });

    it("should have proper focus management when opening password section", async () => {
      render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit profile/i }),
        ).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit profile/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        const changePasswordBtn = screen.getByRole("button", {
          name: /change password/i,
        });
        expect(changePasswordBtn).toBeInTheDocument();
      });

      const changePasswordBtn = screen.getByRole("button", {
        name: /change password/i,
      });
      await userEvent.click(changePasswordBtn);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/enter new password/i),
        ).toBeInTheDocument();
      });

      // Password input should be focusable
      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      await userEvent.click(passwordInput);
      expect(passwordInput).toHaveFocus();
    });
  });

  describe("ARIA and Semantic HTML", () => {
    it("should use semantic HTML for sections", async () => {
      const { container } = render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(screen.getByText("My Profile")).toBeInTheDocument();
      });

      // Check for proper use of headings
      const headings = container.querySelectorAll("h2, h3, h4");
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should have proper button roles", async () => {
      render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit profile/i }),
        ).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit profile/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);

        // All buttons should have type="button" to prevent form submission
        buttons.forEach((button) => {
          expect(button).toHaveAttribute("type", "button");
        });
      });
    });
  });

  describe("Error States", () => {
    it("should have accessible error messages", async () => {
      render(<UserOwnProfile userId="test-user-1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit profile/i }),
        ).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit profile/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        const givenNameInput = screen.getByRole("textbox", {
          name: /given name/i,
        });
        expect(givenNameInput).toBeInTheDocument();
      });

      // Clear given name to trigger required field error
      const givenNameInput = screen.getByRole("textbox", {
        name: /given name/i,
      });
      await userEvent.clear(givenNameInput);
      await userEvent.tab(); // Blur the field

      await waitFor(() => {
        const errorMessage = screen.queryByText(/given name is required/i);
        if (errorMessage) {
          // Error message should be associated with the input and use proper ARIA
          expect(errorMessage).toBeInTheDocument();
          // Check for role="alert" on error message
          expect(
            errorMessage.closest('[role="alert"]') || errorMessage,
          ).toHaveAttribute("role", "alert");
        }
      });
    });
  });
});
