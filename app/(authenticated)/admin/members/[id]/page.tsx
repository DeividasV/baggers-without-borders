import { UserProfile } from "@/components/features";

export const metadata = {
  title: "Member Details - Admin",
  description: "View member profile and account details",
};

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Middleware ensures user is authenticated and is ADMIN

  const { id } = await params;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <UserProfile userId={id} />
    </main>
  );
}
