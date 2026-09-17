import { YearForm } from "@/features";

export const metadata = {
  title: "New Year - Admin",
  description: "Create a new climbing or hiking year configuration",
};

export default async function NewYearPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <YearForm mode="create" />
    </main>
  );
}
