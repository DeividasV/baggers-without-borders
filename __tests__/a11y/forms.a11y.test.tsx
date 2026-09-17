/**
 * Accessibility tests for form components
 * Tests form components for WCAG compliance
 */

import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import LoginForm from "@/app/components/ui/LoginForm";
import RegisterForm from "@/app/components/features/auth/RegisterForm";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  useSession: jest.fn(() => ({ data: null, status: "unauthenticated" })),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe("Form Components Accessibility", () => {
  describe("LoginForm", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<LoginForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have accessible form labels", () => {
      const { container } = render(<LoginForm />);
      const usernameInput = container.querySelector("#username");
      const passwordInput = container.querySelector("#password");
      expect(usernameInput).toHaveAttribute("id", "username");
      expect(passwordInput).toHaveAttribute("id", "password");
      // Check that labels are associated
      const usernameLabel = container.querySelector('label[for="username"]');
      const passwordLabel = container.querySelector('label[for="password"]');
      expect(usernameLabel).toBeInTheDocument();
      expect(passwordLabel).toBeInTheDocument();
    });

    it("should have accessible password toggle button", () => {
      const { getByLabelText } = render(<LoginForm />);
      const toggleButton = getByLabelText(/show password/i);
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton.tagName).toBe("BUTTON");
    });
  });

  describe("RegisterForm", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<RegisterForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have accessible form labels", () => {
      const { getByLabelText } = render(<RegisterForm />);
      expect(getByLabelText(/email/i)).toBeInTheDocument();
      expect(getByLabelText(/display name/i)).toBeInTheDocument();
    });

    it("should mark required fields appropriately", () => {
      const { container } = render(<RegisterForm />);
      const requiredIndicators = container.querySelectorAll(".text-red-400");
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });
  });
});
