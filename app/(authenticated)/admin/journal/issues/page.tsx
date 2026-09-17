import IssuesManagement from "@/app/components/features/journal/IssuesManagement";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function JournalIssuesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/admin/journal" className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-all duration-200 mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Journal
        </Link>
        <h1 className="text-2xl font-bold text-white">Journal Issues</h1>
        <p className="text-gray-400 text-sm mt-1">
          Magazine/edition groupings for articles (e.g. "Issue 1 – Spring 2025").
        </p>
      </div>

      <IssuesManagement />
    </main>
  );
}
