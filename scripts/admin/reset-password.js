#!/usr/bin/env node

/**
 * BWB Reset User Password Script
 *
 * Resets password for specified user(s)
 */

const bcrypt = require("bcryptjs");
const prisma = require("../shared/prisma-client");

/**
 * Reset password for a user
 */
async function resetUserPassword(username, newPassword) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.error(`❌ User not found: ${username}`);
      return false;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword },
    });

    console.log(`✅ Password reset successfully for: ${username}`);
    return true;
  } catch (error) {
    console.error(`❌ Error resetting password for ${username}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    console.log(`
🔑 BWB Reset User Password
=========================

Reset password for one or more users.

Usage:
  node reset-password.js <username> <new-password> [<username2> <password2> ...]
  node reset-password.js --admins <new-password>

Options:
  --help              Show this help message
  --admins PASSWORD   Reset password for both admins (demo.admin and sample.admin)

Examples:
  # Reset single user password
  node reset-password.js john.smith MyNewPass123

  # Reset multiple users
  node reset-password.js john.smith Pass1 jane.doe Pass2

  # Reset admin passwords
  node reset-password.js --admins change-me-1234

  # Common usage for both admins
  node reset-password.js demo.admin change-me-1234 sample.admin change-me-1234
    `);
    return;
  }

  console.log("🔑 BWB Password Reset\n");
  console.log("=".repeat(50));

  try {
    // Handle --admins flag
    if (args[0] === "--admins") {
      if (!args[1]) {
        console.error("❌ Password required for --admins flag");
        process.exit(1);
      }

      const password = args[1];
      console.log("🔐 Resetting password for all admin accounts...\n");

      // Resolve admins by role rather than by hardcoded usernames - usernames
      // are personal data and must not be committed.
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { username: true },
      });

      if (admins.length === 0) {
        console.error("❌ No admin accounts found");
        process.exit(1);
      }

      for (const admin of admins) {
        await resetUserPassword(admin.username, password);
      }
    } else {
      // Process username/password pairs
      if (args.length % 2 !== 0) {
        console.error("❌ Invalid arguments. Must provide username/password pairs.");
        console.log("   Use --help for usage information");
        process.exit(1);
      }

      for (let i = 0; i < args.length; i += 2) {
        const username = args[i];
        const password = args[i + 1];

        await resetUserPassword(username, password);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Password reset completed!");
  } catch (error) {
    console.error("❌ Password reset failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use as module
module.exports = { resetUserPassword };

// Run if called directly
if (require.main === module) {
  main();
}
