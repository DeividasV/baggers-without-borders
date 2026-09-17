import { getSession } from "@/src/lib/api-auth";
import { isJournalEditor } from "@/src/lib/journal-auth";
import { prisma } from "@/src/lib/prisma";
import JournalEditor from "@/app/components/features/journal/JournalEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  searchParams: Promise<{ backTo?: string }>;
}

export default async function NewJournalArticlePage({ searchParams }: Props) {
  const session = await getSession();
  const resolvedSearchParams = await searchParams;
  const backTo = resolvedSearchParams.backTo ?? "/admin/journal";
  const [isEditor, parentIssues, allUsers, editorUsers] = await Promise.all([
    isJournalEditor(session.user.id),
    prisma.journal.findMany({
      where: { parentId: null },
      select: { id: true, title: true, slug: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, displayName: true, username: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true, displayName: true, username: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <Link
          href={backTo}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-all duration-200 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Journal
        </Link>
        <h1 className="text-2xl font-bold text-white">New Article</h1>
      </div>

      <JournalEditor
        parentIssues={parentIssues}
        allUsers={allUsers}
        editorUsers={editorUsers}
        isEditor={isEditor}
        backTo={backTo}
        childCandidates={[]}
      />
    </main>
  );
}
