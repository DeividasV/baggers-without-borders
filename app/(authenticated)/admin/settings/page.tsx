import { SettingsView } from "@/components/features";
import JournalSettingsSection from "@/components/features/journal/JournalSettingsSection";
import { prisma } from "@/src/lib/prisma";

export const metadata = {
  title: "Settings - Admin",
  description: "Configure application settings and system preferences",
};

export default async function AdminSettingsPage() {
  // Middleware ensures user is authenticated and is ADMIN

  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, displayName: true, username: true },
    orderBy: { displayName: "asc" },
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-8">
        <SettingsView />

        <section id="journal-editors" className="card">
          <h2 className="text-xl font-semibold text-white mb-2">Journal Editors</h2>
          <p className="text-gray-400 text-sm mb-4">
            Manage who can approve and publish Journal articles.
          </p>
          <JournalSettingsSection adminUsers={adminUsers} />
        </section>
      </div>
    </main>
  );
}
