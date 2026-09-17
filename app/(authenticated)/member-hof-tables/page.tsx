import { HofTablesView } from "@/app/components/features/hof-tables";
import { Suspense } from "react";

export const metadata = {
  title: "Hall of Fame Tables",
  description: "Browse the Hall of Fame tables and achievements",
};

export default async function MemberHOFTablesPage() {
  // Middleware ensures user is authenticated
  // This version has sidebar and full member functionality
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-100">
            <div className="text-gray-400">Loading Hall of Fame data...</div>
          </div>
        }
      >
        <HofTablesView basePath="/member-hof-tables" />
      </Suspense>
    </main>
  );
}
