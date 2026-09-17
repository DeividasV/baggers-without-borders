import { ChangeRequestErrorBoundary, ChangesManagement } from "@/components/features";

export const metadata = {
  title: "Change Requests - Admin",
  description: "Manage user change requests and data modifications",
};

export default async function AdminChangeRequestsPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <ChangeRequestErrorBoundary>
        <ChangesManagement />
      </ChangeRequestErrorBoundary>
    </main>
  );
}
