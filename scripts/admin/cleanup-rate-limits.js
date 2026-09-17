#!/usr/bin/env node

/**
 * Cleanup old rate limit attempts
 *
 * This script removes rate limit attempts older than 24 hours
 * to keep the database size manageable.
 *
 * Run via: npm run db:cleanup-rate-limits
 * Or schedule as a cron job: 0 STAR/6 * * * (every 6 hours)
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanupRateLimits() {
  console.log("Starting rate limit cleanup...");

  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  try {
    const result = await prisma.rateLimitAttempt.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} old rate limit attempts`);
    console.log(`   Cutoff date: ${cutoffDate.toISOString()}`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupRateLimits();
