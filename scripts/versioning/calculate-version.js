#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Automatic Version Calculator
 *
 * This script calculates the version based on BWB conventional commits:
 * - feat(scope): MINOR bump (new features)
 * - fix(scope): PATCH bump (bug fixes)
 * - docs/style/refactor/test/chore(scope): MINOR bump (improvements)
 * - BREAKING CHANGE or type!: MAJOR bump
 * - Non-conventional commits: MINOR bump (default for unclassified)
 *
 * BWB Scopes: ui, api, db, auth, docs, test, deploy
 */

const VERSION_FILE = path.join(__dirname, "../../version.json");
const PACKAGE_JSON_FILE = path.join(__dirname, "../../package.json");

// BWB Commit type classifications following new Copilot rules
const COMMIT_TYPES = {
  MAJOR: ["BREAKING"],
  MINOR: ["feat", "docs", "style", "refactor", "test", "chore", "build", "ci"], // Most changes are features/improvements
  PATCH: ["fix"], // Only explicit bug fixes
};

function execCommand(command) {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return "";
  }
}

function parseCommitMessage(message) {
  // Remove commit hash from the beginning
  const cleanMessage = message.replace(/^[a-f0-9]+\s+/, "");

  // Check for BREAKING CHANGE (MAJOR)
  if (
    cleanMessage.includes("BREAKING CHANGE") ||
    cleanMessage.includes("BREAKING:")
  ) {
    return "MAJOR";
  }

  // Check for BWB conventional commits with optional scope
  const conventionalMatch = cleanMessage.match(
    /^(feat|fix|docs|style|refactor|test|chore|build|ci)(\((?:ui|api|db|auth|docs|test|deploy|[^)]*)\))?[!]?:/
  );

  if (conventionalMatch) {
    const type = conventionalMatch[1];
    const hasBreakingMarker = conventionalMatch[0].includes("!");

    if (hasBreakingMarker) {
      return "MAJOR";
    }

    // Only explicit fix commits are PATCH
    if (type === "fix") {
      return "PATCH";
    } else {
      // feat, docs, style, refactor, test, chore, build, ci all become MINOR
      return "MINOR";
    }
  }

  // Check for explicit bug fix keywords (non-conventional format)
  if (/\b(fix|bug|issue|error|correct|resolve)\b/i.test(cleanMessage)) {
    return "PATCH";
  }

  // Default: unclassified commits are MINOR (improvements/changes)
  return "MINOR";
}

function calculateVersionFromCommits(
  fromCommit = null,
  existingVersion = null
) {
  console.log("🔍 Analyzing git commits...");

  // Get all commits in reverse chronological order (oldest first)
  let gitLogCommand = "git log --oneline --reverse";
  if (fromCommit) {
    gitLogCommand += ` ${fromCommit}..HEAD`;
  }

  const commits = execCommand(gitLogCommand);
  if (!commits) {
    console.log("No commits found");
    if (existingVersion) {
      return existingVersion;
    }
    return { major: 1, minor: 0, patch: 0 };
  }

  const commitLines = commits.split("\n").filter((line) => line.trim());
  console.log(`📊 Found ${commitLines.length} commits to analyze`);

  let version;
  let changes = { major: 0, minor: 0, patch: 0 };

  // Use existing version if available, otherwise start from 0.1.0
  if (existingVersion) {
    version = { ...existingVersion };
    console.log(
      `📋 Starting from existing version: ${version.major}.${version.minor}.${version.patch}`
    );
  } else if (!fromCommit) {
    // Initial calculation, start from 0.1.0
    version = { major: 0, minor: 1, patch: 0 };
  } else {
    // Should not happen, but fallback
    version = { major: 1, minor: 0, patch: 0 };
  }

  commitLines.forEach((commit, index) => {
    const changeType = parseCommitMessage(commit);

    switch (changeType) {
      case "MAJOR":
        version.major += 1;
        version.minor = 0;
        version.patch = 0;
        changes.major += 1;
        break;
      case "MINOR":
        version.minor += 1;
        version.patch = 0;
        changes.minor += 1;
        break;
      case "PATCH":
        version.patch += 1;
        changes.patch += 1;
        break;
    }

    if (index < 10) {
      // Show first 10 commits for debugging
      console.log(`  ${changeType.padEnd(5)} | ${commit.substring(0, 80)}`);
    }
  });

  console.log("\n📈 Version changes applied:");
  console.log(`  MAJOR: ${changes.major}`);
  console.log(`  MINOR: ${changes.minor}`);
  console.log(`  PATCH: ${changes.patch}`);

  return version;
}

function saveVersionInfo(version, lastCommit) {
  const versionInfo = {
    version: `${version.major}.${version.minor}.${version.patch}`,
    major: version.major,
    minor: version.minor,
    patch: version.patch,
    lastCommit: lastCommit,
    updatedAt: new Date().toISOString(),
    generatedBy: "automatic-versioning-system",
  };

  fs.writeFileSync(VERSION_FILE, JSON.stringify(versionInfo, null, 2));
  console.log(`💾 Version info saved to ${VERSION_FILE}`);
  return versionInfo;
}

function updatePackageJson(version) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_FILE, "utf8"));
    const oldVersion = packageJson.version;
    packageJson.version = version;

    fs.writeFileSync(
      PACKAGE_JSON_FILE,
      JSON.stringify(packageJson, null, 2) + "\n"
    );
    console.log(`📦 Updated package.json version: ${oldVersion} → ${version}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to update package.json:", error.message);
    return false;
  }
}

function loadExistingVersion() {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      return JSON.parse(fs.readFileSync(VERSION_FILE, "utf8"));
    }
  } catch (error) {
    console.warn("⚠️  Could not load existing version file:", error.message);
  }
  return null;
}

function main() {
  console.log("🚀 BWB Automatic Versioning System\n");

  // Get current commit hash
  const currentCommit = execCommand("git rev-parse HEAD");
  console.log(`📍 Current commit: ${currentCommit.substring(0, 8)}`);

  // Load existing version info
  const existingVersion = loadExistingVersion();
  let fromCommit = null;

  if (existingVersion && existingVersion.lastCommit) {
    console.log(
      `📋 Last processed commit: ${existingVersion.lastCommit.substring(0, 8)}`
    );
    console.log(`📋 Current version: ${existingVersion.version}`);
    fromCommit = existingVersion.lastCommit;
  } else {
    console.log("🆕 Initial version calculation - analyzing all commits");
  }

  // Calculate new version
  const existingVersionData = existingVersion
    ? {
        major: existingVersion.major,
        minor: existingVersion.minor,
        patch: existingVersion.patch,
      }
    : null;

  const version = calculateVersionFromCommits(fromCommit, existingVersionData);
  const versionString = `${version.major}.${version.minor}.${version.patch}`;

  console.log(`\n🎉 Calculated version: ${versionString}`);

  // Save version information
  const versionInfo = saveVersionInfo(version, currentCommit);

  // Update package.json
  updatePackageJson(versionString);

  console.log("\n✅ Version calculation complete!");
  console.log(`Current version: ${versionString}`);

  return versionInfo;
}

if (require.main === module) {
  main();
}

module.exports = { calculateVersionFromCommits, parseCommitMessage, main };
