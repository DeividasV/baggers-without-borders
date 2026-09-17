"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import Logo from "@/ui/Logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="xxl" showText={false} />
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-red-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Something Went Wrong
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            We encountered an unexpected error. Please try again.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <details className="mt-4 text-left bg-dark-800 rounded-lg p-4">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 text-xs text-red-400 overflow-auto">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/home"
            className="flex items-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white rounded-lg transition-colors font-medium"
          >
            <Home className="h-5 w-5" />
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
