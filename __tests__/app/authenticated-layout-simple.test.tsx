import React from "react";
import { render, screen } from "@testing-library/react";
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
        Sidebar Content
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

jest.mock("../../app/components/ui/Version", () => {
  return function MockVersion({ className }: { className?: string }) {
    return (
      <span data-testid="version" className={className}>
        v1.0.0
      </span>
    );
  };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("AuthenticatedLayout Component - Simple Tests", () => {
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

      expect(screen.getByTestId("sidebar-desktop")).toBeInTheDocument();
    });
  });

  describe("Mobile Header", () => {
    it("should render mobile header with logo and version", () => {
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

      // Logo should be present with medium size
      const logo = screen.getByTestId("logo");
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute("data-size", "md");

      // Version should be present
      const versionElement = screen.getByTestId("version");
      expect(versionElement).toBeInTheDocument();

      // BwB text should be present
      const bwbText = screen.getByText(SITE_NAME);
      expect(bwbText).toBeInTheDocument();
      expect(bwbText).toHaveClass("text-lg", "font-bold", "text-primary-400", "tracking-wide");
    });

    it("should have menu button for mobile navigation", () => {
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
    });

    it("should align logo, text and version with baseline", () => {
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

      // Check for baseline alignment class (items-end)
      const headerContainer = container.querySelector(".md\\:hidden .flex.items-end");
      expect(headerContainer).toBeInTheDocument();
    });

    it("should have correct logo size for mobile", () => {
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

    it("should display version information", () => {
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

      const version = screen.getByTestId("version");
      expect(version).toBeInTheDocument();

      // Check that the version wrapper has the correct styling
      const versionWrapper = container.querySelector(".text-xs.text-gray-400.font-mono");
      expect(versionWrapper).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should render both desktop and mobile layouts", () => {
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

      // Desktop sidebar container
      const desktopSidebarContainer = container.querySelector(".hidden.md\\:block");
      expect(desktopSidebarContainer).toBeInTheDocument();

      // Mobile header container
      const mobileHeaderContainer = container.querySelector(".md\\:hidden");
      expect(mobileHeaderContainer).toBeInTheDocument();
    });

    it("should have proper layout structure", () => {
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

      // Main layout wrapper
      const mainWrapper = container.querySelector(".min-h-screen.bg-dark-950");
      expect(mainWrapper).toBeInTheDocument();

      // Flex container
      const flexContainer = container.querySelector(".flex.h-screen.overflow-hidden");
      expect(flexContainer).toBeInTheDocument();

      // Content area
      const contentArea = container.querySelector(".flex-1.flex.flex-col.overflow-hidden");
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe("Authentication States", () => {
    it("should render for authenticated users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Authenticated Content</div>
        </AuthenticatedLayout>
      );

      expect(screen.getByText("Authenticated Content")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-desktop")).toBeInTheDocument();
      expect(screen.getByTestId("logo")).toBeInTheDocument();
      expect(screen.getByTestId("version")).toBeInTheDocument();
    });

    it("should handle loading state", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Loading Content</div>
        </AuthenticatedLayout>
      );

      expect(screen.getByText("Loading Content")).toBeInTheDocument();
    });

    it("should handle unauthenticated state", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      render(
        <AuthenticatedLayout>
          <div>Unauthenticated Content</div>
        </AuthenticatedLayout>
      );

      expect(screen.getByText("Unauthenticated Content")).toBeInTheDocument();
    });
  });
});
