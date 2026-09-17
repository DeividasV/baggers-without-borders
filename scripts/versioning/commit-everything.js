#!/usr/bin/env node

const {
  analyzeChanges,
  generateCommitMessage,
  suggestCommitMessages,
} = require("./suggest-commit.js");
const { execSync } = require("child_process");
const readline = require("readline");

/**
 * Commit Everything Helper
 *
 * Stages all changes and commits everything together with version update
 */

function execCommand(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch (error) {
    return "";
  }
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("🚀 BWB Commit Everything Helper\n");

  // Check if there are any changes (staged or unstaged)
  const stagedFiles = execCommand("git diff --cached --name-only");
  const unstagedFiles = execCommand("git diff --name-only");
  const untrackedFiles = execCommand(
    "git ls-files --others --exclude-standard"
  );

  if (!stagedFiles.trim() && !unstagedFiles.trim() && !untrackedFiles.trim()) {
    console.log("❌ No changes found. Nothing to commit.");
    return;
  }

  console.log("📋 Changes detected:");
  if (unstagedFiles.trim()) {
    console.log(`   📝 Modified: ${unstagedFiles.split("\n").length} files`);
  }
  if (untrackedFiles.trim()) {
    console.log(`   ➕ New: ${untrackedFiles.split("\n").length} files`);
  }
  if (stagedFiles.trim()) {
    console.log(
      `   ✅ Already staged: ${stagedFiles.split("\n").length} files`
    );
  }

  // Stage everything
  console.log("\n📦 Staging all changes...");
  execSync("git add .", { stdio: "inherit" });
  console.log("✅ All changes staged!\n");

  console.log("🔍 Analyzing staged changes...\n");

  const analysis = analyzeChanges();
  const suggestions = suggestCommitMessages(analysis);

  console.log("📋 Analysis Summary:");
  console.log(`   📁 Files: ${analysis.files.length}`);
  console.log(`   🎯 Scope: ${analysis.scope || "general"}`);
  console.log(`   📊 Changes: +${analysis.insertions} -${analysis.deletions}`);
  console.log(
    `   🏷️  Pattern: ${
      analysis.isBugFix
        ? "Bug Fix"
        : analysis.isFeature
        ? "New Feature"
        : "Enhancement"
    }\n`
  );

  console.log("💡 Suggested Commit Messages (BWB Conventional Format):\n");

  suggestions.forEach((suggestion, index) => {
    const emoji =
      suggestion.type === "primary"
        ? "🎯"
        : suggestion.type === "alternative"
        ? "🔀"
        : "📝";
    console.log(`${index + 1}. ${emoji} ${suggestion.message}`);
  });

  console.log("\n🔧 Options:");
  console.log("   1-" + suggestions.length + ": Use suggested message");
  console.log("   c: Create custom message");
  console.log("   q: Quit without committing\n");

  const choice = await promptUser("Choose an option: ");

  let commitMessage = "";

  if (choice.toLowerCase() === "q") {
    console.log("👋 Cancelled. Changes remain staged.");
    return;
  } else if (choice.toLowerCase() === "c") {
    commitMessage = await promptUser(
      "Enter custom commit message (BWB format - type(scope): description): "
    );
    if (!commitMessage) {
      console.log("❌ Empty message. Cancelled.");
      return;
    }
  } else {
    const choiceNum = parseInt(choice);
    if (choiceNum >= 1 && choiceNum <= suggestions.length) {
      commitMessage = suggestions[choiceNum - 1].message;
    } else {
      console.log("❌ Invalid choice. Cancelled.");
      return;
    }
  }

  console.log(`\n📝 Committing everything with message: "${commitMessage}"\n`);

  try {
    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      stdio: "inherit",
    });
    console.log("\n🎉 Commit successful!");

    // Show new version
    try {
      const versionInfo = JSON.parse(
        require("fs").readFileSync("version.json", "utf8")
      );
      console.log(`📦 Version updated to: ${versionInfo.version}`);

      // Show what type of version bump occurred
      const changeType = versionInfo.changeType || "UNKNOWN";
      const bumpEmoji =
        changeType === "MAJOR"
          ? "🚨"
          : changeType === "MINOR"
          ? "⬆️"
          : changeType === "PATCH"
          ? "🔧"
          : "📝";
      console.log(`${bumpEmoji} Change type: ${changeType}`);
    } catch (e) {
      // Version info not available
    }
  } catch (error) {
    console.error("❌ Commit failed:", error.message);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
