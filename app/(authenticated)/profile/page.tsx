import { UserOwnProfile } from "@/features";
import { getSession } from "@/src/lib/api-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Profile",
  description: "Manage your profile and account settings",
};

export default async function ProfilePage() {
  // Middleware ensures user is authenticated
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <UserOwnProfile userId={session.user.id} />
    </main>
  );
}
