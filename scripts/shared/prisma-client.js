/*
 * Prisma 7 helper for Node scripts.
 *
 * IMPORTANT: This module is used by scripts/seed/migration/utilities.
 * It intentionally requires DATABASE_URL to be configured and points Prisma
 * to the correct SQLite file URL using the Prisma 7 driver adapter.
 */

const fs = require("fs");
const path = require("path");

// Load env files without overriding existing process.env values.
// This mirrors Next.js behavior enough for scripts, and prevents accidental
// writes to an unintended database due to missing env vars.
try {
  const dotenv = require("dotenv");
  const cwd = process.cwd();
  const nodeEnv = process.env.NODE_ENV || "development";
  const candidates = [
    path.join(cwd, ".env"),
    path.join(cwd, ".env.local"),
    path.join(cwd, `.env.${nodeEnv}`),
    path.join(cwd, `.env.${nodeEnv}.local`),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }
} catch {
  // dotenv is optional at runtime; scripts can still be executed with env vars set.
}

const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

function resolveSqliteFileUrl(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) return databaseUrl;

  const filePath = databaseUrl.replace(/^file:/, "");
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  return `file:${absolutePath}`;
}

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Refusing to run scripts without an explicit database target."
    );
  }

  const url = resolveSqliteFileUrl(databaseUrl);

  // For SQLite scripts, avoid accidentally creating a new empty DB file.
  if (url.startsWith("file:")) {
    const dbPath = url.replace(/^file:/, "");
    if (!fs.existsSync(dbPath)) {
      throw new Error(`SQLite database file not found: ${dbPath}`);
    }
  }

  // Prisma 7 adapter pattern
  const adapter = new PrismaBetterSqlite3({ url, fileMustExist: true });

  // Ensure Prisma internals see the resolved absolute URL
  process.env.DATABASE_URL = url;

  return new PrismaClient({ adapter, log: ["error"] });
}

const globalForPrisma = globalThis;

if (!globalForPrisma.__bwbScriptPrisma) {
  globalForPrisma.__bwbScriptPrisma = createClient();
}

module.exports = globalForPrisma.__bwbScriptPrisma;
