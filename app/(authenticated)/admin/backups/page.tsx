import dynamic from "next/dynamic";
import LoadingSpinner from "@/ui/LoadingSpinner";

// Dynamic import to reduce initial bundle size (admin-only feature)
const BackupsManagement = dynamic(
  () =>
    import("@/components/features").then((mod) => ({
      default: mod.BackupsManagement,
    })),
  {
    loading: () => (
      <LoadingSpinner size="lg" text="Loading backup management..." />
    ),
  }
);

export const metadata = {
  title: "Backups - Admin",
  description: "Manage database backups and system restore points",
};

export default async function AdminBackupPage() {
  // Middleware ensures user is authenticated and is ADMIN

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <BackupsManagement />
    </main>
  );
}
