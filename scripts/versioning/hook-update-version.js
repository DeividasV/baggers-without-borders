#!/usr/bin/env node

// Disable debugger for hooks
process.env.NODE_OPTIONS = "";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Git Hook Version Update Script
 *
 * Optimized for use in Git hooks - minimal output, no debugger
 */

const VERSION_FILE = path.join(__dirname, "../../version.json");
const PACKAGE_JSON_FILE = path.join(__dirname, "../../package.json");

function execCommand(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch (error) {
    return "";
  }
}

function parseCommitMessage(message) {
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

    if (conventionalMatch[0].includes("!")) {
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

function loadExistingVersion() {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      return JSON.parse(fs.readFileSync(VERSION_FILE, "utf8"));
    }
  } catch (error) {
    // Silent fallback
  }
  return null;
}

function getStagedCommitMessage() {
  // First, try to get the commit message from environment variable
  if (process.env.BWB_COMMIT_MSG) {
    return process.env.BWB_COMMIT_MSG.trim();
  }

  try {
    // Try to get the commit message from COMMIT_EDITMSG if it exists
    const commitMsgFile = path.join(process.cwd(), ".git/COMMIT_EDITMSG");
    if (fs.existsSync(commitMsgFile)) {
      const message = fs.readFileSync(commitMsgFile, "utf8").split("\n")[0];
      return message.trim();
    }
  } catch (error) {
    // Fallback
  }

  // Default to MINOR for unknown commits
  return "unknown: automated version update";
}

function updateVersion() {
  const currentCommit = execCommand("git rev-parse HEAD");
  const existingVersion = loadExistingVersion();

  if (!existingVersion || !existingVersion.lastCommit) {
    console.log("No previous version found, skipping hook update");
    return false;
  }

  // Get staged changes to predict the next commit message type
  const commitMessage = getStagedCommitMessage();
  const changeType = parseCommitMessage(commitMessage);

  // Calculate new version
  const version = { ...existingVersion };

  switch (changeType) {
    case "MAJOR":
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
      break;
    case "MINOR":
      version.minor += 1;
      version.patch = 0;
      break;
    case "PATCH":
      version.patch += 1;
      break;
  }

  const versionString = `${version.major}.${version.minor}.${version.patch}`;

  // Update version.json
  const versionInfo = {
    version: versionString,
    major: version.major,
    minor: version.minor,
    patch: version.patch,
    lastCommit: currentCommit,
    updatedAt: new Date().toISOString(),
    generatedBy: "git-hook-versioning",
    changeType: changeType,
  };

  fs.writeFileSync(VERSION_FILE, JSON.stringify(versionInfo, null, 2));

  // Update package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_FILE, "utf8"));
    packageJson.version = versionString;
    fs.writeFileSync(
      PACKAGE_JSON_FILE,
      JSON.stringify(packageJson, null, 2) + "\n"
    );

    console.log(
      `Version updated: ${existingVersion.version} → ${versionString} (${changeType})`
    );
    return true;
  } catch (error) {
    console.error("Failed to update package.json:", error.message);
    return false;
  }
}

if (require.main === module) {
  try {
    const success = updateVersion();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("Version update failed:", error.message);
    process.exit(1);
  }
}

module.exports = { updateVersion };
