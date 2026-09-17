import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// GET /api/journal/slug/[slug] - Get published article by slug (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const article = await prisma.journal.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      coverPhoto: true,
      photos: { orderBy: { order: "asc" } },
      parent: { select: { id: true, title: true, slug: true } },
      editor: { select: { id: true, displayName: true, username: true } },
      authors: {
        orderBy: { order: "asc" },
        include: {
          user: { select: { id: true, displayName: true } },
        },
      },
      createdBy: { select: { id: true, displayName: true } },
      approvedBy: { select: { id: true, displayName: true } },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}
