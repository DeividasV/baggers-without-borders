import { ConfigurationForm } from "@/features";

export const metadata = {
  title: "Configuration Details - Admin",
  description: "View Hall of Fame year configuration details",
};

export default async function EditHofConfigPage({ params }: { params: Promise<{ id: string }> }) {
  // Middleware ensures user is authenticated and is ADMIN
  const { id } = await params;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <ConfigurationForm mode="edit" configId={id} />
    </main>
  );
}
