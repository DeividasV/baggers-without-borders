import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession, getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { uniqueSlug } from "@/src/lib/journal-utils";

const issueInclude = {
  editor: { select: { id: true, displayName: true, username: true } },
  coverPhoto: { select: { id: true, title: true, mimeType: true } },
  _count: { select: { children: true } },
};

// GET /api/journal/issues - List top-level journal records (issues)
export async function GET() {
  const session = await getOptionalSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const issues = await prisma.journal.findMany({
    where: {
      parentId: null,
      ...(isAdmin ? {} : { status: "PUBLISHED" }),
    },
    orderBy: { publishedAt: "desc" },
    include: issueInclude,
  });
  return NextResponse.json(issues);
}

// POST /api/journal/issues - Create a new issue (top-level article, ADMIN only)
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
  const { title, subtitle, content, editorId, publishedAt } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let publishedAtDate: Date | null = null;
  if (publishedAt) {
    const d = new Date(publishedAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json(
        { error: "Invalid publishedAt date" },
        { status: 400 },
      );
    }
    publishedAtDate = d;
  }

  const slug = await uniqueSlug(title);

  const issue = await prisma.journal.create({
    data: {
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      slug,
      content: content || "",
      status: "DRAFT",
      parentId: null, // always top-level
      editorId: editorId || null,
      publishedAt: publishedAtDate,
      createdById: session.user.id,
    },
    include: issueInclude,
  });

  return NextResponse.json(issue, { status: 201 });
}
