import { YearManagement } from "@/features";

export const metadata = {
  title: "Years - Admin",
  description: "Manage climbing and hiking years and seasons",
};

export default async function AdminYearsPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <YearManagement />
    </main>
  );
}
