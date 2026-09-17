#!/usr/bin/env node

const { main } = require("./calculate-version.js");

/**
 * Version Update Utility
 *
 * This script updates the version by checking for new commits
 * since the last version calculation.
 */

console.log("🔄 Updating version based on new commits...\n");

try {
  const versionInfo = main();
  console.log(`\n🏷️  New version: ${versionInfo.version}`);
  process.exit(0);
} catch (error) {
  console.error("❌ Failed to update version:", error.message);
  process.exit(1);
}
