import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { getDocumentsDir } from "@/src/lib/constants";
import fs from "fs/promises";
import path from "path";
import { safeResolvePath } from "@/src/lib/fileUtils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (document.isFolder) {
      return NextResponse.json(
        { error: "Cannot read folder content" },
        { status: 400 },
      );
    }

    // Get storage location from centralized config
    const uploadsBaseDir = getDocumentsDir();

    // Safely resolve path (prevents traversal attacks)
    const filePath = safeResolvePath(uploadsBaseDir, document.path);
    if (!filePath) {
      console.error("Path traversal attempt detected:", {
        documentPath: document.path,
        uploadsBaseDir,
      });
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 },
      );
    }

    try {
      const content = await fs.readFile(filePath, "utf-8");
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    } catch (error) {
      console.error("Error reading file:", error, "Path:", filePath);
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Error getting file content:", error);
    return NextResponse.json(
      { error: "Failed to get file content" },
      { status: 500 },
    );
  }
}
