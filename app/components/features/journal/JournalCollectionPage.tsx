import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getOptionalSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import ArticleCard from "@/app/components/features/journal/ArticleCard";
import type { JournalCardData, JournalType } from "@/src/types/journal";

interface JournalCollectionPageProps {
  basePath: string;
  heading: string;
  emptyLabel: string;
  includedTypes: readonly JournalType[];
  searchParams: Promise<{ page?: string }>;
}

export default async function JournalCollectionPage({
  basePath,
  heading,
  emptyLabel,
  includedTypes,
  searchParams,
}: JournalCollectionPageProps) {
  const session = await getOptionalSession();
  const params = await searchParams;
  const isAdmin = session?.user.role === "ADMIN";

  const parsedPage = Number.parseInt(params.page ?? "", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    prisma.journal.findMany({
      where: {
        status: "PUBLISHED",
        parentId: null,
        type: { in: [...includedTypes] },
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
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.journal.count({
      where: {
        status: "PUBLISHED",
        parentId: null,
        type: { in: [...includedTypes] },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const serializedArticles: JournalCardData[] = articles.map((a) => ({
    ...a,
    type: a.type as JournalCardData["type"],
    status: a.status as JournalCardData["status"],
    coverPhoto: a.coverPhoto
      ? {
          id: a.coverPhoto.id,
          title: a.coverPhoto.title,
          mimeType: a.coverPhoto.mimeType,
        }
      : null,
    parent: a.parent ?? null,
    editor: a.editor ?? null,
    authors: a.authors.map((au) => ({ ...au, user: au.user ?? null })),
    publishedAt: a.publishedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    parentId: a.parentId ?? null,
    coverPhotoId: a.coverPhotoId ?? null,
    subtitle: a.subtitle ?? null,
    _count: a._count,
  }));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{heading}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {total} post{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/journal"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Manage Journal →
            </Link>
          )}
          {!session && (
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              Member login
            </Link>
          )}
        </div>
      </div>

      {serializedArticles.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <BookOpen className="h-12 w-12 mx-auto text-gray-600" />
          <p className="text-gray-400">{emptyLabel}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {serializedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                basePath={basePath}
                href={`${basePath}/${article.slug}`}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`${basePath}?page=${page - 1}`}
                  className="px-4 py-2 text-sm bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-gray-400">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`${basePath}?page=${page + 1}`}
                  className="px-4 py-2 text-sm bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
