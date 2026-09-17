#!/usr/bin/env node

/**
 * Cleanup expired audit logs
 *
 * Deletes audit log entries that have passed their retention date.
 * Retention policy:
 * - AUTH events: 90 days
 * - ADMIN/USER events: 730 days (2 years)
 *
 * Run manually: npm run db:cleanup-logs
 * Or schedule via cron for automatic cleanup
 */

const prisma = require("../shared/prisma-client");

async function cleanupAuditLogs() {
  console.log("Starting audit log cleanup...");

  const now = new Date();
  console.log(`Current time: ${now.toISOString()}`);

  try {
    // Find expired logs
    const expiredCount = await prisma.auditLog.count({
      where: {
        retentionDate: {
          lt: now,
        },
      },
    });

    console.log(`Found ${expiredCount} expired log entries`);

    if (expiredCount === 0) {
      console.log("No logs to clean up. Exiting.");
      return;
    }

    // Delete expired logs
    const result = await prisma.auditLog.deleteMany({
      where: {
        retentionDate: {
          lt: now,
        },
      },
    });

    console.log(
      `✓ Successfully deleted ${result.count} expired audit log entries`
    );

    // Show retention summary
    const remainingLogs = await prisma.auditLog.count();
    console.log(`Remaining logs: ${remainingLogs}`);

    // Show breakdown by category
    const authLogs = await prisma.auditLog.count({
      where: { eventCategory: "AUTH" },
    });
    const adminLogs = await prisma.auditLog.count({
      where: { eventCategory: "ADMIN" },
    });
    const userLogs = await prisma.auditLog.count({
      where: { eventCategory: "USER" },
    });

    console.log("\nRetention summary:");
    console.log(`  AUTH events:  ${authLogs} (90-day retention)`);
    console.log(`  ADMIN events: ${adminLogs} (2-year retention)`);
    console.log(`  USER events:  ${userLogs} (2-year retention)`);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupAuditLogs()
  .then(() => {
    console.log("\n✓ Cleanup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Cleanup failed:", error);
    process.exit(1);
  });
