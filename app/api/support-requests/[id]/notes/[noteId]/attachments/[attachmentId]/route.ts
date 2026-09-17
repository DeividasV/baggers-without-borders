import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession, isAdmin } from "@/src/lib/api-auth";
import { unlink } from "fs/promises";
import { join } from "path";

// DELETE /api/support-requests/[id]/notes/[noteId]/attachments/[attachmentId] - Delete attachment (any admin)
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; noteId: string; attachmentId: string }>;
  },
) {
  const session = await getSession();
  if (!session || !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, noteId, attachmentId } = await params;
    const attachment = await prisma.ticketNoteAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      );
    }

    if (attachment.noteId !== noteId) {
      return NextResponse.json(
        { error: "Invalid attachment ID" },
        { status: 400 },
      );
    }

    // Delete from database
    await prisma.ticketNoteAttachment.delete({
      where: { id: attachmentId },
    });

    // Delete file from disk
    const filepath = join(process.cwd(), "public", attachment.path);
    try {
      await unlink(filepath);
    } catch (err) {
      console.error(`Failed to delete file ${filepath}:`, err);
      // Continue even if file deletion fails (file might not exist)
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 },
    );
  }
}
