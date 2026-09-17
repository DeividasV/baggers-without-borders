/**
 * Jest global setup
 *
 * Creates a fresh SQLite test DB and applies Prisma migrations once
 * before any test files are loaded.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

module.exports = async () => {
  const rootDir = __dirname;
  const prismaDir = path.join(rootDir, "prisma");
  const testDbPath = path.join(prismaDir, "test.db");

  // Ensure env is set for the migration command.
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "file:./prisma/test.db";

  // Ensure prisma/ exists
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }

  // Remove existing DB + WAL/SHM for a clean start
  for (const filePath of [
    testDbPath,
    `${testDbPath}-wal`,
    `${testDbPath}-shm`,
  ]) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }

  // Create empty DB file so the BetterSQLite adapter can open it.
  fs.closeSync(fs.openSync(testDbPath, "w"));

  // Apply migrations to bring schema up to date.
  execSync("npx prisma migrate deploy", {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: "file:./prisma/test.db",
      NODE_ENV: "test",
    },
  });
};
