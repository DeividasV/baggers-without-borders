import dynamic from "next/dynamic";
import LoadingSpinner from "@/ui/LoadingSpinner";

// Dynamic import to reduce initial bundle size (admin-only feature)
const DocumentsManager = dynamic(
  () => import("@/features").then((mod) => ({ default: mod.DocumentsManager })),
  {
    loading: () => <LoadingSpinner size="lg" text="Loading document manager..." />,
  }
);

export const metadata = {
  title: "Documents - Admin",
  description: "Manage documents and files",
};

export default function DocumentsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <DocumentsManager />
    </main>
  );
}
