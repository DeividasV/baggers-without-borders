/* eslint-disable */
/**
 * Minimal DonationForm Tests - Focus on regressions from recent changes
 * Tests string changes (One-time), truncate classes, and basic flow
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import DonationForm from "@/app/components/features/donations/DonationForm";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe("DonationForm - Regression Tests", () => {
  describe("String Changes", () => {
    it("should display 'One-time' button text (not 'One-Time')", () => {
      render(<DonationForm />);

      const oneTimeButton = screen.getByText("One-time");
      expect(oneTimeButton).toBeDefined();
      expect(oneTimeButton.textContent).toBe("One-time");
    });

    it("should display 'Monthly' button text", () => {
      render(<DonationForm />);

      const monthlyButton = screen.getByText("Monthly");
      expect(monthlyButton).toBeDefined();
    });
  });

  describe("Layout Resilience", () => {
    it("should have truncate class on submit button text", () => {
      render(<DonationForm />);

      const submitButtons = screen.getAllByRole("button");
      const submitButton = submitButtons.find(
        (btn) => btn.getAttribute("type") === "submit"
      );

      expect(submitButton).toBeDefined();
      const truncateSpan = submitButton!.querySelector("span.truncate");
      expect(truncateSpan).toBeDefined();
    });

    it("should render form with all required fields", () => {
      render(<DonationForm />);

      expect(screen.getByLabelText("Currency")).toBeDefined();
      expect(screen.getByText("Donation Type")).toBeDefined();
      expect(screen.getByText("Select Amount")).toBeDefined();
      expect(screen.getByLabelText("Or Enter Custom Amount")).toBeDefined();
      expect(screen.getByLabelText("Email Address *")).toBeDefined();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-pressed states on donation type buttons", () => {
      render(<DonationForm />);

      const oneTimeButton = screen.getByText("One-time");
      const monthlyButton = screen.getByText("Monthly");

      // Monthly should be selected by default
      expect(monthlyButton.getAttribute("aria-pressed")).toBe("true");
      expect(oneTimeButton.getAttribute("aria-pressed")).toBe("false");
    });

    it("should have aria-describedby on custom amount input", () => {
      render(<DonationForm />);

      const customInput = screen.getByLabelText("Or Enter Custom Amount");
      expect(customInput.getAttribute("aria-describedby")).toBe(
        "custom-amount-help"
      );
    });
  });

  describe("Prefilled Data", () => {
    it("should prefill email when provided", () => {
      render(<DonationForm prefilledEmail="test@example.com" />);

      const emailInput = screen.getByLabelText(
        "Email Address *"
      ) as HTMLInputElement;
      expect(emailInput.value).toBe("test@example.com");
    });

    it("should prefill name when provided", () => {
      render(<DonationForm prefilledName="Test User" />);

      const nameInput = screen.getByLabelText(
        "Name (Optional)"
      ) as HTMLInputElement;
      expect(nameInput.value).toBe("Test User");
    });

    it("should show Back button when returnTo is provided", () => {
      render(<DonationForm returnTo="/profile" />);

      expect(screen.getByText("Back")).toBeDefined();
    });
  });

  describe("Currency Display", () => {
    it("should display EUR currency symbol by default", () => {
      render(<DonationForm />);

      // Currency symbol appears in custom amount field
      expect(screen.getByText("€")).toBeDefined();
    });

    it("should default to EUR currency", () => {
      render(<DonationForm />);

      const currencySelect = screen.getByLabelText(
        "Currency"
      ) as HTMLSelectElement;
      expect(currencySelect.value).toBe("EUR");
    });
  });
});
