import { ConsentTypeManagement } from "@/components/features";

export const metadata = {
  title: "Consent Types - Admin",
  description: "Manage user consent types and privacy settings",
};

export default async function AdminConsentTypesPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <ConsentTypeManagement />
    </main>
  );
}
