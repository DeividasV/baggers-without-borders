import Link from "next/link";
import { notFound } from "next/navigation";
import { getOptionalSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import JournalArticleView from "@/app/(authenticated)/journal/_components/JournalArticleView";
import type { JournalType } from "@/src/types/journal";

interface JournalPublishedArticlePageProps {
  params: Promise<{ slug: string }>;
  basePath: string;
  listLabel: string;
  allowedTypes: readonly JournalType[];
}

export default async function JournalPublishedArticlePage({
  params,
  basePath,
  listLabel,
  allowedTypes,
}: JournalPublishedArticlePageProps) {
  const { slug } = await params;
  const session = await getOptionalSession();
  const isAdmin = session?.user.role === "ADMIN";

  const article = await prisma.journal.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      type: { in: [...allowedTypes] },
    },
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
      status: "PUBLISHED",
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
      mode="published"
      listHref={basePath}
      listLabel={listLabel}
      detailBasePath={basePath}
      footer={
        <footer className="mt-10 pt-6 border-t border-dark-700 flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs text-gray-600">
            {article.approvedBy && <span>Reviewed by {article.approvedBy.displayName}</span>}
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href={`/admin/journal/${article.id}/edit`}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Edit this {isIssue ? "issue" : "article"} →
              </Link>
            )}
            {!session && (
              <Link
                href="/login"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Join as a member →
              </Link>
            )}
          </div>
        </footer>
      }
    />
  );
}
