import { InterestForm } from "@/components/features";

export const metadata = {
  title: "New Interest - Admin",
  description: "Create a new interest category for users",
};

export default async function NewInterestPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <InterestForm mode="create" />
    </main>
  );
}
