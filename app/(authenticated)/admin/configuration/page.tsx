import { ConfigurationManagement } from "@/features";
import Breadcrumbs from "@/ui/Breadcrumbs";

export const metadata = {
  title: "Configuration - Admin",
  description: "Manage Hall of Fame year configurations and rules",
};

export default async function AdminHofConfigsPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Breadcrumbs items={[{ label: "Admin" }, { label: "Configuration" }]} />
      <ConfigurationManagement />
    </main>
  );
}
