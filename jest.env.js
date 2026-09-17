/**
 * Jest environment setup - runs before each test file
 * Sets up Turnstile test keys for automated testing
 */

const fs = require("fs");
const path = require("path");

// Turnstile test keys (always pass validation)
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

// Other test environment variables
process.env.NEXTAUTH_SECRET = "test-secret-key-for-jest-testing-only";
process.env.NEXTAUTH_URL = "http://localhost:1345";
// Use a dedicated DB file under prisma/ so it matches Prisma + adapter expectations.
process.env.DATABASE_URL = "file:./prisma/test.db";
process.env.NODE_ENV = "test";

// Ensure test DB file exists before any route modules import Prisma.
// Many tests import route handlers at module scope, and our Prisma singleton fails fast if the DB file is missing.
try {
  const prismaDir = path.join(process.cwd(), "prisma");
  const testDbPath = path.join(prismaDir, "test.db");

  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }

  // Global Jest setup runs migrations; this is just a safety net to satisfy
  // the Prisma singleton's "DB file must exist" check during module imports.
  if (!fs.existsSync(testDbPath)) {
    fs.closeSync(fs.openSync(testDbPath, "w"));
  }
} catch (e) {
  // Fail fast with a clear message rather than cascading Prisma errors.
  console.error("Failed to initialize Jest test DB:", e);
}
