import { MyBagsForm } from "@/components/features";

export const metadata = {
  title: "Edit Bag - My Bags",
  description: "Edit your climbing and hiking equipment bag",
};

export default async function EditMyBagsPage({ params }: { params: Promise<{ id: string }> }) {
  // Middleware ensures user is authenticated
  const { id } = await params;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <MyBagsForm entryId={id} />
    </main>
  );
}
