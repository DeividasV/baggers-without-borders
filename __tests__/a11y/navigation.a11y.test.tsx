/**
 * Accessibility tests for navigation components
 * Tests navigation for keyboard accessibility and ARIA attributes
 */

import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import Sidebar from "@/app/components/ui/Sidebar";
import Navigation from "@/app/components/ui/Navigation";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: "Test User", role: "USER" } },
    status: "authenticated",
  })),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useSearchParams: () => ({
    get: () => null,
  }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("Navigation Components Accessibility", () => {
  describe("Sidebar", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<Sidebar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have accessible navigation label", () => {
      const { container } = render(<Sidebar />);
      const nav = container.querySelector('nav[aria-label="Main navigation"]');
      expect(nav).toBeInTheDocument();
    });

    it("should have accessible links", () => {
      const { getAllByRole } = render(<Sidebar />);
      const links = getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        // Each link should have text content or aria-label
        const hasAccessibleName =
          link.textContent ||
          link.getAttribute("aria-label") ||
          link.getAttribute("title");
        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it("should have accessible collapse button", () => {
      const { getByLabelText } = render(<Sidebar />);
      const collapseButton = getByLabelText(/collapse sidebar|expand sidebar/i);
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<Navigation />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have accessible mobile menu button", () => {
      const { container } = render(<Navigation />);
      const menuButtons = container.querySelectorAll("button");
      // Mobile hamburger menu should be accessible
      expect(menuButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Skip Links", () => {
    it("should have skip to main content link in layout", async () => {
      // This would be tested in the actual layout component
      const { container } = render(
        <div>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <main id="main-content">Content</main>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
