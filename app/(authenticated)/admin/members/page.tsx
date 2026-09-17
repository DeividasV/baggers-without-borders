import { MembersManagement } from "@/components/features";
import Breadcrumbs from "@/ui/Breadcrumbs";

export const metadata = {
  title: "Members - Admin",
  description: "Manage community members and user accounts",
};

export default async function AdminUsersPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Breadcrumbs items={[{ label: "Admin" }, { label: "Members" }]} />
      <MembersManagement />
    </main>
  );
}
