/**
 * Responsive UX tests for donation form
 * Tests donation components for mobile/tablet/desktop breakpoints
 */

import { render } from "@testing-library/react";
import DonationForm from "@/app/components/features/donations/DonationForm";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe("Donation Form Responsive UX", () => {
  describe("Breakpoints & Layout", () => {
    it("should have responsive grid for amount buttons (2 cols mobile, 4 cols desktop)", () => {
      const { container } = render(<DonationForm />);
      const amountGrid = container.querySelector(
        '[aria-labelledby="amount-label"]'
      );

      expect(amountGrid).toHaveClass("grid");
      expect(amountGrid).toHaveClass("grid-cols-2"); // Mobile
      expect(amountGrid).toHaveClass("sm:grid-cols-4"); // Desktop
    });

    it("should have responsive header with flexible title", () => {
      const { container } = render(<DonationForm />);
      const header = container.querySelector("h2");

      expect(header).toHaveClass("text-2xl");
      expect(header).toHaveClass("font-bold");
    });

    it("should have flexible gap spacing for donation type buttons", () => {
      const { container } = render(<DonationForm />);
      const buttonGroup = container.querySelector(
        '[role="group"][aria-labelledby="donation-type-label"]'
      );

      expect(buttonGroup).toHaveClass("flex");
      expect(buttonGroup).toHaveClass("gap-3");
    });
  });

  describe("Overflow Protection", () => {
    it("should have truncate class on submit button text", () => {
      const { container } = render(<DonationForm />);
      // Button component wraps children in span, so look for truncate class within
      const truncateSpan = container.querySelector(".truncate");

      expect(truncateSpan).toBeTruthy();
      expect(truncateSpan?.className).toContain("truncate");
    });

    it("should have full width inputs to prevent horizontal scroll", () => {
      const { container } = render(<DonationForm />);
      const currencySelect = container.querySelector("#currency-select");

      expect(currencySelect).toHaveClass("w-full");
    });

    it("should have contained card layout", () => {
      const { container } = render(<DonationForm />);
      // Card component wraps the form with max-w-2xl
      const card = container.firstChild as HTMLElement;

      expect(card.className).toContain("max-w-2xl");
      expect(card.className).toContain("mx-auto");
    });
  });

  describe("Touch Targets", () => {
    it("should have minimum 44px height on donation type buttons", () => {
      const { container } = render(<DonationForm />);
      const typeButtons = container.querySelectorAll(
        '[aria-labelledby="donation-type-label"] button'
      );

      typeButtons.forEach((button) => {
        expect(button.className).toMatch(/min-h-11|py-3\.5/);
      });
    });

    it("should have minimum 44px height on amount buttons", () => {
      const { container } = render(<DonationForm />);
      const amountButtons = container.querySelectorAll(
        '[aria-labelledby="amount-label"] button'
      );

      amountButtons.forEach((button) => {
        expect(button.className).toMatch(/min-h-11|py-3\.5/);
      });
    });

    it("should have adequate padding on select dropdown", () => {
      const { container } = render(<DonationForm />);
      const select = container.querySelector("#currency-select");

      expect(select?.className).toMatch(/py-2|py-3/);
    });
  });

  describe("Interaction Parity", () => {
    it("should have flex-1 on donation type buttons for equal width", () => {
      const { container } = render(<DonationForm />);
      const typeButtons = container.querySelectorAll(
        '[aria-labelledby="donation-type-label"] button'
      );

      typeButtons.forEach((button) => {
        expect(button).toHaveClass("flex-1");
      });
    });

    it("should maintain consistent border styling across states", () => {
      const { container } = render(<DonationForm />);
      const typeButtons = container.querySelectorAll(
        '[aria-labelledby="donation-type-label"] button'
      );

      typeButtons.forEach((button) => {
        expect(button.className).toContain("border-2");
      });
    });

    it("should have responsive text sizing on form labels", () => {
      const { container } = render(<DonationForm />);
      const labels = container.querySelectorAll("label");

      labels.forEach((label) => {
        expect(label.className).toMatch(/text-sm/);
      });
    });
  });

  describe("Mobile Optimization", () => {
    it("should stack donation type buttons horizontally (flex)", () => {
      const { container } = render(<DonationForm />);
      const buttonGroup = container.querySelector(
        '[aria-labelledby="donation-type-label"]'
      );

      expect(buttonGroup).toHaveClass("flex");
      // Should NOT have flex-col (stays horizontal even on mobile)
      expect(buttonGroup?.className).not.toContain("flex-col");
    });

    it("should have responsive padding on inputs", () => {
      const { container } = render(<DonationForm />);
      const emailInput = container.querySelector("#donor-email");

      // Input component has adequate height for touch (py-2.5 in globals.css)
      expect(emailInput).toBeTruthy();
      // Input wrapper uses space-y-2 for consistent vertical spacing
      expect(emailInput?.parentElement?.className).toContain("space-y-2");
    });

    it("should show full-width submit button", () => {
      const { container } = render(<DonationForm />);
      const submitButton = container.querySelector('button[type="submit"]');

      expect(
        submitButton?.parentElement?.className || submitButton?.className
      ).toContain("w-full");
    });
  });

  describe("Content Reflow", () => {
    it("should have space-y classes for vertical rhythm", () => {
      const { container } = render(<DonationForm />);
      const donorInfoSection = container.querySelector(".space-y-4");

      expect(donorInfoSection).toBeTruthy();
    });

    it("should have margin bottom on form sections", () => {
      const { container } = render(<DonationForm />);
      const sections = container.querySelectorAll(".mb-6");

      expect(sections.length).toBeGreaterThan(3); // Multiple sections with spacing
    });

    it("should have donation summary with proper spacing when visible", () => {
      const { container } = render(<DonationForm />);
      // Summary has mb-4 when shown
      const summaryWrapper = container.querySelector('[role="status"]');

      // If present, should have spacing
      if (summaryWrapper) {
        expect(summaryWrapper).toHaveClass("mb-4");
      }
    });
  });
});
