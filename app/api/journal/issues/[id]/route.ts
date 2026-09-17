import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

const issueInclude = {
  editor: { select: { id: true, displayName: true, username: true } },
  coverPhoto: { select: { id: true, title: true, mimeType: true } },
  _count: { select: { children: true } },
};

// PUT /api/journal/issues/[id] - Update issue (top-level Journal record, ADMIN only)
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

  const issue = await prisma.journal.findUnique({ where: { id } });
  if (!issue || issue.parentId !== null) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { title, subtitle, content, editorId, publishedAt } = body;

  if (title !== undefined && !String(title).trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let publishedAtDate: Date | null | undefined;
  if (publishedAt !== undefined) {
    if (!publishedAt) {
      publishedAtDate = null;
    } else {
      const d = new Date(publishedAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "Invalid publishedAt date" },
          { status: 400 },
        );
      }
      publishedAtDate = d;
    }
  }

  const updated = await prisma.journal.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(subtitle !== undefined && { subtitle: subtitle?.trim() || null }),
      ...(content !== undefined && { content }),
      ...(editorId !== undefined && { editorId: editorId || null }),
      ...(publishedAt !== undefined && { publishedAt: publishedAtDate }),
    },
    include: issueInclude,
  });

  return NextResponse.json(updated);
}

// DELETE /api/journal/issues/[id] - Delete issue (ADMIN only)
export async function DELETE(
  _request: NextRequest,
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

  const issue = await prisma.journal.findUnique({ where: { id } });
  if (!issue || issue.parentId !== null) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  // Unlink child articles before deleting
  await prisma.journal.updateMany({
    where: { parentId: id },
    data: { parentId: null },
  });

  await prisma.journal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
