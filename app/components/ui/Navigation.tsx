"use client";

import { signOut, useSession } from "next-auth/react";
import { SITE_NAME } from "@/src/config/site";
import { Home, Menu, X, LogOut, ChevronDown, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/ui/Logo";
import Version from "./Version";
import Sidebar from "./Sidebar";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileAdminOpen, setIsMobileAdminOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isAdminActive = pathname?.startsWith("/admin");

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="bg-dark-900 border-b border-dark-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Logo showText={false} size="xxl" />
              <div className="flex flex-col">
                <span className="text-2xl md:text-xl font-bold text-primary-400 tracking-wide leading-tight">
                  {SITE_NAME}
                </span>
                <div className="text-xs text-gray-400 font-mono">
                  <Version />
                </div>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {session?.user.role === "ADMIN" && (
                <div className="text-sm font-medium text-gray-400 px-4 py-2">Admin Panel</div>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-3">
              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-25"
            aria-hidden="true"
            onClick={() => setIsMobileMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsMobileMenuOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />

          {/* Slide-out Menu */}
          <div className="fixed top-16 left-0 right-0 bg-dark-900 border-b border-dark-700 z-35 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {/* User Info */}
              <div className="border-b border-dark-700 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {session?.user.name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{session?.user.name}</div>
                    <div className="text-gray-400 text-sm">
                      {session?.user.role === "ADMIN" ? "Administrator" : "Member"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">
                <Link
                  href="/home"
                  onClick={closeMobileMenu}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                    isActive("/home")
                      ? "bg-primary-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-dark-800"
                  }`}
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </Link>

                {session?.user.role === "ADMIN" && (
                  <div className="space-y-2">
                    {/* Admin Menu Header */}
                    <button
                      onClick={() => setIsMobileAdminOpen(!isMobileAdminOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-left transition-colors ${
                        isAdminActive
                          ? "bg-primary-600 text-white"
                          : "text-gray-300 hover:text-white hover:bg-dark-800"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Settings className="h-5 w-5" />
                        <span>Admin</span>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          isMobileAdminOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Admin Submenu */}
                    {isMobileAdminOpen && (
                      <div className="ml-4 space-y-2 border-l-2 border-dark-700 pl-4">
                        <Sidebar isMobile={true} onClose={closeMobileMenu} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sign Out */}
              <div className="border-t border-dark-700 pt-4">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-800 rounded-md transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
