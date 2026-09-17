import { HofManagement } from "@/features";

export const metadata = {
  title: "Hall of Fame - Admin",
  description: "Manage Hall of Fame configurations and settings",
};

export default async function AdminHofsPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <HofManagement />
    </main>
  );
}
