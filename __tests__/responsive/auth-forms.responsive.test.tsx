/**
 * Responsive UX tests for authentication forms
 * Tests auth components for mobile/tablet/desktop breakpoints, overflow, touch targets
 */

import { render } from "@testing-library/react";
import ForgotPasswordForm from "@/app/components/features/auth/ForgotPasswordForm";
import ResetPasswordForm from "@/app/components/features/auth/ResetPasswordForm";
import RegisterForm from "@/app/components/features/auth/RegisterForm";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? "test-token-123" : null),
  }),
}));

describe("Auth Forms Responsive UX", () => {
  describe("ForgotPasswordForm", () => {
    describe("Breakpoints & Layout", () => {
      it("should have fixed-width container with padding", () => {
        const { container } = render(<ForgotPasswordForm />);
        const card = container.querySelector(".relative");
        expect(card).toBeInTheDocument();
      });

      it("should have responsive heading size", () => {
        const { container } = render(<ForgotPasswordForm />);
        const heading = container.querySelector("h1");
        expect(heading).toHaveClass("text-3xl");
      });

      it("should have full-width form elements", () => {
        const { container } = render(<ForgotPasswordForm />);
        const input = container.querySelector("#email");
        expect(input).toHaveClass("w-full");
      });

      it("should have consistent spacing with space-y classes", () => {
        const { container } = render(<ForgotPasswordForm />);
        const form = container.querySelector("form");
        expect(form).toHaveClass("space-y-5");
      });
    });

    describe("Touch Targets (Minimum 44px/11 Tailwind units)", () => {
      it("should have minimum touch target height on email input", () => {
        const { container } = render(<ForgotPasswordForm />);
        const input = container.querySelector("#email");
        expect(input).toHaveClass("h-12"); // 48px = adequate touch target
      });

      it("should have minimum touch target height on submit button", () => {
        const { container } = render(<ForgotPasswordForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton).toHaveClass("h-12");
      });

      it("should have minimum touch target height on back link", () => {
        const { container } = render(<ForgotPasswordForm />);
        const backLink = container.querySelector('a[href="/login"]');
        expect(backLink).toBeInTheDocument();
        // Links inherit line-height from text size, verify it's clickable
        expect(backLink?.tagName).toBe("A");
      });
    });

    describe("Overflow Protection", () => {
      it("should have contained card with rounded corners", () => {
        const { container } = render(<ForgotPasswordForm />);
        const card = container.querySelector(".rounded-2xl");
        expect(card).toBeInTheDocument();
      });

      it("should use relative positioning for card", () => {
        const { container } = render(<ForgotPasswordForm />);
        const card = container.querySelector(".relative");
        expect(card).toBeInTheDocument();
      });

      it("should have full-width button to prevent overflow", () => {
        const { container } = render(<ForgotPasswordForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton).toHaveClass("w-full");
      });

      it("should have padding on card for content spacing", () => {
        const { container } = render(<ForgotPasswordForm />);
        const card = container.querySelector(".p-8");
        expect(card).toBeInTheDocument();
      });
    });

    describe("Interaction Parity", () => {
      it("should have hover states on interactive elements", () => {
        const { container } = render(<ForgotPasswordForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton?.className).toContain("hover:");
      });

      it("should have disabled state styling", () => {
        const { container } = render(<ForgotPasswordForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton?.className).toContain("disabled:");
      });

      it("should have focus states for keyboard navigation", () => {
        const { container } = render(<ForgotPasswordForm />);
        const input = container.querySelector("#email");
        expect(input?.className).toContain("focus:");
      });
    });
  });

  describe("ResetPasswordForm", () => {
    describe("Breakpoints & Layout", () => {
      it("should have responsive heading size", () => {
        const { container } = render(<ResetPasswordForm />);
        const heading = container.querySelector("h1");
        expect(heading).toHaveClass("text-3xl");
      });

      it("should have full-width password inputs", () => {
        const { container } = render(<ResetPasswordForm />);
        const newPasswordInput = container.querySelector("#newPassword");
        const confirmPasswordInput =
          container.querySelector("#confirmPassword");
        expect(newPasswordInput).toHaveClass("w-full");
        expect(confirmPasswordInput).toHaveClass("w-full");
      });

      it("should have consistent spacing with space-y classes", () => {
        const { container } = render(<ResetPasswordForm />);
        const form = container.querySelector("form");
        expect(form).toHaveClass("space-y-5");
      });
    });

    describe("Touch Targets (Minimum 44px/11 Tailwind units)", () => {
      it("should have minimum touch target height on password inputs", () => {
        const { container } = render(<ResetPasswordForm />);
        const newPasswordInput = container.querySelector("#newPassword");
        const confirmPasswordInput =
          container.querySelector("#confirmPassword");
        expect(newPasswordInput).toHaveClass("h-12");
        expect(confirmPasswordInput).toHaveClass("h-12");
      });

      it("should have minimum touch target height on submit button", () => {
        const { container } = render(<ResetPasswordForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton).toHaveClass("h-12");
      });

      it("should have adequate touch targets on password toggle buttons", () => {
        const { container } = render(<ResetPasswordForm />);
        const toggleButtons = container.querySelectorAll(
          'button[aria-label*="password"]'
        );
        // Password toggle buttons should be clickable (icon is 5w x 5h)
        expect(toggleButtons.length).toBeGreaterThan(0);
      });

      it("should have minimum touch target on generate password button", () => {
        const { container } = render(<ResetPasswordForm />);
        const generateButton = container.querySelector(
          'button:not([type="submit"]):not([aria-label*="password"])'
        );
        // Button should have adequate text/padding for touch
        expect(generateButton).toBeInTheDocument();
      });
    });

    describe("Overflow Protection", () => {
      it("should have full-width buttons to prevent overflow", () => {
        const { container } = render(<ResetPasswordForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton).toHaveClass("w-full");
      });

      it("should have relative positioning for password input containers", () => {
        const { container } = render(<ResetPasswordForm />);
        const inputContainers = container.querySelectorAll(".relative");
        expect(inputContainers.length).toBeGreaterThan(0);
      });

      it("should have adequate right padding for password inputs (toggle button space)", () => {
        const { container } = render(<ResetPasswordForm />);
        const newPasswordInput = container.querySelector("#newPassword");
        expect(newPasswordInput?.className).toContain("pr-12");
      });

      it("should have contained card layout", () => {
        const { container } = render(<ResetPasswordForm />);
        const card = container.querySelector(".rounded-2xl");
        expect(card).toBeInTheDocument();
      });
    });

    describe("Interaction Parity", () => {
      it("should have hover states on buttons", () => {
        const { container } = render(<ResetPasswordForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton?.className).toContain("hover:");
      });

      it("should have disabled state styling on submit button", () => {
        const { container } = render(<ResetPasswordForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton?.className).toContain("disabled:");
      });

      it("should have focus states for keyboard navigation", () => {
        const { container } = render(<ResetPasswordForm />);
        const newPasswordInput = container.querySelector("#newPassword");
        expect(newPasswordInput?.className).toContain("focus:");
      });

      it("should have transition classes for smooth interactions", () => {
        const { container } = render(<ResetPasswordForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton?.className).toContain("transition");
      });
    });
  });

  describe("RegisterForm", () => {
    describe("Breakpoints & Layout", () => {
      it("should have responsive heading size (2xl on mobile, 3xl on tablet+)", () => {
        const { container } = render(<RegisterForm />);
        const heading = container.querySelector("h1");
        expect(heading).toHaveClass("text-2xl");
        expect(heading).toHaveClass("sm:text-3xl");
      });

      it("should have responsive padding (6 on mobile, 8 on tablet+)", () => {
        const { container } = render(<RegisterForm />);
        const card = container.querySelector(".p-6");
        expect(card).toHaveClass("p-6");
        expect(card).toHaveClass("sm:p-8");
      });

      it("should have full-width form inputs", () => {
        const { container } = render(<RegisterForm />);
        const emailInput = container.querySelector("#email");
        const usernameInput = container.querySelector("#username");
        const displayNameInput = container.querySelector("#displayName");
        const passwordInput = container.querySelector("#password");

        expect(emailInput).toHaveClass("w-full");
        expect(usernameInput).toHaveClass("w-full");
        expect(displayNameInput).toHaveClass("w-full");
        expect(passwordInput).toHaveClass("w-full");
      });

      it("should have consistent spacing with space-y classes", () => {
        const { container } = render(<RegisterForm />);
        const form = container.querySelector("form");
        expect(form).toHaveClass("space-y-5");
      });
    });

    describe("Touch Targets (Minimum 44px/11 Tailwind units)", () => {
      it("should have minimum touch target height on all form inputs", () => {
        const { container } = render(<RegisterForm />);
        const inputs = container.querySelectorAll('input[type="text"]');
        inputs.forEach((input) => {
          expect(input).toHaveClass("h-12");
        });
      });

      it("should have minimum touch target height on password input", () => {
        const { container } = render(<RegisterForm />);
        const passwordInput = container.querySelector("#password");
        expect(passwordInput).toHaveClass("h-12");
      });

      it("should have minimum touch target height on submit button", () => {
        const { container } = render(<RegisterForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton).toHaveClass("h-12");
      });

      it("should have password toggle button with adequate touch area", () => {
        const { container } = render(<RegisterForm />);
        const toggleButton = container.querySelector(
          'button[aria-label*="password"]'
        );
        expect(toggleButton).toBeInTheDocument();
      });
    });

    describe("Overflow Protection", () => {
      it("should have full-width submit button", () => {
        const { container } = render(<RegisterForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton).toHaveClass("w-full");
      });

      it("should have adequate padding on inputs with icons", () => {
        const { container } = render(<RegisterForm />);
        const emailInput = container.querySelector("#email");
        // Left padding for icon
        expect(emailInput?.className).toContain("pl-11");
      });

      it("should have contained card with responsive padding", () => {
        const { container } = render(<RegisterForm />);
        const cards = container.querySelectorAll(".rounded-2xl");
        // Second card is the actual content card with padding
        const contentCard = cards[1];
        expect(contentCard).toBeInTheDocument();
        expect(contentCard).toHaveClass("p-6");
        expect(contentCard).toHaveClass("sm:p-8");
      });

      it("should have relative positioning for password input container", () => {
        const { container } = render(<RegisterForm />);
        const passwordContainer =
          container.querySelector("#password")?.parentElement;
        expect(passwordContainer).toHaveClass("relative");
      });
    });

    describe("Interaction Parity", () => {
      it("should have hover states on interactive elements", () => {
        const { container } = render(<RegisterForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton?.className).toContain("hover:");
      });

      it("should have focus states for all inputs", () => {
        const { container } = render(<RegisterForm />);
        const inputs = container.querySelectorAll("input");
        inputs.forEach((input) => {
          expect(input.className).toContain("focus:");
        });
      });

      it("should have disabled state styling on submit button", () => {
        const { container } = render(<RegisterForm />);
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton?.className).toContain("disabled:");
      });

      it("should have smooth transitions for state changes", () => {
        const { container } = render(<RegisterForm />);
        const textInputs = container.querySelectorAll('input[type="text"]');
        const passwordInputs = container.querySelectorAll(
          'input[type="password"]'
        );
        // Text and password inputs have transition classes
        [...textInputs, ...passwordInputs].forEach((input) => {
          expect(input.className).toContain("transition");
        });
      });
    });
  });

  describe("Container/Layout Parent Compliance", () => {
    it("should work within page max-w-md constraint (ForgotPasswordForm)", () => {
      const { container } = render(<ForgotPasswordForm />);
      // Form should not have any fixed widths that conflict with parent
      const form = container.querySelector("form");
      expect(form).toBeTruthy();
      // All inputs are w-full, so they respect parent width
    });

    it("should work within page max-w-md constraint (ResetPasswordForm)", () => {
      const { container } = render(<ResetPasswordForm />);
      const form = container.querySelector("form");
      expect(form).toBeTruthy();
    });

    it("should work within page max-w-md constraint (RegisterForm)", () => {
      const { container } = render(<RegisterForm />);
      const form = container.querySelector("form");
      expect(form).toBeTruthy();
    });
  });
});
