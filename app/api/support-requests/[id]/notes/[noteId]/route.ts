import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession, getCurrentUserId, isAdmin } from "@/src/lib/api-auth";
import { EDIT_WINDOW_MS } from "@/src/lib/helpdesk-constants";
const MAX_CONTENT_LENGTH = 9999;

// PUT /api/support-requests/[id]/notes/[noteId] - Edit note (5min window, author only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const session = await getSession();
  if (!session || !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, noteId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const note = await prisma.ticketNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.ticketId !== id) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    // Check if user is the author
    if (note.authorId !== userId) {
      return NextResponse.json(
        { error: "Only the note author can edit" },
        { status: 403 },
      );
    }

    // SECURITY: 5-minute edit window enforcement
    // Why 5 minutes?
    // - Prevents historical tampering (admins can't rewrite old conversations)
    // - Allows quick typo fixes and clarifications (balance usability vs audit integrity)
    // - Uses server time to prevent client clock skew exploitation
    // - Creates immutable audit trail after window expires
    const now = Date.now();
    const createdAt = note.createdAt.getTime();
    const timeSinceCreation = now - createdAt;

    if (timeSinceCreation > EDIT_WINDOW_MS) {
      return NextResponse.json(
        { error: "Edit window expired (5 minutes)" },
        { status: 403 },
      );
    }

    const contentType = request.headers.get("content-type");
    let content: string;

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      content = formData.get("content") as string;
    } else {
      const body = await request.json();
      content = body.content;
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 },
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Note content exceeds ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 },
      );
    }

    const updatedNote = await prisma.ticketNote.update({
      where: { id: noteId },
      data: {
        content: content.trim(),
        isEdited: true,
        lastEditedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        attachments: true,
      },
    });

    return NextResponse.json({ data: updatedNote });
  } catch (error) {
    console.error("Error updating note:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update note",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/support-requests/[id]/notes/[noteId] - Delete note (author within 5min or any admin after)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const session = await getSession();
  if (!session || !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, noteId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const note = await prisma.ticketNote.findUnique({
      where: { id: noteId },
      include: { attachments: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.ticketId !== id) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const now = Date.now();
    const createdAt = note.createdAt.getTime();
    const timeSinceCreation = now - createdAt;
    const isAuthor = note.authorId === userId;
    const withinEditWindow = timeSinceCreation <= EDIT_WINDOW_MS;

    // Permission check: author within 5min OR any admin after 5min
    if (isAuthor && !withinEditWindow) {
      return NextResponse.json(
        { error: "You can only delete your notes within 5 minutes" },
        { status: 403 },
      );
    }

    // SECURITY: Collect file paths BEFORE deleting from database
    // Critical order: Read attachment paths → Delete DB records → Delete files
    // Why this sequence?
    // - Once DB deletion occurs, attachment records (with file paths) are GONE
    // - Reversing order would lose file paths, leaving orphaned files forever
    // - Orphaned files = disk space exhaustion vulnerability
    // - Gracefully handles missing files (log warning but continue)
    const fs = require("fs").promises;
    const path = require("path");
    const filePaths = note.attachments.map((attachment) =>
      path.join(process.cwd(), "public", attachment.path),
    );

    // Delete note from database (attachments cascade automatically via Prisma)
    await prisma.ticketNote.delete({
      where: { id: noteId },
    });

    // Then delete attachment files from disk
    const failedDeletions: string[] = [];
    for (const filepath of filePaths) {
      try {
        await fs.unlink(filepath);
      } catch (err) {
        console.error(`Failed to delete file ${filepath}:`, err);
        failedDeletions.push(filepath);
      }
    }

    // Log if any files couldn't be deleted (for background cleanup)
    if (failedDeletions.length > 0) {
      console.warn(
        `Failed to delete ${failedDeletions.length} file(s):`,
        failedDeletions,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
