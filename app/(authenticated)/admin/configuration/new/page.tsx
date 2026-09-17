import { ConfigurationForm } from "@/features";

export const metadata = {
  title: "New Configuration - Admin",
  description: "Create a new Hall of Fame year configuration",
};

export default async function NewHofConfigPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <ConfigurationForm mode="create" />
    </main>
  );
}
