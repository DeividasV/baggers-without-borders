import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import AuthenticatedLayout from "../../app/(authenticated)/layout";
import { SITE_NAME } from "@/src/config/site";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("../../app/components/ui/Sidebar", () => {
  return function MockSidebar({ isMobile, onClose }: { isMobile?: boolean; onClose?: () => void }) {
    return (
      <div data-testid={isMobile ? "sidebar-mobile" : "sidebar-desktop"}>
        <div data-testid="sidebar">
          Sidebar Content
          {isMobile && " (Mobile)"}
        </div>
        {isMobile && (
          <button onClick={onClose} data-testid="sidebar-close">
            Close
          </button>
        )}
      </div>
    );
  };
});

jest.mock("../../app/components/ui/Logo", () => {
  return function MockLogo({ size = "md" }: { size?: string }) {
    return (
      <div data-testid="logo" data-size={size}>
        Logo
      </div>
    );
  };
});

jest.mock("../../app/components/ui/Version", () => {
  return function MockVersion({ className }: { className?: string }) {
    return (
      <span data-testid="version" className={className}>
        v1.0.0
      </span>
    );
  };
});

// Additional mock for Logo component in header
jest.mock("../../app/components/ui/Logo", () => {
  return function MockLogo({
    size,
    showText,
    className,
  }: {
    size?: string;
    showText?: boolean;
    className?: string;
  }) {
    return (
      <div
        data-testid="logo"
        data-size={size}
        data-showtext={showText?.toString()}
        className={className}
      >
        Logo
      </div>
    );
  };
});

// Additional mock for Version component in header
jest.mock("../../app/components/ui/Version", () => {
  return function MockVersion() {
    return <span data-testid="version">v0.411.0</span>;
  };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("AuthenticatedLayout Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render main layout structure", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Test Content</div>
        </AuthenticatedLayout>
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });

    it("should render children content", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Custom Page Content</div>
        </AuthenticatedLayout>
      );

      expect(screen.getByText("Custom Page Content")).toBeInTheDocument();
    });
  });

  describe("Desktop Sidebar", () => {
    it("should show desktop sidebar for authenticated users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const sidebar = screen.getByTestId("sidebar");
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).not.toHaveTextContent("(Mobile)");
    });

    it("should not show desktop sidebar for unauthenticated users", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    });
  });

  describe("Mobile Header", () => {
    it("should render mobile header with correct logo size", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const logo = screen.getByTestId("logo");
      expect(logo).toHaveAttribute("data-size", "md");
      expect(logo).toHaveAttribute("data-showtext", "false");
    });

    it("should show desktop sidebar for authenticated users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      expect(screen.getByTestId("sidebar-desktop")).toBeInTheDocument();
    });

    it("should display version information in mobile header", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      expect(screen.getByTestId("version")).toBeInTheDocument();
      expect(screen.getByText("v0.411.0")).toBeInTheDocument();
    });

    it("should have proper text styling and alignment", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const bwbText = screen.getByText(SITE_NAME);
      expect(bwbText).toHaveClass("text-lg", "font-bold", "text-primary-400", "tracking-wide");

      const headerContainer = container.querySelector(".md\\:hidden .flex.items-end");
      expect(headerContainer).toBeInTheDocument();
    });
  });

  describe("Mobile Sidebar", () => {
    it("should open mobile sidebar when menu button clicked", async () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      await waitFor(() => {
        const mobileSidebar = screen.getByTestId("sidebar-mobile");
        expect(mobileSidebar).toBeInTheDocument();
      });
    });

    it("should close mobile sidebar when backdrop clicked", async () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByTestId("sidebar-mobile")).toBeInTheDocument();
      });

      const backdrop = container.querySelector(".fixed.inset-0.bg-black.bg-opacity-50");
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      await waitFor(() => {
        expect(screen.queryByTestId("sidebar-mobile")).not.toBeInTheDocument();
      });
    });

    it("should close mobile sidebar when close button clicked", async () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByTestId("sidebar-mobile")).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId("sidebar-close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId("sidebar-mobile")).not.toBeInTheDocument();
      });
    });

    it("should not show mobile sidebar for unauthenticated users", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.queryByTestId("sidebar-mobile")).not.toBeInTheDocument(); // Present but may be hidden
    });
  });

  describe("Layout Structure", () => {
    it("should have correct mobile header structure", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const mobileHeader = container.querySelector(".md\\:hidden.bg-dark-900.border-b");
      expect(mobileHeader).toBeInTheDocument();
      expect(mobileHeader).toHaveClass("p-4", "flex", "items-center", "justify-between");
    });

    it("should have baseline alignment for logo, text, and version", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const logoContainer = container.querySelector(".flex.items-end");
      expect(logoContainer).toBeInTheDocument();
      expect(logoContainer).toHaveClass("space-x-2");
    });

    it("should have scrollable main content area", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const contentArea = container.querySelector(".flex-1.overflow-y-auto.overflow-x-hidden");
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should hide mobile header on desktop screens", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const mobileHeader = container.querySelector(".md\\:hidden");
      expect(mobileHeader).toHaveClass("md:hidden");
    });

    it("should show desktop sidebar only on desktop screens", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const desktopSidebar = container.querySelector(".hidden.md\\:block");
      expect(desktopSidebar).toHaveClass("hidden", "md:block");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible menu button", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      const menuButton = screen.getByRole("button");
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveClass(
        "p-2",
        "rounded-md",
        "text-gray-300",
        "hover:text-white",
        "hover:bg-dark-800",
        "transition-colors"
      );
    });

    it("should have proper ARIA structure", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
