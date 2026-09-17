#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Smart Commit Message Generator
 *
 * Analyzes git changes and generates appropriate conventional commit messages
 */

function execCommand(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch (error) {
    return "";
  }
}

function analyzeChanges() {
  // Get staged files
  const stagedFiles = execCommand("git diff --cached --name-only")
    .split("\n")
    .filter((f) => f.trim());

  // Get diff summary
  const diffStat = execCommand("git diff --cached --stat");
  const diffDetail = execCommand("git diff --cached");

  console.log(`📁 Analyzing ${stagedFiles.length} staged files...`);

  const analysis = {
    files: stagedFiles,
    isNewFile: false,
    isDeletedFile: false,
    hasTests: false,
    hasDocs: false,
    hasConfig: false,
    hasPackageJson: false,
    hasStyles: false,
    hasComponents: false,
    hasAPI: false,
    hasDatabase: false,
    hasScripts: false,
    isRefactor: false,
    isBugFix: false,
    isFeature: false,
    scope: null,
    insertions: 0,
    deletions: 0,
  };

  // Parse diff stats
  const statMatch = diffStat.match(/(\d+) insertions?.*?(\d+) deletions?/);
  if (statMatch) {
    analysis.insertions = parseInt(statMatch[1]);
    analysis.deletions = parseInt(statMatch[2]);
  }

  // Analyze file types and patterns
  stagedFiles.forEach((file) => {
    const lowerFile = file.toLowerCase();

    // Check file types
    if (
      lowerFile.includes("test") ||
      lowerFile.includes("spec") ||
      lowerFile.includes("__tests__")
    ) {
      analysis.hasTests = true;
    }
    if (
      lowerFile.includes("readme") ||
      lowerFile.includes("docs/") ||
      lowerFile.endsWith(".md")
    ) {
      analysis.hasDocs = true;
    }
    if (
      lowerFile.includes("config") ||
      lowerFile.endsWith(".json") ||
      lowerFile.endsWith(".yml") ||
      lowerFile.endsWith(".yaml")
    ) {
      analysis.hasConfig = true;
    }
    if (lowerFile === "package.json") {
      analysis.hasPackageJson = true;
    }
    if (
      lowerFile.endsWith(".css") ||
      lowerFile.endsWith(".scss") ||
      lowerFile.includes("styles")
    ) {
      analysis.hasStyles = true;
    }
    if (
      lowerFile.includes("components") ||
      lowerFile.endsWith(".tsx") ||
      lowerFile.endsWith(".jsx")
    ) {
      analysis.hasComponents = true;
    }
    if (lowerFile.includes("api/") || lowerFile.includes("routes/")) {
      analysis.hasAPI = true;
    }
    if (
      lowerFile.includes("auth") ||
      lowerFile.includes("login") ||
      lowerFile.includes("middleware") ||
      lowerFile.includes("session")
    ) {
      analysis.hasAuth = true;
    }
    if (
      lowerFile.includes("prisma/") ||
      lowerFile.includes("database/") ||
      lowerFile.includes("schema")
    ) {
      analysis.hasDatabase = true;
    }
    if (
      lowerFile.includes("scripts/") ||
      lowerFile.endsWith(".sh") ||
      (lowerFile.endsWith(".js") && lowerFile.includes("script"))
    ) {
      analysis.hasScripts = true;
    }
  });

  // Analyze diff content for patterns
  if (diffDetail.includes("function ") && diffDetail.includes("// TODO")) {
    analysis.isRefactor = true;
  }
  if (
    diffDetail.includes("bug") ||
    diffDetail.includes("fix") ||
    diffDetail.includes("error") ||
    diffDetail.includes("issue")
  ) {
    analysis.isBugFix = true;
  }
  if (
    diffDetail.includes("new ") ||
    diffDetail.includes("add ") ||
    diffDetail.includes("create ")
  ) {
    analysis.isFeature = true;
  }

  // Check for new/deleted files
  const newFiles = execCommand("git diff --cached --name-status").split("\n");
  analysis.isNewFile = newFiles.some((line) => line.startsWith("A\t"));
  analysis.isDeletedFile = newFiles.some((line) => line.startsWith("D\t"));

  // Determine BWB scope based on files changed
  if (analysis.hasTests) analysis.scope = "test";
  else if (analysis.hasDocs) analysis.scope = "docs";
  else if (analysis.hasAPI) analysis.scope = "api";
  else if (analysis.hasComponents) analysis.scope = "ui";
  else if (analysis.hasDatabase) analysis.scope = "db";
  else if (analysis.hasAuth) analysis.scope = "auth";
  else if (analysis.hasScripts) analysis.scope = "deploy";
  else if (analysis.hasStyles) analysis.scope = "ui";

  return analysis;
}

function generateCommitMessage(analysis) {
  let type = "feat"; // default
  let scope = analysis.scope;
  let description = "";
  let body = "";

  // Determine commit type based on analysis
  if (analysis.isBugFix) {
    type = "fix";
    description = "resolve issue with ";

    if (analysis.hasComponents) description += "component functionality";
    else if (analysis.hasAPI) description += "API endpoint behavior";
    else if (analysis.hasTests) description += "test failures";
    else description += "application behavior";
  } else if (analysis.isNewFile && analysis.hasTests) {
    type = "test";
    description = "add comprehensive tests for ";

    if (analysis.hasComponents) description += "UI components";
    else if (analysis.hasAPI) description += "API endpoints";
    else description += "core functionality";
  } else if (analysis.hasDocs && !analysis.hasComponents && !analysis.hasAPI) {
    type = "docs";
    description = "update documentation for ";

    if (analysis.hasScripts) description += "scripts and utilities";
    else description += "improved clarity and usage";
  } else if (analysis.hasStyles && !analysis.hasComponents) {
    type = "style";
    description = "improve styling and layout for ";
    description += "better user experience";
  } else if (analysis.hasConfig || analysis.hasPackageJson) {
    type = "chore";

    if (analysis.hasPackageJson)
      description = "update dependencies and project configuration";
    else description = "update configuration files";
  } else if (analysis.isRefactor) {
    type = "refactor";
    description = "improve code structure and maintainability";
  } else if (analysis.isNewFile || analysis.isFeature) {
    type = "feat";

    if (analysis.hasComponents)
      description = "add new UI components and functionality";
    else if (analysis.hasAPI) description = "implement new API endpoints";
    else if (analysis.hasDatabase)
      description = "add database schema and migrations";
    else if (analysis.hasScripts)
      description = "add utility scripts and automation";
    else description = "implement new features and improvements";
  } else {
    // Default to feat for unclear changes
    type = "feat";
    description = "enhance application functionality and user experience";
  }

  // Build commit message
  let message = type;
  if (scope) message += `(${scope})`;
  message += ": " + description;

  // Add body for significant changes
  if (analysis.insertions > 50 || analysis.files.length > 5) {
    body = `\n\nUpdated ${analysis.files.length} files with ${analysis.insertions} additions`;
    if (analysis.deletions > 0) body += ` and ${analysis.deletions} deletions`;
  }

  return message + body;
}

function suggestCommitMessages(analysis) {
  const suggestions = [];

  // Primary suggestion
  const primary = generateCommitMessage(analysis);
  suggestions.push({ type: "primary", message: primary });

  // Alternative suggestions
  if (analysis.hasTests) {
    suggestions.push({
      type: "alternative",
      message: `test: add tests for improved coverage and reliability`,
    });
  }

  if (analysis.isRefactor || analysis.deletions > analysis.insertions) {
    suggestions.push({
      type: "alternative",
      message: `refactor: improve code structure and remove unused code`,
    });
  }

  if (analysis.hasComponents || analysis.hasStyles) {
    suggestions.push({
      type: "alternative",
      message: `feat: enhance UI components and user interface`,
    });
  }

  // Always provide a simple option
  suggestions.push({
    type: "simple",
    message: `feat: update application with improvements and fixes`,
  });

  return suggestions;
}

function main() {
  console.log("🤖 BWB Smart Commit Message Generator\n");

  // Check if there are staged changes
  const stagedFiles = execCommand("git diff --cached --name-only");
  if (!stagedFiles.trim()) {
    console.log("❌ No staged changes found. Please stage your changes first:");
    console.log("   git add <files>");
    return;
  }

  console.log("🔍 Analyzing staged changes...\n");

  const analysis = analyzeChanges();
  const suggestions = suggestCommitMessages(analysis);

  console.log("📋 Analysis Summary:");
  console.log(`   Files: ${analysis.files.length}`);
  console.log(`   Scope: ${analysis.scope || "general"}`);
  console.log(`   Changes: +${analysis.insertions} -${analysis.deletions}`);
  console.log(
    `   Pattern: ${
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
    console.log(
      `${emoji} ${suggestion.type.toUpperCase()}: ${suggestion.message}\n`
    );
  });

  console.log("📌 To use a suggestion:");
  console.log(`   git commit -m "${suggestions[0].message}"`);
  console.log("\n🔄 To regenerate: npm run commit:suggest");
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeChanges,
  generateCommitMessage,
  suggestCommitMessages,
};
