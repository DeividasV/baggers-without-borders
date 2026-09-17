import { NextRequest, NextResponse } from "next/server";
import { getSession, getOptionalSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { getJournalPhotosDir } from "@/src/lib/constants";
import { unlink, readFile } from "fs/promises";
import path from "path";

// GET /api/journal/photos/[id] - Serve photo image (public for published articles)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const photo = await prisma.journalPhoto.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Resolve session once for all auth checks
  let cachedSession: Awaited<ReturnType<typeof getOptionalSession>> | undefined;
  const getSessionOnce = async () => {
    if (cachedSession === undefined) cachedSession = await getOptionalSession();
    return cachedSession;
  };

  const isAdmin = async (): Promise<boolean> => {
    const session = await getSessionOnce();
    return session?.user?.role === "ADMIN";
  };

  const requireAdmin = async () => {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return null;
  };

  let isPubliclyReferenced = false;
  let hasAnyReference = false;

  // If photo is attached to an article, enforce published/admin rules
  if (photo.journalId) {
    const article = await prisma.journal.findUnique({
      where: { id: photo.journalId },
      select: { status: true },
    });
    if (article) {
      hasAnyReference = true;
      if (article.status === "PUBLISHED") {
        isPubliclyReferenced = true;
      } else {
        const adminResponse = await requireAdmin();
        if (adminResponse) return adminResponse;
      }
    }
  }

  // If photo is used as a cover of any article, enforce published/admin rules
  const coverArticle = await prisma.journal.findFirst({
    where: { coverPhotoId: photo.id },
    select: { status: true },
  });
  if (coverArticle) {
    hasAnyReference = true;
    if (coverArticle.status === "PUBLISHED") {
      isPubliclyReferenced = true;
    } else {
      const adminResponse = await requireAdmin();
      if (adminResponse) return adminResponse;
    }
  }

  // Orphan photos (not attached anywhere) should be admin-only
  if (!hasAnyReference) {
    const adminResponse = await requireAdmin();
    if (adminResponse) return adminResponse;
  }

  try {
    const dir = path.resolve(getJournalPhotosDir());
    const filePath = path.resolve(dir, photo.filename);
    // Guard against path traversal
    if (!filePath.startsWith(dir + path.sep)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": photo.mimeType,
        "Cache-Control": isPubliclyReferenced
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
      },
    });
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? (error as { code?: string }).code
        : undefined;
    if (code === "ENOENT") {
      return NextResponse.json(
        { error: "Photo file not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to read photo" },
      { status: 500 },
    );
  }
}

// PATCH /api/journal/photos/[id] - Update photo metadata
export async function PATCH(
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

  const photo = await prisma.journalPhoto.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { title, caption, attribution, order, journalId } = body;

  const updated = await prisma.journalPhoto.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(caption !== undefined && { caption }),
      ...(attribution !== undefined && { attribution }),
      ...(order !== undefined && { order }),
      ...(journalId !== undefined && { journalId }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/journal/photos/[id] - Delete photo
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

  const photo = await prisma.journalPhoto.findUnique({
    where: { id },
    include: { coverOfJournal: { select: { id: true } } },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Unset cover photo if this photo is used as cover
  if (photo.coverOfJournal) {
    await prisma.journal.update({
      where: { id: photo.coverOfJournal.id },
      data: { coverPhotoId: null },
    });
  }

  // Delete file from disk (with path traversal guard)
  try {
    const dir = path.resolve(getJournalPhotosDir());
    const filePath = path.resolve(dir, photo.filename);
    if (filePath.startsWith(dir + path.sep)) {
      await unlink(filePath);
    }
  } catch {
    // File may not exist; continue with DB cleanup
  }

  await prisma.journalPhoto.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
