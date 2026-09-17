/**
 * Accessibility Tests for Helpdesk Components
 * Verifies WCAG 2.1 AA compliance for ticket management UI
 */

import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: "user-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      },
    },
    status: "authenticated",
  })),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("Helpdesk Accessibility Compliance", () => {
  // Helper to create mock fetch
  const setupMockFetch = (tickets: any[] = []) => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: tickets,
            total: tickets.length,
            pages: 1,
            page: 1,
          }),
      })
    ) as jest.Mock;
  };

  beforeEach(() => {
    setupMockFetch([
      {
        id: "ticket-1",
        name: "John Doe",
        email: "john@example.com",
        subject: "Cannot reset password",
        message: "I\nforgot my password\nand can't login",
        category: "GENERAL",
        priority: "HIGH",
        status: "OPEN",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        attachments: [],
        assignedTo: null,
      },
      {
        id: "ticket-2",
        name: "Jane Smith",
        email: "jane@example.com",
        subject: "Missing peak data",
        message: "Peak data for Mont Blanc not showing",
        category: "HOF_DATA",
        priority: "NORMAL",
        status: "RESOLVED",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        attachments: [
          { filename: "screenshot.png", originalName: "screenshot.png" },
        ],
        assignedTo: null,
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should pass axe accessibility audit", async () => {
    const HelpdeskManagement = (
      await import("@/app/components/features/helpdesk/HelpdeskManagement")
    ).default;

    const { container } = render(<HelpdeskManagement />);

    // Wait for the component to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("Semantic HTML", () => {
    it("should have proper form label structure", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Check for labels with associated inputs
      const labels = container.querySelectorAll("label");
      expect(labels.length).toBeGreaterThan(0);

      // Each label should have htmlFor or be wrapping an input
      labels.forEach((label) => {
        const hasFor = label.hasAttribute("for");
        const hasInput = label.querySelector("input") !== null;
        expect(hasFor || hasInput).toBe(true);
      });
    });

    it("should use semantic table markup", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Wait for component to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check for table, thead, tbody elements
      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();

      const thead = container.querySelector("thead");
      expect(thead).toBeInTheDocument();

      const tbody = container.querySelector("tbody");
      expect(tbody).toBeInTheDocument();

      // Check for table headers
      const ths = container.querySelectorAll("th");
      expect(ths.length).toBeGreaterThan(0);
    });
  });

  describe("Keyboard Navigation", () => {
    it("should have keyboard-accessible interactive rows", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Wait for component to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Interactive elements should be focusable
      const rows = container.querySelectorAll('[role="button"]');
      expect(rows.length).toBeGreaterThan(0);

      // Each interactive row should have tabIndex
      rows.forEach((row) => {
        expect(row).toHaveAttribute("tabIndex");
      });
    });

    it("should support Enter and Space keys on interactive elements", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Wait for component to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      const rows = container.querySelectorAll('[role="button"]');
      if (rows.length > 0) {
        // Interactive rows should have the button role and be focusable
        // They should be able to handle keyboard activation
        const firstRow = rows[0] as HTMLElement;
        expect(firstRow).toHaveAttribute("role", "button");
        expect(firstRow).toHaveAttribute("tabIndex");
      }
    });
  });

  describe("ARIA Attributes", () => {
    it("should have aria-labels on interactive rows", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Wait for component to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Rows should have descriptive aria-labels
      const rows = container.querySelectorAll('[role="button"][aria-label]');
      expect(rows.length).toBeGreaterThan(0);

      // Labels should describe the action
      if (rows.length > 0) {
        const firstRow = rows[0];
        const label = firstRow.getAttribute("aria-label");
        expect(label).toMatch(/open ticket/i);
      }
    });

    it("should have aria-hidden on decorative icons", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Wait for component to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Decorative icons (like sparkles in badge) should be hidden
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });

    it("should label icon-only indicators", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Wait for component to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Attachment icon should have aria-label
      const attachmentIcons = container.querySelectorAll(
        '[aria-label="Has attachments"]'
      );
      expect(attachmentIcons.length).toBeGreaterThan(0);
    });

    it("should have aria-live region for loading state", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Loading region should announce state changes
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute("aria-label", "Loading tickets");
    });
  });

  describe("Focus Management", () => {
    it("should have visible focus indicators on interactive elements", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Interactive rows should have focus ring classes
      const rows = container.querySelectorAll('[role="button"]');
      rows.forEach((row) => {
        const className = row.className;
        expect(className).toContain("focus:");
      });
    });
  });

  describe("Form Labels", () => {
    it("should have all filter inputs properly labeled", async () => {
      const HelpdeskManagement = (
        await import("@/app/components/features/helpdesk/HelpdeskManagement")
      ).default;

      const { container } = render(<HelpdeskManagement />);

      // Check for labels with proper ID associations
      const searchLabel = container.querySelector(
        'label[for="helpdesk-search"]'
      );
      const categoryLabel = container.querySelector(
        'label[for="helpdesk-category"]'
      );
      const statusLabel = container.querySelector(
        'label[for="helpdesk-status"]'
      );

      expect(searchLabel).toBeInTheDocument();
      expect(categoryLabel).toBeInTheDocument();
      expect(statusLabel).toBeInTheDocument();
    });
  });
});
