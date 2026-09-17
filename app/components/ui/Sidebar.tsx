"use client";

import Link from "next/link";
import { SITE_NAME } from "@/src/config/site";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  Trophy,
  ChevronLeft,
  Home,
  LogOut,
  UserCircle,
  Database,
  Mountain,
  Table,
  HardDrive,
  Settings,
  Sliders,
  FolderOpen,
  FlaskConical,
  ScrollText,
  MessageSquare,
  BookOpen,
  HandHeart,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Logo from "./Logo";
import Version from "./Version";
import { LegalDocumentModal } from "@/app/components/features/legal";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

interface SidebarMenuItem {
  href: string;
  icon: typeof Home;
  label: string;
  activePath: string;
}

export default function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const isActive = useCallback(
    (path: string) => {
      if (path === "/home") {
        return pathname === path;
      }
      return pathname.startsWith(path);
    },
    [pathname]
  );

  // Base menu items for all users (memoized to prevent recreation)
  const baseMenuItems = useMemo<SidebarMenuItem[]>(
    () => [
      {
        href: "/home",
        icon: Home,
        label: "Home",
        activePath: "/home",
      },
      {
        href: "/journal",
        icon: BookOpen,
        label: "Journal",
        activePath: "/journal",
      },
      {
        href: "/member-hof-tables",
        icon: Table,
        label: "HoF Tables",
        activePath: "/member-hof-tables",
      },
      {
        href: "/awards",
        icon: Trophy,
        label: "Awards",
        activePath: "/awards",
      },
      {
        href: "/my-bags",
        icon: Mountain,
        label: "My Bags",
        activePath: "/my-bags",
      },
      {
        href: "/profile",
        icon: UserCircle,
        label: "My Profile",
        activePath: "/profile",
      },
      {
        href: "/sponsors",
        icon: HandHeart,
        label: "Sponsors",
        activePath: "/sponsors",
      },
    ],
    []
  );

  // Admin-only menu items (memoized to prevent recreation)
  const adminMenuItems = useMemo<SidebarMenuItem[]>(
    () => [
      {
        href: "/admin/members",
        icon: Users,
        label: "Members",
        activePath: "/admin/members",
      },
      {
        href: "/admin/journal",
        icon: BookOpen,
        label: "Journal Editor",
        activePath: "/admin/journal",
      },
      {
        href: "/admin/configuration",
        icon: Sliders,
        label: "Configuration",
        activePath: "/admin/configuration",
      },
      {
        href: "/admin/data-entry",
        icon: Database,
        label: "Data Entry",
        activePath: "/admin/data-entry",
      },
      {
        href: "/admin/documents",
        icon: FolderOpen,
        label: "Documents",
        activePath: "/admin/documents",
      },
      {
        href: "/admin/changes",
        icon: FileText,
        label: "Changes",
        activePath: "/admin/changes",
      },
      {
        href: "/admin/helpdesk",
        icon: MessageSquare,
        label: "Helpdesk",
        activePath: "/admin/helpdesk",
      },
      {
        href: "/admin/backups",
        icon: HardDrive,
        label: "Backups",
        activePath: "/admin/backups",
      },
      {
        href: "/admin/test-results",
        icon: FlaskConical,
        label: "Test Results",
        activePath: "/admin/test-results",
      },
      {
        href: "/admin/logs",
        icon: ScrollText,
        label: "Logs",
        activePath: "/admin/logs",
      },
      {
        href: "/admin/sponsors",
        icon: HandHeart,
        label: "Sponsors",
        activePath: "/admin/sponsors",
      },
      {
        href: "/admin/settings",
        icon: Settings,
        label: "Settings",
        activePath: "/admin/settings",
      },
    ],
    []
  );

  const handleLinkClick = useCallback(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [isMobile, onClose]);

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  if (isMobile) {
    return (
      <div className="bg-linear-to-b from-dark-900 via-dark-900 to-dark-950 h-full flex flex-col shadow-2xl">
        {/* Logo Header */}
        <div className="p-4 border-b border-dark-700 bg-dark-900/50 backdrop-blur-sm shrink-0">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-end space-x-2 hover:opacity-80 transition-opacity"
            aria-label="Go to home page"
          >
            <Logo showText={false} size="md" />
            <span className="text-lg font-bold text-primary-400 tracking-wide">{SITE_NAME}</span>
            <div className="text-xs text-gray-400 font-mono">
              <Version />
            </div>
          </Link>
        </div>

        {/* Navigation Items - Scrollable */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto overflow-x-hidden">
          {/* Home Section */}
          {baseMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.activePath ?? item.href)
                    ? "bg-primary-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-dark-800"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Admin Section */}
          {session?.user.role === "ADMIN" && adminMenuItems.length > 0 && (
            <>
              {/* Separator with Label */}
              <div className="pt-4 pb-1 px-3">
                <div className="relative">
                  <div className="border-t border-dark-700/50"></div>
                  <span className="absolute -top-2 right-0 bg-dark-900 pl-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </span>
                </div>
              </div>

              {/* Admin Menu Items */}
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive(item.activePath ?? item.href)
                        ? "bg-primary-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-dark-800"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Info & Sign Out - Bottom Section */}
        <div className="border-t border-dark-700 p-3 space-y-2 shrink-0">
          {/* User Info */}
          <div className="px-3 py-2">
            <div className="text-sm font-semibold text-white truncate">{session?.user.name}</div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>

          {/* Legal Links */}
          <div className="px-3 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-xs text-dark-400 hover:text-dark-200 transition-colors underline"
            >
              Privacy
            </button>
            <span className="text-dark-600">•</span>
            <button
              onClick={() => setShowTermsModal(true)}
              className="text-xs text-dark-400 hover:text-dark-200 transition-colors underline"
            >
              Terms
            </button>
          </div>
        </div>

        {/* Legal Document Modals */}
        <LegalDocumentModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          documentType="privacy-policy"
        />

        <LegalDocumentModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          documentType="terms-of-service"
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-linear-to-b from-dark-900 via-dark-900 to-dark-950 border-r border-dark-700 shadow-xl transition-all duration-300 h-full flex flex-col ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo Header with Collapse Button */}
      <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/50 backdrop-blur-sm shrink-0">
        <Link
          href="/"
          className="flex items-center space-x-2 min-w-0 hover:opacity-80 transition-opacity"
          aria-label="Go to home page"
        >
          {!isCollapsed && (
            <>
              <Logo showText={false} size="xl" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary-400 tracking-wide leading-tight">
                  {SITE_NAME}
                </span>
                <div className="text-xs text-gray-400 font-mono">
                  <Version />
                </div>
              </div>
            </>
          )}
          {isCollapsed && <Logo showText={false} size="md" />}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={`h-5 w-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navigation Items - Scrollable */}
      <nav
        className="p-3 space-y-1 flex-1 overflow-y-auto overflow-x-hidden"
        aria-label="Main navigation"
      >
        {/* Home Section */}
        {baseMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${
                isCollapsed ? "justify-center px-3" : "space-x-3 px-3"
              } py-2.5 rounded-lg transition-colors group ${
                isActive(item.activePath ?? item.href)
                  ? "bg-primary-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-dark-800"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}

        {/* Admin Section */}
        {session?.user.role === "ADMIN" && adminMenuItems.length > 0 && (
          <>
            {/* Separator with Label */}
            <div className="pt-4 pb-1">
              <div className="relative px-3">
                <div className="border-t border-dark-700/50"></div>
                {!isCollapsed && (
                  <span className="absolute -top-2 right-3 bg-dark-900 pl-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Admin Menu Items */}
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center ${
                    isCollapsed ? "justify-center px-3" : "space-x-3 px-3"
                  } py-2.5 rounded-lg transition-colors group ${
                    isActive(item.activePath ?? item.href)
                      ? "bg-primary-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-dark-800"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Info & Sign Out - Bottom Section */}
      <div className="border-t border-dark-700 p-3 space-y-2 shrink-0">
        {!isCollapsed ? (
          <>
            {/* User Info */}
            <div className="px-3 py-2">
              <div className="text-sm font-semibold text-white truncate">{session?.user.name}</div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>

            {/* Legal Links */}
            <div className="px-3 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-xs text-dark-400 hover:text-dark-200 transition-colors underline"
              >
                Privacy
              </button>
              <span className="text-dark-600">•</span>
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-xs text-dark-400 hover:text-dark-200 transition-colors underline"
              >
                Terms
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-3 py-2.5 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5 shrink-0" />
          </button>
        )}
      </div>

      {/* Legal Document Modals */}
      <LegalDocumentModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        documentType="privacy-policy"
      />

      <LegalDocumentModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        documentType="terms-of-service"
      />
    </div>
  );
}
