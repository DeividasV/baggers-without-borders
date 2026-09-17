/**
 * Test Database Setup and Management
 *
 * This module provides utilities for integration testing with a real database.
 * It uses a separate test database and provides cleanup utilities.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

// Singleton Prisma client for tests
let testPrisma: PrismaClient | null = null;

/**
 * Get or create the test database Prisma client
 */
export function getTestDb(): PrismaClient {
  if (!testPrisma) {
    const testDbPath = path.join(process.cwd(), "prisma", "test.db");
    const testDbUrl = `file:${testDbPath}`;

    // Keep env in sync with the app's Prisma singleton expectations.
    process.env.DATABASE_URL = testDbUrl;

    const adapter = new PrismaBetterSqlite3({
      url: testDbUrl,
      fileMustExist: true,
    });

    testPrisma = new PrismaClient({
      adapter,
      log: ["error"],
    });
  }
  return testPrisma;
}

/**
 * Initialize the test database
 * Creates tables and applies migrations
 */
export async function initTestDb(): Promise<void> {
  const testDbPath = path.join(process.cwd(), "prisma", "test.db");

  try {
    // Delete existing test database if it exists (including WAL files)
    try {
      await fs.unlink(testDbPath);
      console.log("Removed existing test database");
    } catch {
      // File doesn't exist, that's fine
    }

    // Also remove WAL and SHM files if they exist
    try {
      await fs.unlink(`${testDbPath}-wal`);
      await fs.unlink(`${testDbPath}-shm`);
    } catch {
      // Files might not exist, that's fine
    }

    console.log("Creating new test database...");

    // Create schema using migrations to ensure it matches the current Prisma client.
    await execAsync(`npx prisma migrate deploy`, {
      env: {
        ...process.env,
        DATABASE_URL: "file:./prisma/test.db",
      },
      cwd: process.cwd(),
    });

    console.log("Test database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize test database:", error);
    throw error;
  }
}

/**
 * Clean all data from the test database
 * Preserves schema, only deletes data
 */
export async function cleanTestDb(): Promise<void> {
  const db = getTestDb();

  try {
    // Use Prisma's deleteMany to clean tables
    // Order matters due to foreign key constraints
    await db.auditLog.deleteMany({}); // Clean audit logs first (they reference users)
    await db.userConsentAttachment.deleteMany({});
    await db.userConsent.deleteMany({});
    await db.consentTypeAttachment.deleteMany({});
    await db.consentType.deleteMany({});
    await db.userInterest.deleteMany({});
    await db.interest.deleteMany({});
    await db.changeRequestAttachment.deleteMany({});
    await db.changeRequest.deleteMany({});
    await db.awardTier.deleteMany({});
    await db.countryLceConfig.deleteMany({});
    await db.hofYearConfig.deleteMany({});
    await db.hofEntry.deleteMany({});
    await db.userHofParticipation.deleteMany({});
    await db.userYearParticipation.deleteMany({});
    await db.year.deleteMany({});
    await db.hallOfFame.deleteMany({});
    await db.user.deleteMany({});
    await db.region.deleteMany({});
    await db.country.deleteMany({});

    // Handle hierarchical document deletion (children first, then parents)
    // Delete leaf nodes first (documents with no children)
    let hasDocuments = true;
    while (hasDocuments) {
      const leafDocs = await db.document.findMany({
        where: { children: { none: {} } },
      });

      if (leafDocs.length === 0) {
        hasDocuments = false;
      } else {
        await db.document.deleteMany({
          where: { id: { in: leafDocs.map((d) => d.id) } },
        });
      }
    }

    await db.appSetting.deleteMany({});

    console.log("Test database cleaned");
  } catch (error) {
    console.error("Error cleaning test database:", error);
    throw error;
  }
}

/**
 * Backup the current test database
 */
export async function backupTestDb(): Promise<string> {
  const testDbPath = path.join(process.cwd(), "prisma", "test.db");
  const backupPath = path.join(
    process.cwd(),
    "prisma",
    `test.db.backup.${Date.now()}`
  );

  try {
    await fs.copyFile(testDbPath, backupPath);
    console.log(`Test database backed up to ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error("Failed to backup test database:", error);
    throw error;
  }
}

/**
 * Restore test database from backup
 */
export async function restoreTestDb(backupPath: string): Promise<void> {
  const testDbPath = path.join(process.cwd(), "prisma", "test.db");

  try {
    await fs.copyFile(backupPath, testDbPath);
    console.log(`Test database restored from ${backupPath}`);
  } catch (error) {
    console.error("Failed to restore test database:", error);
    throw error;
  }
}

/**
 * Delete test database completely
 */
export async function deleteTestDb(): Promise<void> {
  const testDbPath = path.join(process.cwd(), "prisma", "test.db");

  try {
    await fs.unlink(testDbPath);
    console.log("Test database deleted");
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Warning deleting test database:", error);
    }
  }
}

/**
 * Close the test database connection
 */
export async function closeTestDb(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
    console.log("Test database connection closed");
  }
}

/**
 * Setup hook for jest - run before all tests
 */
export async function setupTestDatabase(): Promise<void> {
  await initTestDb();
}

/**
 * Teardown hook for jest - run after all tests
 */
export async function teardownTestDatabase(): Promise<void> {
  await closeTestDb();
  // Optionally delete test db after tests
  // await deleteTestDb();
}
