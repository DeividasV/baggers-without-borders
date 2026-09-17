import { MyBagsManagement } from "@/features";

export const metadata = {
  title: "My Bags",
  description: "Manage your climbing and hiking equipment bags",
};

export default async function MyBagsPage() {
  // Middleware ensures user is authenticated
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <MyBagsManagement />
    </main>
  );
}
