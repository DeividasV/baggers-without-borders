import { getSession } from "@/src/lib/api-auth";
import { isJournalEditor } from "@/src/lib/journal-auth";
import JournalManagement from "@/app/components/features/journal/JournalManagement";
import Link from "next/link";
import { BookOpen, Settings } from "lucide-react";

export default async function AdminJournalPage() {
  const session = await getSession();
  const isEditor = await isJournalEditor(session.user.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Journal</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage articles, issues, and publishing workflow.
            {isEditor && (
              <span className="ml-2 text-xs bg-primary-900/50 text-primary-300 border border-primary-800 px-2 py-0.5 rounded-full">
                Editor
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/journal/issues"
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Issues
          </Link>
          <Link
            href="/admin/settings#journal-editors"
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            Editors
          </Link>
        </div>
      </div>

      <JournalManagement isEditor={isEditor} />
    </main>
  );
}
