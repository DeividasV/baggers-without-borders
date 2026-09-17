import { InterestManagement } from "@/components/features";

export const metadata = {
  title: "Interests - Admin",
  description: "Manage user interest categories and preferences",
};

export default async function AdminInterestsPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <InterestManagement />
    </main>
  );
}
