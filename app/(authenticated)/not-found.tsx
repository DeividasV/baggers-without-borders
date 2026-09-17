"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function AuthenticatedNotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Message */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-dark-800 rounded-full flex items-center justify-center">
              <Search className="h-16 w-16 text-gray-600" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-primary-400">404</h1>
          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or you may not
            have permission to access it.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/home"
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            <Home className="h-5 w-5" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
