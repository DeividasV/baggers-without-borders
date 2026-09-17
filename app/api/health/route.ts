import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { prisma } from "@/src/lib/prisma";
import { getBackupDir, getUploadsBaseDir } from "@/src/lib/constants";

const BACKUP_DIR = getBackupDir();

// GET /api/health - Health check endpoint for Docker
// Add ?detailed=true for full diagnostics (requires admin auth via middleware)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const detailed = url.searchParams.get("detailed") === "true";

  const basicResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };

  if (!detailed) {
    return NextResponse.json(basicResponse);
  }

  // Detailed health check
  const checks: Record<string, any> = {
    ...basicResponse,
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // Check database connectivity
  try {
    const userCount = await prisma.user.count();
    checks.checks.database = { status: "ok", userCount };
  } catch (error) {
    checks.checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    checks.status = "degraded";
  }

  // Check uploads directory
  const uploadsDir = getUploadsBaseDir();
  try {
    await fs.access(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
    const files = await fs.readdir(uploadsDir);
    checks.checks.uploadsDir = {
      status: "ok",
      path: uploadsDir,
      contents: files,
    };
  } catch (error) {
    checks.checks.uploadsDir = {
      status: "error",
      path: uploadsDir,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    checks.status = "degraded";
  }

  // Check backup directory
  try {
    await fs.access(BACKUP_DIR, fs.constants.R_OK | fs.constants.W_OK);
    const files = await fs.readdir(BACKUP_DIR);
    checks.checks.backupDir = {
      status: "ok",
      path: BACKUP_DIR,
      fileCount: files.length,
    };
  } catch (error) {
    checks.checks.backupDir = {
      status: "error",
      path: BACKUP_DIR,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    checks.status = "degraded";
  }

  // Check database file
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  const dbPath = dbUrl.replace("file:", "");
  const dbFullPath = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(process.cwd(), "prisma", path.basename(dbPath));

  try {
    const stats = await fs.stat(dbFullPath);
    checks.checks.dbFile = {
      status: "ok",
      path: dbFullPath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    };
  } catch (error) {
    checks.checks.dbFile = {
      status: "error",
      path: dbFullPath,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    checks.status = "degraded";
  }

  return NextResponse.json(checks);
}
