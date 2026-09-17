import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { getBackupDir } from "@/src/lib/constants";
import { EventType, EventStatus } from "@prisma/client";

// Backup directory - resolved through the shared helper so that listing,
// downloading, and the health check always agree on where archives live.
const BACKUP_DIR = getBackupDir();

// GET - Download a specific backup file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { filename } = await params;

    // Security: Validate filename to prevent directory traversal
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Only allow downloading backup files
    if (
      !(
        filename.startsWith("manual-backup-") ||
        filename.startsWith("auto-backup-") ||
        filename.startsWith("deploy-backup-") ||
        filename.startsWith("db-backup-") ||
        filename.startsWith("files-backup-")
      ) ||
      !filename.endsWith(".zip")
    ) {
      return NextResponse.json({ error: "Invalid backup file" }, { status: 400 });
    }

    const filePath = path.join(BACKUP_DIR, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Determine backup type from filename
    let backupType = "database";
    if (filename.startsWith("files-backup-")) {
      backupType = "files";
    }

    // Log backup download
    await logAdminAction(
      EventType.ADMIN_BACKUP_DOWNLOAD,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "Backup",
        resourceId: filename,
        actionDetails: {
          type: backupType,
          size: fileBuffer.length,
        },
      }
    );

    // Return file as download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading backup:", error);

    // Log failure
    if (session) {
      const params_resolved = await params;
      await logAdminAction(
        EventType.ADMIN_BACKUP_DOWNLOAD,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Backup",
          resourceId: params_resolved.filename,
          errorMessage: (error as Error).message,
        }
      );
    }

    return NextResponse.json({ error: "Failed to download backup" }, { status: 500 });
  }
}

// DELETE - Delete a specific backup file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { filename } = await params;

    // Security: Validate filename to prevent directory traversal
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Only allow deleting backup files
    if (
      !(
        filename.startsWith("manual-backup-") ||
        filename.startsWith("auto-backup-") ||
        filename.startsWith("deploy-backup-") ||
        filename.startsWith("db-backup-") ||
        filename.startsWith("files-backup-")
      ) ||
      !filename.endsWith(".zip")
    ) {
      return NextResponse.json({ error: "Invalid backup file" }, { status: 400 });
    }

    const filePath = path.join(BACKUP_DIR, filename);

    // Check if file exists and get stats
    let fileSize = 0;
    try {
      const stats = await fs.stat(filePath);
      fileSize = stats.size;
    } catch {
      return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
    }

    // Determine backup type from filename
    let backupType = "database";
    if (filename.startsWith("files-backup-")) {
      backupType = "files";
    }

    // Delete file
    await fs.unlink(filePath);

    // Log backup deletion
    await logAdminAction(
      EventType.ADMIN_BACKUP_DELETE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "Backup",
        resourceId: filename,
        actionDetails: {
          type: backupType,
          size: fileSize,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting backup:", error);

    // Log failure
    if (session) {
      const params_resolved = await params;
      await logAdminAction(
        EventType.ADMIN_BACKUP_DELETE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Backup",
          resourceId: params_resolved.filename,
          errorMessage: (error as Error).message,
        }
      );
    }

    return NextResponse.json({ error: "Failed to delete backup" }, { status: 500 });
  }
}
