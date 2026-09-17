#!/usr/bin/env node

/**
 * BWB Delete All Data Script
 *
 * This script deletes all user-related data from the database:
 * 1. Delete all HofEntry records
 * 2. Delete all UserYearParticipation records
 * 3. Delete all UserHofParticipation records
 * 4. Delete all UserConsent records
 * 5. Delete all Users/Members
 *
 * CAUTION: This script will delete all user data!
 */

const prisma = require("../shared/prisma-client");

/**
 * Delete all data from the database
 */
async function deleteAllData(dryRun = false) {
  console.log("🗑️  BWB Delete All Data\n");
  console.log("=".repeat(50));

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No data will be deleted\n");
  }

  try {
    // Get counts before deletion
    console.log("📊 Current data counts:");
    const hofEntryCount = await prisma.hofEntry.count();
    const userYearParticipationCount =
      await prisma.userYearParticipation.count();
    const userHofParticipationCount = await prisma.userHofParticipation.count();
    const userConsentCount = await prisma.userConsent.count();
    const userCount = await prisma.user.count();

    console.log(`   HofEntry: ${hofEntryCount}`);
    console.log(`   UserYearParticipation: ${userYearParticipationCount}`);
    console.log(`   UserHofParticipation: ${userHofParticipationCount}`);
    console.log(`   UserConsent: ${userConsentCount}`);
    console.log(`   User: ${userCount}`);
    console.log("");

    if (dryRun) {
      console.log("   🔍 Dry run - no data will be deleted");
      console.log(
        "\n✅ Preview completed. Run without --dry-run to actually delete data."
      );
      return {
        deleted: {
          hofEntry: 0,
          userYearParticipation: 0,
          userHofParticipation: 0,
          userConsent: 0,
          user: 0,
        },
      };
    }

    console.log("⚠️  WARNING: About to delete all user data!");
    console.log("   Starting deletion in 3 seconds...");
    console.log("   Press Ctrl+C to cancel!\n");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const startTime = Date.now();

    // Delete in order (respecting foreign key constraints)
    console.log("🗑️  Step 1/5: Deleting HofEntry records...");
    const deletedHofEntries = await prisma.hofEntry.deleteMany({});
    console.log(`   ✅ Deleted ${deletedHofEntries.count} HofEntry records`);

    console.log("\n🗑️  Step 2/5: Deleting UserYearParticipation records...");
    const deletedUserYearParticipations =
      await prisma.userYearParticipation.deleteMany({});
    console.log(
      `   ✅ Deleted ${deletedUserYearParticipations.count} UserYearParticipation records`
    );

    console.log("\n🗑️  Step 3/5: Deleting UserHofParticipation records...");
    const deletedUserHofParticipations =
      await prisma.userHofParticipation.deleteMany({});
    console.log(
      `   ✅ Deleted ${deletedUserHofParticipations.count} UserHofParticipation records`
    );

    console.log("\n🗑️  Step 4/5: Deleting UserConsent records...");
    const deletedUserConsents = await prisma.userConsent.deleteMany({});
    console.log(
      `   ✅ Deleted ${deletedUserConsents.count} UserConsent records`
    );

    console.log("\n🗑️  Step 5/5: Deleting User records...");
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`   ✅ Deleted ${deletedUsers.count} User records`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(50));
    console.log("✅ All data deleted successfully!");
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log("=".repeat(50));

    console.log("\n📋 Next step:");
    console.log("   Run: npm run db:import-all");
    console.log("   Or:  node scripts/import-all-data.js");

    return {
      deleted: {
        hofEntry: deletedHofEntries.count,
        userYearParticipation: deletedUserYearParticipations.count,
        userHofParticipation: deletedUserHofParticipations.count,
        userConsent: deletedUserConsents.count,
        user: deletedUsers.count,
      },
    };
  } catch (error) {
    console.error("❌ Deletion failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
🗑️  BWB Delete All Data
=======================

CAUTION: This script will DELETE all user data!

This script deletes:
  1. All HofEntry records
  2. All UserYearParticipation records
  3. All UserHofParticipation records
  4. All UserConsent records
  5. All Users/Members

Usage:
  node delete-all-data.js [options]

Options:
  --help              Show this help message
  --dry-run           Preview what will be deleted without making changes

Examples:
  node delete-all-data.js --dry-run    # Preview what will be deleted
  node delete-all-data.js              # Delete all data

After running this script, use import-all-data.js to re-import data.

⚠️  WARNING: This will delete ALL user data! Make sure you have backups!
    `);
    return;
  }

  // Parse options
  const dryRun = args.includes("--dry-run");

  try {
    await deleteAllData(dryRun);
  } catch (error) {
    console.error("❌ Deletion failed:", error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { deleteAllData };

// Run if called directly
if (require.main === module) {
  main();
}
