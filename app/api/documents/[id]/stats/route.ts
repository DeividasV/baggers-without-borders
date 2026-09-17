import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// Recursive function to get all descendants
async function getFolderStats(folderId: string) {
  const directChildren = await prisma.document.findMany({
    where: { parentId: folderId },
  });

  let stats = {
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    directFiles: 0,
    directFolders: 0,
    directSize: 0,
  };

  for (const child of directChildren) {
    if (child.isFolder) {
      stats.directFolders++;
      stats.totalFolders++;

      // Recursively get stats for subfolder
      const subStats = await getFolderStats(child.id);
      stats.totalFiles += subStats.totalFiles;
      stats.totalFolders += subStats.totalFolders;
      stats.totalSize += subStats.totalSize;
    } else {
      stats.directFiles++;
      stats.totalFiles++;
      const fileSize = child.size || 0;
      stats.directSize += fileSize;
      stats.totalSize += fileSize;
    }
  }

  return stats;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the folder document
    const folder = await prisma.document.findUnique({
      where: { id },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (!folder.isFolder) {
      return NextResponse.json({ error: "Not a folder" }, { status: 400 });
    }

    const stats = await getFolderStats(id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting folder stats:", error);
    return NextResponse.json(
      { error: "Failed to get folder statistics" },
      { status: 500 }
    );
  }
}
