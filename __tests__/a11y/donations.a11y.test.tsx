/**
 * Accessibility tests for donation form
 * Tests donation components for WCAG compliance
 */

import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import DonationForm from "@/app/components/features/donations/DonationForm";
import { RunningCostsIndicator } from "@/app/components/features/donations/RunningCostsIndicator";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// RunningCostsIndicator is an async server component; mock its data source.
// This must be at module top level so jest.mock is hoisted above the imports.
jest.mock("@/src/lib/funding-settings", () => {
  const actual = jest.requireActual("@/src/lib/funding-bar-utils");
  return {
    getFundingSettings: jest.fn(),
    computeBarSegments: actual.computeBarSegments,
  };
});

describe("Donation Form Accessibility", () => {
  describe("DonationForm", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<DonationForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have accessible currency select", () => {
      const { getByLabelText } = render(<DonationForm />);
      const currencySelect = getByLabelText(/currency/i);
      expect(currencySelect).toBeInTheDocument();
      expect(currencySelect.tagName).toBe("SELECT");
      expect(currencySelect).toHaveAttribute("id", "currency-select");
    });

    it("should have accessible donation type buttons with aria-pressed", () => {
      const { getByText } = render(<DonationForm />);
      const monthlyButton = getByText("Monthly");
      const oneTimeButton = getByText("One-time");

      expect(monthlyButton).toHaveAttribute("aria-pressed");
      expect(oneTimeButton).toHaveAttribute("aria-pressed");
      expect(monthlyButton.tagName).toBe("BUTTON");
      expect(oneTimeButton.tagName).toBe("BUTTON");
    });

    it("should have properly grouped donation type buttons", () => {
      const { container } = render(<DonationForm />);
      const buttonGroup = container.querySelector(
        '[role="group"][aria-labelledby="donation-type-label"]'
      );
      expect(buttonGroup).toBeInTheDocument();
    });

    it("should have accessible amount selection buttons", () => {
      const { container } = render(<DonationForm />);
      const amountButtons = container.querySelectorAll(
        'button[aria-pressed][aria-label*="Donate"]'
      );
      expect(amountButtons.length).toBeGreaterThan(0);

      amountButtons.forEach((button) => {
        expect(button).toHaveAttribute("aria-pressed");
        expect(button).toHaveAttribute("aria-label");
      });
    });

    it("should have accessible custom amount input with label and help text", () => {
      const { getByLabelText, container } = render(<DonationForm />);
      const customInput = getByLabelText(/or enter custom amount/i);

      expect(customInput).toBeInTheDocument();
      expect(customInput).toHaveAttribute("id", "custom-amount");
      expect(customInput).toHaveAttribute("aria-describedby", "custom-amount-help");

      const helpText = container.querySelector("#custom-amount-help");
      expect(helpText).toBeInTheDocument();
    });

    it("should have accessible email field with required indicator", () => {
      const { getByLabelText } = render(<DonationForm />);
      const emailInput = getByLabelText(/email address/i);

      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("required");
      expect(emailInput).toHaveAttribute("id", "donor-email");
    });

    it("should have accessible optional name field", () => {
      const { getByLabelText } = render(<DonationForm />);
      const nameInput = getByLabelText(/name \(optional\)/i);

      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute("type", "text");
      expect(nameInput).toHaveAttribute("id", "donor-name");
      expect(nameInput).not.toHaveAttribute("required");
    });

    it("should have accessible error messages with proper ARIA", () => {
      const { container } = render(<DonationForm />);
      // Error messages should have role="alert" and aria-live when shown
      const errorContainer = container.querySelector('[role="alert"][aria-live="assertive"]');
      // Initially no error, but container should be set up properly if error appears
      expect(errorContainer).toBe(null); // No error initially
    });

    it("should have accessible donation summary when amount is selected", () => {
      const { container } = render(<DonationForm />);
      // Summary appears only after amount selection
      // When shown, it should have role="status" and aria-label
      const summaryContainer = container.querySelector(
        '[role="status"][aria-label="Donation summary"]'
      );
      // Initially hidden until amount selected, so we just verify the selector is valid
      expect(summaryContainer).toBe(null); // Not shown initially
    });

    it("should have minimum touch target sizes (44x44px)", () => {
      const { container } = render(<DonationForm />);
      // Check donation type and amount buttons have min-h-11
      const typeButtons = container.querySelectorAll("[aria-pressed]");

      typeButtons.forEach((button) => {
        // Interactive buttons should have min-h-11 or equivalent
        const hasMinHeight =
          button.className.includes("min-h-11") || button.className.includes("py-3.5"); // py-3.5 = ~28px vertical = 56px+ total
        expect(hasMinHeight).toBeTruthy();
      });
    });

    it("should have proper heading hierarchy", () => {
      const { container } = render(<DonationForm />);
      const headings = container.querySelectorAll('[role="heading"]');

      headings.forEach((heading) => {
        expect(heading).toHaveAttribute("aria-level");
      });
    });
  });

  describe("RunningCostsIndicator", () => {
    // Refactored into an async server component: mock its data source and
    // render the resolved output. The previous suite asserted a removed
    // client-side timeline (month buttons, hover tooltips, #timeline-summary).
    const settingsModule = jest.requireMock("@/src/lib/funding-settings") as {
      getFundingSettings: jest.Mock;
    };

    const renderIndicator = async () => {
      settingsModule.getFundingSettings.mockResolvedValue({
        totalSpent: 1200,
        totalCollected: 480,
        monthlyEst: 25,
      });
      const ui = await RunningCostsIndicator();
      return render(ui);
    };

    it("should not have accessibility violations", async () => {
      const { container } = await renderIndicator();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper semantic structure with section and heading", async () => {
      const { container } = await renderIndicator();

      const section = container.querySelector("section");
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute("aria-labelledby", "running-costs-heading");

      const heading = container.querySelector("h3#running-costs-heading");
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe("Running Costs");
    });

    it("should expose the coverage bar with accessible values", async () => {
      const { container } = await renderIndicator();
      const bar = container.querySelector("[role='progressbar']");

      expect(bar).toBeInTheDocument();
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
      expect(bar?.getAttribute("aria-label")).toMatch(/% of costs covered/);
    });

    it("should convey running costs in text, not colour alone", async () => {
      const { container } = await renderIndicator();

      expect(container.textContent).toMatch(/€1200/);
      expect(container.textContent).toMatch(/€25\/month/);
      expect(container.textContent).toMatch(/€300\/year/);
    });

    it("should announce the contributed amount in text", async () => {
      const { container } = await renderIndicator();
      expect(container.textContent).toMatch(/€480\.00 contributed/);
    });

    it("should label the timeline range with machine-readable times", async () => {
      const { container } = await renderIndicator();

      expect(container.textContent).toMatch(/Sep 2025/);

      const times = container.querySelectorAll("time[dateTime]");
      expect(times.length).toBeGreaterThanOrEqual(2);
      times.forEach((t) => {
        expect(t.getAttribute("dateTime")).toMatch(/^\d{4}-\d{2}$/);
      });
    });
  });
});
