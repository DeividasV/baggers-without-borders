import { notFound } from "next/navigation";
import { getSession } from "@/src/lib/api-auth";
import { isJournalEditor } from "@/src/lib/journal-auth";
import { prisma } from "@/src/lib/prisma";
import JournalEditor from "@/app/components/features/journal/JournalEditor";
import type { JournalArticleData } from "@/src/types/journal";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ backTo?: string }>;
}

export default async function EditJournalArticlePage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const session = await getSession();

  const [isEditor, article, parentIssues, allUsers, editorUsers, childCandidates] =
    await Promise.all([
      isJournalEditor(session.user.id),
      prisma.journal.findUnique({
        where: { id },
        include: {
          coverPhoto: true,
          photos: { orderBy: { order: "asc" } },
          parent: { select: { id: true, title: true, slug: true } },
          children: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              status: true,
              parentId: true,
              childOrder: true,
              publishedAt: true,
            },
            // Child articles are always displayed oldest-first based on publish time.
            // Manual ordering isn't used.
            orderBy: [{ publishedAt: "asc" }, { updatedAt: "asc" }, { id: "asc" }],
          },
          editor: { select: { id: true, displayName: true, username: true } },
          authors: {
            orderBy: { order: "asc" },
            include: {
              user: { select: { id: true, displayName: true, username: true } },
            },
          },
          createdBy: {
            select: { id: true, displayName: true, username: true },
          },
          approvedBy: {
            select: { id: true, displayName: true, username: true },
          },
        },
      }),
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
      prisma.journal.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          status: true,
          parentId: true,
          publishedAt: true,
          parent: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  if (!article) notFound();

  // Serialize dates for client component
  const serialized: JournalArticleData = {
    ...article,
    type: article.type as JournalArticleData["type"],
    status: article.status as JournalArticleData["status"],
    tableStyle: article.tableStyle as JournalArticleData["tableStyle"],
    coverPhoto: article.coverPhoto
      ? {
          ...article.coverPhoto,
          createdAt: article.coverPhoto.createdAt.toISOString(),
        }
      : null,
    photos: article.photos.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    parent: article.parent ?? null,
    children: article.children.map((c) => ({
      ...c,
      type: c.type as JournalArticleData["type"],
      status: c.status as JournalArticleData["status"],
      publishedAt: c.publishedAt?.toISOString() ?? null,
      parentId: c.parentId ?? null,
    })),
    editor: article.editor ?? null,
    authors: article.authors.map((a) => ({
      ...a,
      user: a.user ?? null,
    })),
    createdBy: article.createdBy,
    approvedBy: article.approvedBy ?? null,
    createdAt: article.createdAt.toISOString(),
    publishedAt: article.publishedAt?.toISOString() ?? null,
    updatedAt: article.updatedAt.toISOString(),
    parentId: article.parentId ?? null,
    editorId: article.editorId ?? null,
    coverPhotoId: article.coverPhotoId ?? null,
    approvedById: article.approvedById ?? null,
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <Link
          href={resolvedSearchParams.backTo ?? "/admin/journal"}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-all duration-200 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Journal
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-white">Edit Article</h1>
          <div className="flex items-center gap-4">
            {isEditor && (
              <a
                href={`/journal/preview/${article.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Preview ↗
              </a>
            )}
            {article.status === "PUBLISHED" && (
              <a
                href={`/journal/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                View live ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <JournalEditor
        article={serialized}
        parentIssues={parentIssues}
        allUsers={allUsers}
        editorUsers={editorUsers}
        isEditor={isEditor}
        backTo={resolvedSearchParams.backTo}
        childCandidates={childCandidates.map((c) => ({
          ...c,
          type: c.type as JournalArticleData["type"],
          status: c.status as JournalArticleData["status"],
          publishedAt: c.publishedAt?.toISOString() ?? null,
          parentId: c.parentId ?? null,
        }))}
      />
    </main>
  );
}
