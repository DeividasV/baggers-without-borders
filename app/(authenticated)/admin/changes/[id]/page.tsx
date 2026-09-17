"use client";

import { use, Suspense } from "react";
import { ChangeForm, ChangeRequestErrorBoundary } from "@/features";

export default function ChangeRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <ChangeRequestErrorBoundary>
        <Suspense fallback={<div className="p-8">Loading change request...</div>}>
          <ChangeForm mode="view" requestId={id} />
        </Suspense>
      </ChangeRequestErrorBoundary>
    </main>
  );
}
