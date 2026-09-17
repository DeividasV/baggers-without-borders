import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";

// Global singleton storage
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Get database path - DATABASE_URL from .env or default to prisma/dev.db
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
  const dbRelativePath = dbUrl.replace("file:", "");
  const dbPath = path.isAbsolute(dbRelativePath)
    ? dbRelativePath
    : path.join(process.cwd(), dbRelativePath);

  // In test environments, skip file check during module initialization
  // The database will be created by test setup hooks
  const isTestEnv =
    process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

  if (!isTestEnv) {
    // Verify database file exists (only in non-test environments)
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at: ${dbPath}`);
    }
    // Light sanity check (also ensures a clear error if the file is unreadable)
    fs.statSync(dbPath);
  }

  // Set DATABASE_URL as absolute path for Prisma internals
  // Prisma 7 still checks this even with adapters
  const absoluteDbUrl = `file:${dbPath}`;
  process.env.DATABASE_URL = absoluteDbUrl;

  // NOTE: PrismaBetterSqlite3 expects a config object containing `url`.
  // Passing a better-sqlite3 Database instance will crash with `url.replace(...)` on undefined.
  const adapter = new PrismaBetterSqlite3({
    url: absoluteDbUrl,
    fileMustExist: !isTestEnv, // Allow non-existent file during test init
  });

  // Create Prisma client with adapter
  const client = new PrismaClient({
    adapter,
    log: ["error"],
  });

  return client;
}

// Initialize or reuse existing Prisma client
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

export const prisma = globalForPrisma.prisma;
