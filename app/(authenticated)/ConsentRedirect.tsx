"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Client component that handles redirect to consent prompt
 * Avoids NEXT_REDIRECT console errors by using client-side navigation
 */
export default function ConsentRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/consent-prompt");
  }, [router]);

  // Show minimal loading state while redirecting
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900">
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"
          aria-hidden="true"
        ></div>
        <p className="text-dark-200">Loading...</p>
      </div>
    </div>
  );
}
