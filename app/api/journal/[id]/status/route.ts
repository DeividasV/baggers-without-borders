import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { isJournalEditor } from "@/src/lib/journal-auth";
import { isJournalStatus, type JournalStatus } from "@/src/types/journal";

const TRANSITIONS: Record<JournalStatus, JournalStatus[]> = {
  DRAFT: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["DRAFT", "PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

// POST /api/journal/[id]/status - Transition article status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    select: { id: true, status: true, publishedAt: true },
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

  const { status: statusValue, publishedAt: publishedAtRaw } = body as {
    status?: unknown;
    publishedAt?: unknown;
  };

  if (statusValue === undefined || statusValue === null || statusValue === "") {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  if (!isJournalStatus(statusValue)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const newStatus = statusValue;

  const currentStatus = article.status as JournalStatus;
  const allowed = TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Cannot transition from ${currentStatus} to ${newStatus}`,
      },
      { status: 400 },
    );
  }

  // Publishing and archiving require editor role
  if (newStatus === "PUBLISHED" || newStatus === "ARCHIVED") {
    const editor = await isJournalEditor(session.user.id);
    if (!editor) {
      return NextResponse.json(
        { error: "Only Journal Editors can publish or archive articles" },
        { status: 403 },
      );
    }
  }

  let publishedAt: Date | null | undefined;
  if (newStatus === "PUBLISHED") {
    if (publishedAtRaw === undefined) {
      // If it was already set (e.g. editor saved it in metadata), keep it.
      if (!article.publishedAt) {
        return NextResponse.json(
          { error: "publishedAt is required to publish" },
          { status: 400 },
        );
      }
    } else if (publishedAtRaw === null || publishedAtRaw === "") {
      return NextResponse.json(
        { error: "publishedAt is required to publish" },
        { status: 400 },
      );
    } else {
      const d = new Date(String(publishedAtRaw));
      if (!Number.isFinite(d.getTime())) {
        return NextResponse.json(
          { error: "Invalid publishedAt" },
          { status: 400 },
        );
      }
      publishedAt = d;
    }
  }

  const updated = await prisma.journal.update({
    where: { id },
    data: {
      status: newStatus,
      ...(newStatus === "PUBLISHED" && {
        ...(publishedAt !== undefined && { publishedAt }),
        approvedById: session.user.id,
      }),
    },
    select: { id: true, status: true, publishedAt: true, approvedById: true },
  });

  return NextResponse.json(updated);
}
