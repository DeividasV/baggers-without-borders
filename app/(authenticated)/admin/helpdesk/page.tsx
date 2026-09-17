import { HelpdeskManagement } from "@/app/components/features/helpdesk";

export const metadata = {
  title: "Helpdesk - Admin",
  description: "Manage user helpdesk tickets and contact submissions",
};

export default async function AdminSupportTicketsPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <HelpdeskManagement />
    </main>
  );
}
