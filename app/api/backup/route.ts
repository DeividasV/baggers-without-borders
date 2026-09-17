import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import archiver from "archiver";
import archiverZipEncrypted from "archiver-zip-encrypted";
import { formatFileSize, formatRelativeTime } from "@/src/lib/utils";
import { getBackupDir, getUploadsBaseDir } from "@/src/lib/constants";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

// Register the encrypted ZIP format
archiver.registerFormat("zip-encrypted", archiverZipEncrypted);

// Backup directory - resolved through the shared helper so that listing,
// downloading, and the health check always agree on where archives live.
const BACKUP_DIR = getBackupDir();
const BACKUP_PASSWORD = process.env.BACKUP_PASSWORD || "default-password-change-me";

// Database path - handle Prisma's file: prefix
const DB_URL = process.env.DATABASE_URL || "file:./dev.db";
const DB_PATH = DB_URL.replace("file:", "");
// Resolve relative to project root, assuming Prisma schema is in prisma/
const DB_FULL_PATH = path.isAbsolute(DB_PATH)
  ? DB_PATH
  : path.join(process.cwd(), "prisma", path.basename(DB_PATH));

// GET - List all backup files
export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    // Ensure backup directory exists
    try {
      await fs.access(BACKUP_DIR);
    } catch {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      return NextResponse.json({ backups: [] });
    }

    // Read directory contents
    const files = await fs.readdir(BACKUP_DIR);

    // Filter and get stats for backup files
    const backups = await Promise.all(
      files
        .filter(
          (file) =>
            (file.startsWith("manual-backup-") ||
              file.startsWith("auto-backup-") ||
              file.startsWith("deploy-backup-") ||
              file.startsWith("db-backup-") ||
              file.startsWith("files-backup-")) &&
            file.endsWith(".zip")
        )
        .map(async (file) => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = await fs.stat(filePath);

          // Determine backup type
          let type = "database";
          if (file.startsWith("files-backup-")) {
            type = "files";
          }

          return {
            filename: file,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            createdAt: stats.mtime.toISOString(),
            relativeTime: formatRelativeTime(stats.mtime),
            type,
          };
        })
    );

    // Sort by creation date, newest first
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ backups });
  } catch (error) {
    console.error("Error listing backups:", error);
    // Return more detailed error info for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to list backups", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Create a new backup
export async function POST(request: NextRequest) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN
    const body = await request.json().catch(() => ({}));
    const backupType = body.type || "database"; // 'database' or 'files'

    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Generate backup filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\..+/, "")
      .replace("T", "-");

    if (backupType === "files") {
      let uploadsDir: string;
      try {
        uploadsDir = getUploadsBaseDir();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Uploads directory not configured";
        return NextResponse.json(
          { error: "Uploads directory not configured", details: message },
          { status: 500 }
        );
      }

      // Create file backup
      const backupFilename = `files-backup-${timestamp}.zip`;
      const backupPath = path.join(BACKUP_DIR, backupFilename);

      // Check if uploads directory exists
      try {
        await fs.access(uploadsDir);
      } catch {
        return NextResponse.json({ error: "Uploads directory not found" }, { status: 404 });
      }

      // Create password-protected ZIP with all files from uploads
      const output = fsSync.createWriteStream(backupPath);
      const archive = archiver(
        "zip-encrypted" as any,
        {
          zlib: { level: 9 },
          encryptionMethod: "aes256" as any,
          password: BACKUP_PASSWORD,
        } as any
      );

      await new Promise<void>((resolve, reject) => {
        output.on("close", () => resolve());
        output.on("error", reject);
        archive.on("error", reject);

        archive.pipe(output);

        // Add all files from uploads directory recursively
        archive.directory(uploadsDir, "uploads");
        archive.finalize();
      });

      // Get file stats
      const stats = await fs.stat(backupPath);

      // Log backup creation
      await logAdminAction(
        EventType.ADMIN_BACKUP_CREATE,
        EventStatus.SUCCESS,
        request.headers,
        session.user.id,
        {
          resourceType: "Backup",
          resourceId: backupFilename,
          actionDetails: {
            type: "files",
            size: stats.size,
            directory: uploadsDir,
          },
        }
      );

      return NextResponse.json({
        success: true,
        backup: {
          filename: backupFilename,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          createdAt: stats.mtime.toISOString(),
          relativeTime: formatRelativeTime(stats.mtime),
          type: "files",
        },
      });
    } else {
      // Create database backup (original logic)
      const backupFilename = `manual-backup-${timestamp}.zip`;
      const backupPath = path.join(BACKUP_DIR, backupFilename);
      const tempDbPath = path.join(BACKUP_DIR, `temp-${timestamp}.db`);

      // Check if database file exists
      try {
        await fs.access(DB_FULL_PATH);
      } catch {
        return NextResponse.json({ error: "Database file not found" }, { status: 404 });
      }

      // Copy database file to temp location
      await fs.copyFile(DB_FULL_PATH, tempDbPath);

      // Create password-protected ZIP
      const output = fsSync.createWriteStream(backupPath);
      const archive = archiver(
        "zip-encrypted" as any,
        {
          zlib: { level: 9 },
          encryptionMethod: "aes256" as any,
          password: BACKUP_PASSWORD,
        } as any
      );

      await new Promise<void>((resolve, reject) => {
        output.on("close", () => resolve());
        output.on("error", reject);
        archive.on("error", reject);

        archive.pipe(output);
        archive.file(tempDbPath, { name: path.basename(tempDbPath) });
        archive.finalize();
      });

      // Delete temp file
      await fs.unlink(tempDbPath);

      // Get file stats
      const stats = await fs.stat(backupPath);

      // Log backup creation
      await logAdminAction(
        EventType.ADMIN_BACKUP_CREATE,
        EventStatus.SUCCESS,
        request.headers,
        session.user.id,
        {
          resourceType: "Backup",
          resourceId: backupFilename,
          actionDetails: {
            type: "database",
            size: stats.size,
            dbPath: DB_FULL_PATH,
          },
        }
      );

      return NextResponse.json({
        success: true,
        backup: {
          filename: backupFilename,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          createdAt: stats.mtime.toISOString(),
          relativeTime: formatRelativeTime(stats.mtime),
          type: "database",
        },
      });
    }
  } catch (error) {
    console.error("Error creating backup:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_BACKUP_CREATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Backup",
          errorMessage: (error as Error).message,
        }
      );
    }

    // Return more detailed error info for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create backup", details: errorMessage },
      { status: 500 }
    );
  }
}
