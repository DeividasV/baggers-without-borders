import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import Sidebar from "@/app/components/ui/Sidebar";
import { SITE_NAME } from "@/src/config/site";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/app/components/ui/Logo", () => {
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
        Logo {size} {showText && "with text"}
      </div>
    );
  };
});

jest.mock("@/app/components/ui/Version", () => {
  return function MockVersion() {
    return <span data-testid="version">v0.411.0</span>;
  };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe("Sidebar Component", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/home");
    mockUseSearchParams.mockReturnValue({
      get: jest.fn(() => null),
    } as any);
    mockSignOut.mockResolvedValue(undefined as any);
    jest.clearAllMocks();
  });

  describe("Desktop Mode - Basic Rendering", () => {
    it("should render sidebar in desktop mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });

    it("should render all base menu items for members", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Journal")).toBeInTheDocument();
      expect(screen.getByText("Awards")).toBeInTheDocument();
      expect(screen.getByText("HoF Tables")).toBeInTheDocument();
      expect(screen.getByText("My Bags")).toBeInTheDocument();
      expect(screen.getByText("My Profile")).toBeInTheDocument();
    });

    it("should render admin menu items for admin users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Configuration")).toBeInTheDocument();
      expect(screen.getByText("Data Entry")).toBeInTheDocument();
      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("Changes")).toBeInTheDocument();
      expect(screen.getByText("Backups")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should not render admin items for regular users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.queryByText("Members")).not.toBeInTheDocument();
      expect(screen.queryByText("Configuration")).not.toBeInTheDocument();
    });

    it("should render admin separator for admin users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("should render collapse button", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByLabelText("Collapse sidebar")).toBeInTheDocument();
    });

    it("should render user name", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should render sign out button", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });
  });

  describe("Desktop Mode - Collapse Functionality", () => {
    it("should toggle collapsed state when collapse button clicked", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const collapseButton = screen.getByLabelText("Collapse sidebar");

      // Initially expanded (w-64)
      const sidebar = container.firstChild;
      expect(sidebar).toHaveClass("w-64");

      // Click to collapse
      fireEvent.click(collapseButton);

      expect(sidebar).toHaveClass("w-16");
      expect(screen.getByLabelText("Expand sidebar")).toBeInTheDocument();
    });

    it("should hide text labels when collapsed", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const collapseButton = screen.getByLabelText("Collapse sidebar");

      fireEvent.click(collapseButton);

      // Text should not be visible
      expect(screen.queryByText("Home")).not.toBeInTheDocument();
      expect(screen.queryByText("HoF Tables")).not.toBeInTheDocument();
    });

    it("should keep logo visible and clickable when collapsed", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const collapseButton = screen.getByLabelText("Collapse sidebar");

      expect(screen.getByTestId("logo")).toBeInTheDocument();

      fireEvent.click(collapseButton);

      // Logo should still be visible when collapsed (wrapped in clickable link to landing page)
      expect(screen.getByTestId("logo")).toBeInTheDocument();
      expect(screen.getByTestId("logo").closest("a")).toHaveAttribute("href", "/");
    });

    it("should rotate chevron icon when collapsed", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const collapseButton = screen.getByLabelText("Collapse sidebar");
      const chevron = container.querySelector("svg.lucide-chevron-left");

      expect(chevron).not.toHaveClass("rotate-180");

      fireEvent.click(collapseButton);

      expect(chevron).toHaveClass("rotate-180");
    });

    it("should hide user name when collapsed", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const collapseButton = screen.getByLabelText("Collapse sidebar");

      expect(screen.getByText("John Doe")).toBeInTheDocument();

      fireEvent.click(collapseButton);

      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });

    it("should show title attribute on links when collapsed", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const collapseButton = screen.getByLabelText("Collapse sidebar");

      fireEvent.click(collapseButton);

      const links = screen.getAllByRole("link");
      const homeLink = links.find((link) => link.getAttribute("title") === "Home");
      expect(homeLink).toBeInTheDocument();
    });

    it("should hide admin separator label when collapsed", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const collapseButton = screen.getByLabelText("Collapse sidebar");

      expect(screen.getByText("Admin")).toBeInTheDocument();

      fireEvent.click(collapseButton);

      expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    });
  });

  describe("Desktop Mode - Active Link Highlighting", () => {
    it("should highlight home link when on home page", () => {
      mockUsePathname.mockReturnValue("/home");
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveClass("bg-primary-600", "text-white");
    });

    it("should use exact match for home path", () => {
      mockUsePathname.mockReturnValue("/home/something");
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).not.toHaveClass("bg-primary-600");
    });

    it("should highlight profile link when on profile page", () => {
      mockUsePathname.mockReturnValue("/profile");
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const profileLink = screen.getByText("My Profile").closest("a");
      expect(profileLink).toHaveClass("bg-primary-600", "text-white");
    });

    it("should highlight admin link when on admin subpage", () => {
      mockUsePathname.mockReturnValue("/admin/members/123");
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const membersLink = screen.getByText("Members").closest("a");
      expect(membersLink).toHaveClass("bg-primary-600", "text-white");
    });

    it("should only highlight one link at a time", () => {
      mockUsePathname.mockReturnValue("/home");
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const homeLink = screen.getByText("Home").closest("a");
      const profileLink = screen.getByText("My Profile").closest("a");

      expect(homeLink).toHaveClass("bg-primary-600");
      expect(profileLink).not.toHaveClass("bg-primary-600");
    });
  });

  describe("Desktop Mode - Sign Out", () => {
    it("should call signOut when sign out button clicked", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const signOutButton = screen.getByText("Sign Out");
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
    });

    it("should show sign out button when collapsed", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const collapseButton = screen.getByLabelText("Collapse sidebar");
      fireEvent.click(collapseButton);

      const signOutButton = screen.getByTitle("Sign Out");
      expect(signOutButton).toBeInTheDocument();
    });
  });

  describe("Mobile Mode - Basic Rendering", () => {
    it("should render sidebar in mobile mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });

    it("should render all base menu items in mobile mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("HoF Tables")).toBeInTheDocument();
      expect(screen.getByText("My Bags")).toBeInTheDocument();
      expect(screen.getByText("My Profile")).toBeInTheDocument();
    });

    it("should not show collapse button in mobile mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      expect(screen.queryByLabelText("Collapse sidebar")).not.toBeInTheDocument();
    });

    it("should render admin items in mobile mode for admin users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Configuration")).toBeInTheDocument();
    });

    it("should show user name in mobile mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should show sign out button in mobile mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });
  });

  describe("Mobile Mode - onClose Callback", () => {
    it("should call onClose when link clicked in mobile mode", () => {
      const onClose = jest.fn();
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} onClose={onClose} />);
      const homeLink = screen.getByText("Home");
      fireEvent.click(homeLink);

      expect(onClose).toHaveBeenCalled();
    });

    it("should call onClose for each link click", () => {
      const onClose = jest.fn();
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} onClose={onClose} />);

      fireEvent.click(screen.getByText("Home"));
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText("My Bags"));
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("should call onClose for admin links in mobile mode", () => {
      const onClose = jest.fn();
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} onClose={onClose} />);
      fireEvent.click(screen.getByText("Members"));

      expect(onClose).toHaveBeenCalled();
    });

    it("should not call onClose in desktop mode", () => {
      const onClose = jest.fn();
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={false} onClose={onClose} />);
      const homeLink = screen.getByText("Home");
      fireEvent.click(homeLink);

      expect(onClose).not.toHaveBeenCalled();
    });

    it("should not throw error if onClose not provided in mobile mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      const homeLink = screen.getByText("Home");

      expect(() => fireEvent.click(homeLink)).not.toThrow();
    });
  });

  describe("Mobile Mode - Active Link Highlighting", () => {
    it("should highlight active link in mobile mode", () => {
      mockUsePathname.mockReturnValue("/home");
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveClass("bg-primary-600", "text-white");
    });
  });

  describe("Mobile Mode - Sign Out", () => {
    it("should call signOut in mobile mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      const signOutButton = screen.getByText("Sign Out");
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
    });
  });

  describe("Menu Icons", () => {
    it("should render icons for all menu items", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const icons = container.querySelectorAll(
        "svg.lucide-home, svg.lucide-table, svg.lucide-mountain, svg.lucide-user-circle"
      );
      expect(icons.length).toBeGreaterThan(0);
    });

    it("should render admin icons for admin users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const adminIcons = container.querySelectorAll("svg.lucide-users, svg.lucide-sliders");
      expect(adminIcons.length).toBeGreaterThan(0);
    });

    it("should render logout icon", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const logoutIcon = container.querySelector("svg.lucide-log-out");
      expect(logoutIcon).toBeInTheDocument();
    });
  });

  describe("Styling and Layout", () => {
    it("should apply dark theme classes", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const sidebar = container.firstChild;
      expect(sidebar).toHaveClass("bg-linear-to-b", "from-dark-900");
    });

    it("should have border in desktop mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const sidebar = container.firstChild;
      expect(sidebar).toHaveClass("border-r", "border-dark-700");
    });

    it("should have shadow in mobile mode", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar isMobile={true} />);
      const sidebar = container.firstChild;
      expect(sidebar).toHaveClass("shadow-2xl");
    });

    it("should have transition classes for collapse animation", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const sidebar = container.firstChild;
      expect(sidebar).toHaveClass("transition-all", "duration-300");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null session gracefully", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("should handle user with no name", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("should handle undefined pathname", () => {
      mockUsePathname.mockReturnValue("" as any);
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("should render without session", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });

    it("should handle very long user names", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "A".repeat(100), role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const userName = container.querySelector(".truncate");
      expect(userName).toBeInTheDocument();
    });
  });

  describe("Menu Item Links", () => {
    it("should have correct hrefs for base menu items", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("Home").closest("a")).toHaveAttribute("href", "/home");
      expect(screen.getByText("HoF Tables").closest("a")).toHaveAttribute(
        "href",
        "/member-hof-tables"
      );
      expect(screen.getByText("My Bags").closest("a")).toHaveAttribute("href", "/my-bags");
      expect(screen.getByText("My Profile").closest("a")).toHaveAttribute("href", "/profile");
    });

    it("should have correct hrefs for admin menu items", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Admin User", role: "ADMIN" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText("Members").closest("a")).toHaveAttribute("href", "/admin/members");
      expect(screen.getByText("Configuration").closest("a")).toHaveAttribute(
        "href",
        "/admin/configuration"
      );
      expect(screen.getByText("Data Entry").closest("a")).toHaveAttribute(
        "href",
        "/admin/data-entry"
      );
    });
  });

  describe("Logo and Branding in Mobile", () => {
    it("should render mobile logo with correct size", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      const logo = screen.getByTestId("logo");
      expect(logo).toHaveAttribute("data-size", "md");
      expect(logo).toHaveAttribute("data-showtext", "false");
    });

    it("should display BwB text in mobile sidebar", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      expect(screen.getByText(SITE_NAME)).toBeInTheDocument();
    });

    it("should display version information in mobile sidebar", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      const version = screen.getByTestId("version");
      expect(version).toBeInTheDocument();
      expect(version).toHaveTextContent("v0.411.0");
    });

    it("should have baseline alignment in mobile header", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar isMobile={true} />);
      const logoContainer = container.querySelector(".flex.items-end.space-x-2");
      expect(logoContainer).toBeInTheDocument();
    });

    it("should style mobile BwB text correctly", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar isMobile={true} />);
      const bwbText = screen.getByText(SITE_NAME);
      expect(bwbText).toHaveClass("text-lg", "font-bold", "text-primary-400", "tracking-wide");
    });

    it("should style mobile version text correctly", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar isMobile={true} />);
      const versionContainer = container.querySelector(".text-xs.text-gray-400.font-mono");
      expect(versionContainer).toBeInTheDocument();
    });
  });

  describe("Logo and Branding in Desktop", () => {
    it("should render desktop logo with correct size", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const logo = screen.getByTestId("logo");
      expect(logo).toHaveAttribute("data-size", "xl");
      expect(logo).toHaveAttribute("data-showtext", "false");
    });

    it("should display BwB text in desktop sidebar", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      expect(screen.getByText(SITE_NAME)).toBeInTheDocument();
    });

    it("should display version information in desktop sidebar", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const version = screen.getByTestId("version");
      expect(version).toBeInTheDocument();
      expect(version).toHaveTextContent("v0.411.0");
    });

    it("should have proper desktop header layout", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const headerContainer = container.querySelector(
        ".p-4.border-b.border-dark-700.flex.items-center.justify-between"
      );
      expect(headerContainer).toBeInTheDocument();
    });

    it("should style desktop BwB text correctly", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<Sidebar />);
      const bwbText = screen.getByText(SITE_NAME);
      expect(bwbText).toHaveClass(
        "text-xl",
        "font-bold",
        "text-primary-400",
        "tracking-wide",
        "leading-tight"
      );
    });
  });

  describe("Header Layout Structure", () => {
    it("should have correct mobile header padding", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar isMobile={true} />);
      const header = container.querySelector(".p-4.border-b.border-dark-700");
      expect(header).toBeInTheDocument();
    });

    it("should have correct desktop header with collapse button", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const collapseButton = container.querySelector('button[aria-label*="sidebar"]');
      expect(collapseButton).toBeInTheDocument();
    });

    it("should have proper background styling", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar />);
      const sidebar = container.querySelector(
        ".bg-linear-to-b.from-dark-900.via-dark-900.to-dark-950"
      );
      expect(sidebar).toBeInTheDocument();
    });

    it("should have correct mobile background styling", () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container } = render(<Sidebar isMobile={true} />);
      const sidebar = container.querySelector(
        ".bg-linear-to-b.from-dark-900.via-dark-900.to-dark-950.h-full.flex.flex-col.shadow-2xl"
      );
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe("Responsive Layout Differences", () => {
    it("should use different logo sizes for mobile vs desktop", () => {
      // Test mobile
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { rerender } = render(<Sidebar isMobile={true} />);
      let logo = screen.getByTestId("logo");
      expect(logo).toHaveAttribute("data-size", "md");

      // Test desktop
      rerender(<Sidebar />);
      logo = screen.getByTestId("logo");
      expect(logo).toHaveAttribute("data-size", "xl");
    });

    it("should use different text sizes for mobile vs desktop", () => {
      // Test mobile
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { rerender } = render(<Sidebar isMobile={true} />);
      let bwbText = screen.getByText(SITE_NAME);
      expect(bwbText).toHaveClass("text-lg");

      // Test desktop
      rerender(<Sidebar />);
      bwbText = screen.getByText(SITE_NAME);
      expect(bwbText).toHaveClass("text-xl");
    });

    it("should have different layout alignments", () => {
      // Test mobile (baseline alignment)
      mockUseSession.mockReturnValue({
        data: { user: { name: "John Doe", role: "MEMBER" } } as any,
        status: "authenticated",
        update: jest.fn(),
      });

      const { container, rerender } = render(<Sidebar isMobile={true} />);
      let logoContainer = container.querySelector(".flex.items-end");
      expect(logoContainer).toBeInTheDocument();

      // Test desktop (different layout structure)
      rerender(<Sidebar />);
      const desktopContainer = container.querySelector(".flex.items-center.space-x-2");
      expect(desktopContainer).toBeInTheDocument();
    });
  });
});
