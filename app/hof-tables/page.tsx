import { Suspense } from "react";
import { EXTERNAL_LINKS, OPERATOR_NAME, SOFTWARE_COPYRIGHT } from "@/src/config/site";
import Link from "next/link";
import type { Metadata } from "next";
import { HofTablesView } from "@/app/components/features/hof-tables";
import { Logo } from "@/app/components/ui";

export const metadata: Metadata = {
  title: "Hall of Fame Tables",
  description: "Explore Hall of Fame tables for climbing achievements across different categories",
};

export default function PublicHofTablesPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      {/* Simple Header */}
      <header className="border-b border-dark-800 bg-dark-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Logo className="h-10 w-10" />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white hover:text-primary-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium bg-primary-400 text-dark-950 rounded-lg hover:bg-primary-500 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
            </div>
          }
        >
          <HofTablesView />
        </Suspense>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-dark-800 bg-dark-900/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-dark-400">
            <div className="text-center sm:text-left">
              <p>{SOFTWARE_COPYRIGHT}</p>
              {OPERATOR_NAME && <p className="mt-1">Operated by {OPERATOR_NAME}</p>}
            </div>
            <nav className="flex gap-6">
              <Link href="/" className="hover:text-primary-400 transition-colors">
                Home
              </Link>
              {EXTERNAL_LINKS.about && (
                <a
                  href={EXTERNAL_LINKS.about}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-400 transition-colors"
                >
                  About
                </a>
              )}
              {EXTERNAL_LINKS.contact && (
                <a
                  href={EXTERNAL_LINKS.contact}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-400 transition-colors"
                >
                  Contact
                </a>
              )}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
