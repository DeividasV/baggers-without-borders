#!/usr/bin/env node

const {
  analyzeChanges,
  generateCommitMessage,
  suggestCommitMessages,
} = require("./suggest-commit.js");
const { execSync } = require("child_process");
const readline = require("readline");

/**
 * Interactive Commit Helper
 *
 * Provides suggestions and can automatically commit with smart messages
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
  console.log("🚀 BWB Interactive Commit Helper\n");

  // Check if there are staged changes
  const stagedFiles = execCommand("git diff --cached --name-only");
  if (!stagedFiles.trim()) {
    console.log("❌ No staged changes found. Please stage your changes first:");
    console.log("   git add <files>");

    // Offer to stage all changes
    const stageAll = await promptUser("\n📦 Stage all changes now? (y/N): ");
    if (stageAll.toLowerCase() === "y" || stageAll.toLowerCase() === "yes") {
      console.log("📋 Staging all changes...");
      execSync("git add .", { stdio: "inherit" });
      console.log("✅ Changes staged!\n");
    } else {
      return;
    }
  }

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

  console.log("💡 Suggested Commit Messages:\n");

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
    console.log("👋 Cancelled. No commit made.");
    return;
  } else if (choice.toLowerCase() === "c") {
    commitMessage = await promptUser("Enter custom commit message: ");
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

  console.log(`\n📝 Committing with message: "${commitMessage}"\n`);

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
