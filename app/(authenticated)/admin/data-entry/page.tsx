import { HofEntryManagement } from "@/components/features";

export const metadata = {
  title: "Data Entry - Admin",
  description: "Manage Hall of Fame data entries and submissions",
};

export default async function AdminDataEntryPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <HofEntryManagement />
    </main>
  );
}
