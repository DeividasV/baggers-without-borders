import { NextRequest, NextResponse } from "next/server";
import { getSession, getOptionalSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { uniqueSlug } from "@/src/lib/journal-utils";
import { Prisma } from "@prisma/client";
import { isJournalStatus, isJournalTableStyle, isJournalType } from "@/src/types/journal";

function parsePositiveInt(raw: string | null, defaultValue: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultValue;
  return parsed;
}

function parseJournalTypes(searchParams: URLSearchParams): string[] {
  const rawValues = [
    ...searchParams.getAll("type"),
    ...(searchParams.get("types")?.split(",") ?? []),
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(rawValues));
}

const articleInclude = {
  coverPhoto: true,
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

const cardInclude = {
  coverPhoto: { select: { id: true, title: true, mimeType: true } },
  parent: { select: { id: true, title: true, slug: true } },
  editor: { select: { id: true, displayName: true, username: true } },
  authors: {
    orderBy: { order: "asc" as const },
    include: {
      user: { select: { id: true, displayName: true } },
    },
  },
  _count: { select: { children: true, photos: true } },
};

// GET /api/journal - List articles
// Public: only PUBLISHED. Admin: all statuses.
export async function GET(request: NextRequest) {
  const session = await getOptionalSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId"); // "null" = top-level only, omit = all
  const statusRaw = searchParams.get("status") ?? undefined;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(50, parsePositiveInt(searchParams.get("limit"), 12));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search") ?? undefined;
  const typeValues = parseJournalTypes(searchParams);

  const where: Prisma.JournalWhereInput = {};

  if (isAdmin && statusRaw) {
    if (!isJournalStatus(statusRaw)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    where.status = statusRaw;
  } else if (!isAdmin) {
    where.status = "PUBLISHED";
  }

  if (typeValues.length > 0) {
    if (!typeValues.every((value) => isJournalType(value))) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    where.type = { in: typeValues };
  }

  // parentId filter: "null" string → top-level only; specific id → children of that parent
  if (parentId === "null") {
    where.parentId = null;
  } else if (parentId) {
    where.parentId = parentId;
  }

  if (search) {
    where.OR = [{ title: { contains: search } }, { subtitle: { contains: search } }];
  }

  const [articles, total] = await Promise.all([
    prisma.journal.findMany({
      where,
      include: cardInclude,
      orderBy:
        parentId && parentId !== "null"
          ? ([
              // For child lists, we want oldest/earliest first (respecting publish time).
              // When admins include non-published statuses (null publishedAt), keep them later.
              { status: "desc" },
              { publishedAt: "asc" },
              { updatedAt: "asc" },
            ] as const)
          : ({ publishedAt: "desc" } as const),
      skip,
      take: limit,
    }),
    prisma.journal.count({ where }),
  ]);

  return NextResponse.json({ articles, total, page, limit });
}

// POST /api/journal - Create article (ADMIN only)
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { title, subtitle, content, parentId, editorId, authors, type, tableStyle } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (type !== undefined && !isJournalType(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (tableStyle !== undefined && !isJournalTableStyle(tableStyle)) {
    return NextResponse.json({ error: "Invalid table style" }, { status: 400 });
  }

  const slug = await uniqueSlug(title);

  const article = await prisma.journal.create({
    data: {
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      slug,
      content: content || "",
      tableStyle: tableStyle ?? "legacy",
      type: type ?? "journal",
      status: "DRAFT",
      parentId: parentId || null,
      editorId: editorId || null,
      createdById: session.user.id,
      authors: authors?.length
        ? {
            create: authors.map(
              (a: { userId?: string; name?: string; order?: number }, i: number) => ({
                userId: a.userId || null,
                name: a.name || null,
                order: a.order ?? i,
              })
            ),
          }
        : undefined,
    },
    include: articleInclude,
  });

  return NextResponse.json(article, { status: 201 });
}
