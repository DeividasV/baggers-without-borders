import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { getUserConsentsDir } from "@/src/lib/constants";
import { prisma } from "@/src/lib/prisma";

// DELETE /api/users/[userId]/consents/[consentId]/attachments/[attachmentId] - Delete attachment
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; consentId: string; attachmentId: string }>;
  }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const { id, consentId, attachmentId } = await params;

    // Get attachment
    const attachment = await prisma.userConsentAttachment.findUnique({
      where: { id: attachmentId },
      include: { userConsent: true },
    });

    if (
      !attachment ||
      attachment.userConsent.id !== consentId ||
      attachment.userConsent.userId !== id
    ) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete file from disk
    try {
      const uploadsBaseDir = getUserConsentsDir();

      const filePath = path.join(uploadsBaseDir, attachment.filename);
      await unlink(filePath);
    } catch (fileError) {
      console.error("Error deleting file from disk:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.userConsentAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting consent attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
