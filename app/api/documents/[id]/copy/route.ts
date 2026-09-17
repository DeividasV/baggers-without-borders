import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { getDocumentsDir } from "@/src/lib/constants";
import * as fs from "fs/promises";
import * as path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { parentId } = await request.json();
    const { id: sourceId } = await params;

    // Get the source document
    const sourceDoc = await prisma.document.findUnique({
      where: { id: sourceId },
    });

    if (!sourceDoc) {
      return NextResponse.json(
        { error: "Source document not found" },
        { status: 404 }
      );
    }

    // If it's a file, copy the physical file
    if (!sourceDoc.isFolder && sourceDoc.filename) {
      // Get storage location from centralized config
      const uploadsDir = getDocumentsDir();
      const sourcePath = path.join(uploadsDir, sourceDoc.path);

      // Generate new filename for the copy
      const ext = path.extname(sourceDoc.filename);
      const nameWithoutExt = path.basename(sourceDoc.filename, ext);
      const timestamp = Date.now();
      const newFilename = `${nameWithoutExt}_copy_${timestamp}${ext}`;
      const destPath = path.join(uploadsDir, newFilename);

      // Copy the file
      await fs.copyFile(sourcePath, destPath);

      // Create database record for the copied file
      const copiedDoc = await prisma.document.create({
        data: {
          name: `${sourceDoc.name} (copy)`,
          isFolder: false,
          parentId: parentId,
          path: sourceDoc.path,
          filename: newFilename,
          originalName: sourceDoc.originalName,
          mimeType: sourceDoc.mimeType,
          size: sourceDoc.size,
        },
      });

      return NextResponse.json(copiedDoc);
    } else if (sourceDoc.isFolder) {
      // For folders, create a copy of the folder structure
      const copiedFolder = await prisma.document.create({
        data: {
          name: `${sourceDoc.name} (copy)`,
          isFolder: true,
          parentId: parentId,
          path: sourceDoc.path,
          filename: null,
          originalName: null,
          mimeType: null,
          size: null,
        },
      });

      // TODO: Recursively copy all contents of the folder
      // This is a complex operation and might need to be done in a background job

      return NextResponse.json(copiedFolder);
    }

    return NextResponse.json(
      { error: "Invalid document type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error copying document:", error);
    return NextResponse.json(
      { error: "Failed to copy document" },
      { status: 500 }
    );
  }
}
