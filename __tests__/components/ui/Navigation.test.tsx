import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Navigation from "@/app/components/ui/Navigation";
import { SITE_NAME } from "@/src/config/site";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/app/components/ui/Logo", () => {
  return function MockLogo({
    showText,
    size,
    className,
  }: {
    showText?: boolean;
    size?: string;
    className?: string;
  }) {
    return (
      <div
        data-testid="logo"
        data-size={size}
        data-showtext={showText?.toString()}
        className={className}
      >
        {showText && "BWB Logo"}
      </div>
    );
  };
});

jest.mock("@/app/components/ui/Version", () => {
  return function MockVersion() {
    return <span data-testid="version">v0.411.0</span>;
  };
});

jest.mock("@/app/components/ui/Sidebar", () => {
  return function MockSidebar({ isMobile, onClose }: { isMobile?: boolean; onClose?: () => void }) {
    return (
      <div data-testid="sidebar">
        Sidebar {isMobile && "(Mobile)"}
        {onClose && <button onClick={onClose}>Close Sidebar</button>}
      </div>
    );
  };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("Navigation Component", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/home");
    mockSignOut.mockResolvedValue(undefined as any);
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render navigation bar", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });

    it("should render logo with text", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      expect(screen.getByText(SITE_NAME)).toBeInTheDocument();
    });

    it("should render mobile menu toggle button", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      expect(menuButton).toBeInTheDocument();
    });

    it("should show Admin Panel text for admin users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });

    it("should not show Admin Panel text for regular users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
    });
  });

  describe("Mobile Menu Toggle", () => {
    it("should open mobile menu when hamburger clicked", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should show Menu icon when closed", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const svg = container.querySelector("svg.lucide-menu");
      expect(svg).toBeInTheDocument();
    });

    it("should show X icon when opened", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const xIcon = container.querySelector("svg.lucide-x");
      expect(xIcon).toBeInTheDocument();
    });

    it("should close mobile menu when X clicked", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.getByText("John Doe")).toBeInTheDocument();

      fireEvent.click(menuButton);

      expect(screen.queryByText("Member")).not.toBeInTheDocument();
    });

    it("should close mobile menu when backdrop clicked", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const backdrop = container.querySelector(".fixed.inset-0");
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(screen.queryByText("Member")).not.toBeInTheDocument();
    });
  });

  describe("User Info Display", () => {
    it("should show user name in mobile menu", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should show user initials in mobile menu avatar", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it('should show "Member" role for regular users', () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.getByText("Member")).toBeInTheDocument();
    });

    it('should show "Administrator" role for admin users', () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.getByText("Administrator")).toBeInTheDocument();
    });
  });

  describe("Navigation Links", () => {
    it("should show Home link in mobile menu", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("should highlight active link", () => {
      mockUsePathname.mockReturnValue("/home");
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveClass("bg-primary-600");
    });

    it("should close mobile menu when link clicked", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const homeLink = screen.getByText("Home");
      fireEvent.click(homeLink);

      expect(screen.queryByText("Member")).not.toBeInTheDocument();
    });
  });

  describe("Admin Menu", () => {
    it("should show admin menu toggle for admin users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getAllByRole("button")[0];
      fireEvent.click(menuButton);

      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("should not show admin menu for regular users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const adminButtons = screen.queryAllByText("Admin");
      expect(adminButtons).toHaveLength(0);
    });

    it("should toggle admin submenu", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getAllByRole("button")[0];
      fireEvent.click(menuButton);

      const adminButton = screen.getByText("Admin").closest("button");
      if (adminButton) {
        fireEvent.click(adminButton);
        expect(screen.getByTestId("sidebar")).toBeInTheDocument();
      }
    });

    it("should show chevron icon that rotates", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const menuButton = screen.getAllByRole("button")[0];
      fireEvent.click(menuButton);

      const adminButton = screen.getByText("Admin").closest("button");
      const chevron = container.querySelector("svg.lucide-chevron-down");
      expect(chevron).toBeInTheDocument();

      if (adminButton) {
        fireEvent.click(adminButton);
        expect(chevron).toHaveClass("rotate-180");
      }
    });

    it("should highlight admin menu when on admin page", () => {
      mockUsePathname.mockReturnValue("/admin/members");
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getAllByRole("button")[0];
      fireEvent.click(menuButton);

      const adminButton = screen.getByText("Admin").closest("button");
      expect(adminButton).toHaveClass("bg-primary-600");
    });

    it("should render Sidebar with mobile prop", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getAllByRole("button")[0];
      fireEvent.click(menuButton);

      const adminButton = screen.getByText("Admin").closest("button");
      if (adminButton) {
        fireEvent.click(adminButton);
        expect(screen.getByText("Sidebar (Mobile)")).toBeInTheDocument();
      }
    });
  });

  describe("Sign Out", () => {
    it("should show sign out button in mobile menu", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });

    it("should call signOut with callback URL", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getAllByRole("button")[0];
      fireEvent.click(menuButton);

      const signOutButton = screen.getByText("Sign Out");
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
    });
  });

  describe("Styling and Layout", () => {
    it("should have sticky navigation", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("sticky", "top-0", "z-30");
    });

    it("should apply dark theme colors", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("bg-dark-900", "border-b", "border-dark-700");
    });

    it("should show backdrop when mobile menu open", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const backdrop = container.querySelector(".fixed.inset-0.bg-black");
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle user with no name gracefully", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      // Should still render without crashing
      expect(screen.getByText("Member")).toBeInTheDocument();
    });

    it("should handle null session", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });

    it("should handle undefined pathname", () => {
      mockUsePathname.mockReturnValue(undefined as any);
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });

  describe("Logo and Branding", () => {
    it("should render logo with correct size", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const logo = screen.getByTestId("logo");
      expect(logo).toHaveAttribute("data-size", "xxl");
      expect(logo).toHaveAttribute("data-showtext", "false");
    });

    it("should display BwB text with proper styling", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const bwbText = screen.getByText(SITE_NAME);
      expect(bwbText).toBeInTheDocument();
      expect(bwbText).toHaveClass(
        "text-2xl",
        "md:text-xl",
        "font-bold",
        "text-primary-400",
        "tracking-wide",
        "leading-tight"
      );
    });

    it("should display version information", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const version = screen.getByTestId("version");
      expect(version).toBeInTheDocument();
      expect(version).toHaveTextContent("v0.411.0");
    });

    it("should have proper logo container layout", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const logoContainer = container.querySelector(".flex.items-center.space-x-4");
      expect(logoContainer).toBeInTheDocument();
    });

    it("should style version text correctly", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const versionContainer = container.querySelector(".text-xs.text-gray-400.font-mono");
      expect(versionContainer).toBeInTheDocument();
    });
  });

  describe("Header Layout and Structure", () => {
    it("should have correct main navigation structure", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const nav = container.querySelector(
        "nav.bg-dark-900.border-b.border-dark-700.sticky.top-0.z-30"
      );
      expect(nav).toBeInTheDocument();
    });

    it("should have proper main container layout", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const mainContainer = container.querySelector(".max-w-7xl.mx-auto.px-4");
      expect(mainContainer).toBeInTheDocument();
    });

    it("should have correct height for navigation bar", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const flexContainer = container.querySelector(".flex.items-center.justify-between.h-16");
      expect(flexContainer).toBeInTheDocument();
    });

    it("should position desktop menu correctly", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const desktopMenu = container.querySelector(".hidden.md\\:flex.items-center.space-x-1");
      expect(desktopMenu).toBeInTheDocument();
    });

    it("should position mobile hamburger menu correctly", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const rightSide = container.querySelector(".flex.items-center.space-x-3");
      expect(rightSide).toBeInTheDocument();
    });
  });

  describe("Mobile Menu Layout", () => {
    it("should have correct mobile menu overlay structure", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const mobileMenu = container.querySelector(".md\\:hidden");
      expect(mobileMenu).toBeInTheDocument();
    });

    it("should have backdrop with correct styling", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const backdrop = container.querySelector(".fixed.inset-0.bg-black.bg-opacity-50.z-25");
      expect(backdrop).toBeInTheDocument();
    });

    it("should have slide-out menu with proper positioning", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const slideOutMenu = container.querySelector(
        ".fixed.top-16.left-0.right-0.bg-dark-900.border-b.border-dark-700.z-35.shadow-lg"
      );
      expect(slideOutMenu).toBeInTheDocument();
    });

    it("should have correct menu content padding", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const menuContent = container.querySelector(".px-4.py-6.space-y-4");
      expect(menuContent).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should hide desktop menu on mobile", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const desktopMenu = container.querySelector(".hidden.md\\:flex");
      expect(desktopMenu).toHaveClass("hidden", "md:flex");
    });

    it("should hide mobile menu button on desktop", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Navigation />);
      const mobileButton = container.querySelector("button.md\\:hidden");
      expect(mobileButton).toHaveClass("md:hidden");
    });

    it("should have responsive text sizing", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Navigation />);
      const bwbText = screen.getByText(SITE_NAME);
      expect(bwbText).toHaveClass("text-2xl", "md:text-xl");
    });
  });
});
