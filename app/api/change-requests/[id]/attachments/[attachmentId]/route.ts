import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { resolveChangeRequestId } from "@/src/lib/changeRequestTickets";

// DELETE /api/change-requests/[id]/attachments/[attachmentId] - Delete attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { id, attachmentId } = await params;
    const resolvedId = await resolveChangeRequestId(id);

    if (!resolvedId) {
      return NextResponse.json({ error: "Change request not found." }, { status: 404 });
    }

    // Find the attachment
    const attachment = await prisma.changeRequestAttachment.findFirst({
      where: {
        id: attachmentId,
        changeRequestId: resolvedId,
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), "public", attachment.path);
      await unlink(filePath);
    } catch (error) {
      console.error("Error deleting file from disk:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.changeRequestAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ message: "Attachment deleted." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Couldn't delete this attachment. Try again." },
      { status: 500 }
    );
  }
}
