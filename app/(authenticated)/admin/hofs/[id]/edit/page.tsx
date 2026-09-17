"use client";

import { use, Suspense } from "react";
import { HofForm } from "@/features";

export default function EditHofPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Suspense fallback={<div className="p-8">Loading form...</div>}>
        <HofForm mode="edit" hofId={id} />
      </Suspense>
    </main>
  );
}
