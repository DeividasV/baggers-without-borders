"use client";

import { Suspense } from "react";
import { ChangeForm, ChangeRequestErrorBoundary } from "@/features";

export default function NewChangeRequestPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <ChangeRequestErrorBoundary>
        <Suspense fallback={<div className="p-8">Loading form...</div>}>
          <ChangeForm mode="create" />
        </Suspense>
      </ChangeRequestErrorBoundary>
    </main>
  );
}
