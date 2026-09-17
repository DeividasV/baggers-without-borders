import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getOptionalSession } from "@/src/lib/api-auth";
import { isJournalEditor } from "@/src/lib/journal-auth";
import { prisma } from "@/src/lib/prisma";
import JournalArticleView from "@/app/(authenticated)/journal/_components/JournalArticleView";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JournalPreviewPage({ params }: Props) {
  const { id } = await params;
  const session = await getOptionalSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    notFound();
  }

  const editor = await isJournalEditor(session.user.id);
  if (!editor) {
    notFound();
  }

  const article = await prisma.journal.findUnique({
    where: { id },
    include: {
      coverPhoto: true,
      photos: { orderBy: { order: "asc" } },
      parent: { select: { id: true, title: true, slug: true } },
      editor: { select: { id: true, displayName: true } },
      authors: {
        orderBy: { order: "asc" },
        include: { user: { select: { id: true, displayName: true } } },
      },
      createdBy: { select: { id: true, displayName: true } },
      approvedBy: { select: { id: true, displayName: true } },
    },
  });

  if (!article) notFound();

  const isIssue = article.parentId === null;

  const childArticles = await prisma.journal.findMany({
    where: {
      parentId: article.id,
    },
    include: {
      coverPhoto: { select: { id: true, title: true, mimeType: true } },
      parent: { select: { id: true, title: true, slug: true } },
      editor: { select: { id: true, displayName: true, username: true } },
      authors: {
        orderBy: { order: "asc" },
        include: { user: { select: { id: true, displayName: true } } },
      },
      _count: { select: { children: true } },
    },
    orderBy: [{ publishedAt: "asc" }, { updatedAt: "asc" }],
  });

  return (
    <JournalArticleView
      article={{
        ...article,
        tableStyle: article.tableStyle as Parameters<
          typeof JournalArticleView
        >[0]["article"]["tableStyle"],
      }}
      childArticles={childArticles}
      mode="preview"
      footer={
        <footer className="mt-10 pt-6 border-t border-dark-700 flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs text-gray-600">
            {article.approvedBy && <span>Reviewed by {article.approvedBy.displayName}</span>}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/journal/${article.id}/edit`}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Edit this {isIssue ? "issue" : "article"} →
            </Link>
          </div>
        </footer>
      }
    />
  );
}
