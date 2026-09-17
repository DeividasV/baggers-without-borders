import { HofEntryForm } from "@/components/features";

export const metadata = {
  title: "New Data Entry - Admin",
  description: "Create a new Hall of Fame data entry",
};

export default async function NewHofEntryPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <HofEntryForm mode="create" />
    </main>
  );
}
