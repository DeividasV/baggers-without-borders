import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/src/lib/prisma";

// DELETE /api/consent-types/[id]/attachments/[attachmentId] - Delete attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const { id, attachmentId } = await params;

    // Find the attachment
    const attachment = await prisma.consentTypeAttachment.findFirst({
      where: {
        id: attachmentId,
        consentTypeId: id,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), "public", attachment.path);
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Error deleting file from disk:", error);
      // Continue even if file deletion fails
    }

    // Delete attachment from database
    await prisma.consentTypeAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json(
      { message: "Attachment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
