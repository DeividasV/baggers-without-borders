"use client";

import Sidebar from "@/components/ui/Sidebar";
import { SITE_NAME } from "@/src/config/site";
import Logo from "@/components/ui/Logo";
import Version from "@/components/ui/Version";
import { FundingStatusBar } from "@/features/donations";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        {session && (
          <div className="hidden md:block shrink-0 relative z-50">
            <Sidebar />
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobileSidebarOpen && session && (
          <div className="md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsMobileSidebarOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsMobileSidebarOpen(false);
              }}
              role="button"
              tabIndex={0}
              aria-label="Close sidebar"
            />
            {/* Sidebar */}
            <div className="fixed top-0 left-0 bottom-0 w-64 z-50">
              <Sidebar isMobile={true} onClose={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden bg-dark-900 border-b border-dark-700 p-4 flex items-center justify-between">
            <div className="flex items-end space-x-2">
              <Logo showText={false} size="md" />
              <span className="text-lg font-bold text-primary-400 tracking-wide">{SITE_NAME}</span>
              <div className="text-xs text-gray-400 font-mono">
                <Version />
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Funding status bar - visible to all members */}
          <FundingStatusBar />

          {/* Main Content - scrollable */}
          <div id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
