import { HofForm } from "@/features";

export const metadata = {
  title: "New Hall of Fame - Admin",
  description: "Create a new Hall of Fame configuration",
};

export default async function NewHofPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <HofForm mode="create" />
    </main>
  );
}
