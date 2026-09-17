import { HofEntryForm } from "@/components/features";

export const metadata = {
  title: "Edit Data Entry - Admin",
  description: "Edit Hall of Fame data entry",
};

export default async function EditHofEntryPage({ params }: { params: Promise<{ id: string }> }) {
  // Middleware ensures user is authenticated and is ADMIN

  const { id } = await params;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <HofEntryForm mode="edit" entryId={id} />
    </main>
  );
}
