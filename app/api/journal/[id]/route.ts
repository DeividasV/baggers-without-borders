import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { uniqueSlug } from "@/src/lib/journal-utils";
import { isJournalEditor } from "@/src/lib/journal-auth";
import { isJournalTableStyle, isJournalType } from "@/src/types/journal";

const articleInclude = {
  coverPhoto: true,
  photos: { orderBy: { order: "asc" as const } },
  parent: { select: { id: true, title: true, slug: true } },
  editor: { select: { id: true, displayName: true, username: true } },
  authors: {
    orderBy: { order: "asc" as const },
    include: {
      user: { select: { id: true, displayName: true, username: true } },
    },
  },
  createdBy: { select: { id: true, displayName: true, username: true } },
  approvedBy: { select: { id: true, displayName: true, username: true } },
};

// GET /api/journal/[id] - Get full article by ID (ADMIN only, all statuses)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await prisma.journal.findUnique({
    where: { id },
    include: articleInclude,
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

// PUT /api/journal/[id] - Update article (ADMIN only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session;
  try {
    session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await prisma.journal.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const {
    title,
    subtitle,
    content,
    type,
    tableStyle,
    parentId,
    editorId,
    coverPhotoId,
    slug: rawSlug,
    authors,
    publishedAt: publishedAtRaw,
  } = body;

  const hasUpdates =
    title !== undefined ||
    subtitle !== undefined ||
    content !== undefined ||
    type !== undefined ||
    tableStyle !== undefined ||
    parentId !== undefined ||
    editorId !== undefined ||
    coverPhotoId !== undefined ||
    rawSlug !== undefined ||
    authors !== undefined ||
    publishedAtRaw !== undefined;

  // Editing a published article (including changing published date/time) requires Journal Editor role.
  if (hasUpdates && article.status === "PUBLISHED") {
    const editor = await isJournalEditor(session.user.id);
    if (!editor) {
      return NextResponse.json(
        { error: "Only Journal Editors can edit published articles" },
        { status: 403 }
      );
    }
  }

  if (title !== undefined && !String(title).trim()) {
    return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
  }

  if (type !== undefined && !isJournalType(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (tableStyle !== undefined && !isJournalTableStyle(tableStyle)) {
    return NextResponse.json({ error: "Invalid table style" }, { status: 400 });
  }

  let slug: string | undefined;
  if (rawSlug !== undefined) {
    const slugSource =
      (typeof rawSlug === "string" ? rawSlug.trim() : "") ||
      (typeof title === "string" ? title.trim() : "");

    if (!slugSource) {
      return NextResponse.json(
        { error: "Slug requires a non-empty slug or title" },
        { status: 400 }
      );
    }

    slug = await uniqueSlug(slugSource, id);
  }

  if (authors !== undefined && !Array.isArray(authors)) {
    return NextResponse.json({ error: "Invalid authors" }, { status: 400 });
  }

  let publishedAt: Date | null | undefined;
  if (publishedAtRaw !== undefined) {
    if (publishedAtRaw === null || publishedAtRaw === "") {
      publishedAt = null;
    } else {
      const d = new Date(publishedAtRaw);
      if (!Number.isFinite(d.getTime())) {
        return NextResponse.json({ error: "Invalid publishedAt" }, { status: 400 });
      }
      publishedAt = d;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Replace authors if provided
    if (authors !== undefined) {
      await tx.journalAuthor.deleteMany({ where: { journalId: id } });
      if (authors.length > 0) {
        await tx.journalAuthor.createMany({
          data: authors.map((a: { userId?: string; name?: string; order?: number }, i: number) => ({
            journalId: id,
            userId: a.userId || null,
            name: a.name || null,
            order: a.order ?? i,
          })),
        });
      }
    }

    return tx.journal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(subtitle !== undefined && { subtitle: subtitle?.trim() || null }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(tableStyle !== undefined && { tableStyle }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(editorId !== undefined && { editorId: editorId || null }),
        ...(coverPhotoId !== undefined && {
          coverPhotoId: coverPhotoId || null,
        }),
        ...(slug !== undefined && { slug }),
        ...(publishedAt !== undefined && { publishedAt }),
      },
      include: articleInclude,
    });
  });

  return NextResponse.json(updated);
}

// DELETE /api/journal/[id] - Delete article (ADMIN, only DRAFT or ARCHIVED)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await prisma.journal.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (article.status === "PUBLISHED" || article.status === "PENDING_REVIEW") {
    return NextResponse.json(
      {
        error: "Cannot delete a published or pending-review article. Archive it first.",
      },
      { status: 400 }
    );
  }

  await prisma.journal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
