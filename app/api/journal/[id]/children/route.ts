import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

const MAX_CHILD_IDS = 200;

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === "string" && v.trim().length > 0)
  );
}

// PUT /api/journal/[id]/children - Set child articles (ADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

  let parent: { id: string; parentId: string | null } | null = null;
  try {
    parent = await prisma.journal.findUnique({
      where: { id },
      select: { id: true, parentId: true },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load article" },
      { status: 500 },
    );
  }
  if (!parent) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { childIds } = body;

  if (!isStringArray(childIds)) {
    return NextResponse.json(
      { error: "childIds must be an array of IDs" },
      { status: 400 },
    );
  }

  if (childIds.length > MAX_CHILD_IDS) {
    return NextResponse.json(
      { error: `Too many childIds (max ${MAX_CHILD_IDS})` },
      { status: 400 },
    );
  }

  if (childIds.includes(id)) {
    return NextResponse.json(
      { error: "An article cannot be its own child" },
      { status: 400 },
    );
  }

  const uniqueIds = Array.from(new Set(childIds.map((c) => c.trim())));
  if (uniqueIds.length !== childIds.length) {
    return NextResponse.json(
      { error: "childIds contains duplicates" },
      { status: 400 },
    );
  }

  // Prevent cycles: you can't assign any ancestor of the parent as its child.
  // (If A is an ancestor of parent P, setting A.parentId=P creates a loop.)
  try {
    const ancestorIds = new Set<string>();
    let currentParentId = parent.parentId;
    let steps = 0;
    while (currentParentId && steps < 50) {
      ancestorIds.add(currentParentId);
      const next = await prisma.journal.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });
      currentParentId = next?.parentId ?? null;
      steps += 1;
    }

    const invalid = uniqueIds.find((cid) => ancestorIds.has(cid));
    if (invalid) {
      return NextResponse.json(
        { error: "Invalid childIds (cycle detected)" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to validate childIds" },
      { status: 500 },
    );
  }

  let existing: Array<{
    id: string;
    publishedAt: Date | null;
    updatedAt: Date;
  }>;
  try {
    existing = await prisma.journal.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, publishedAt: true, updatedAt: true },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to validate childIds" },
      { status: 500 },
    );
  }
  const existingSet = new Set(existing.map((e) => e.id));
  const missing = uniqueIds.filter((cid) => !existingSet.has(cid));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Some childIds do not exist" },
      { status: 400 },
    );
  }

  // Always order children by publish time (oldest/earliest first).
  // For drafts without a publish time, keep them at the end and order by updatedAt (oldest first).
  const metaById = new Map(existing.map((e) => [e.id, e] as const));
  const sortedIds = [...uniqueIds].sort((a, b) => {
    const aMeta = metaById.get(a);
    const bMeta = metaById.get(b);
    if (!aMeta || !bMeta) return a.localeCompare(b);

    const aPublished = aMeta.publishedAt?.getTime() ?? null;
    const bPublished = bMeta.publishedAt?.getTime() ?? null;

    if (aPublished === null && bPublished !== null) return 1;
    if (aPublished !== null && bPublished === null) return -1;
    if (
      aPublished !== null &&
      bPublished !== null &&
      aPublished !== bPublished
    ) {
      return aPublished - bPublished;
    }

    const aUpdated = aMeta.updatedAt.getTime();
    const bUpdated = bMeta.updatedAt.getTime();
    if (aUpdated !== bUpdated) return aUpdated - bUpdated;
    return a.localeCompare(b);
  });

  let updatedChildren;
  try {
    updatedChildren = await prisma.$transaction(async (tx) => {
      // Unlink removed children
      if (uniqueIds.length === 0) {
        await tx.journal.updateMany({
          where: { parentId: id },
          data: { parentId: null, childOrder: 0 },
        });
      } else {
        await tx.journal.updateMany({
          where: { parentId: id, id: { notIn: uniqueIds } },
          data: { parentId: null, childOrder: 0 },
        });
      }

      // Link + order selected children
      await Promise.all(
        sortedIds.map((childId, index) =>
          tx.journal.update({
            where: { id: childId },
            data: { parentId: id, childOrder: index },
            select: { id: true },
          }),
        ),
      );

      return tx.journal.findMany({
        where: { parentId: id },
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
        orderBy: [{ publishedAt: "asc" }, { updatedAt: "asc" }, { id: "asc" }],
      });
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update child articles" },
      { status: 500 },
    );
  }

  return NextResponse.json({ children: updatedChildren });
}
