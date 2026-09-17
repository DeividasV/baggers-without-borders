"use client";

import { use, Suspense } from "react";
import { ConsentTypeForm } from "@/features";

export default function EditConsentTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Suspense fallback={<div className="p-8">Loading form...</div>}>
        <ConsentTypeForm mode="edit" consentTypeId={id} />
      </Suspense>
    </main>
  );
}
