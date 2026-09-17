#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");

const CONVENTIONAL_PATTERN = /^[a-z]+(?:\([a-z-]+\))?!?: .+/;
const SPECIAL_MESSAGE_PATTERN = /^(Merge|Revert|fixup!|squash!)/;

function execCommand(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch {
    return "";
  }
}

function getStagedFiles() {
  return execCommand("git diff --cached --name-only")
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
}

function inferScopeFromStagedFiles(stagedFiles) {
  const files = stagedFiles.map((file) => file.toLowerCase());

  if (
    files.some(
      (file) => file.includes("__tests__") || file.includes("test") || file.includes("spec")
    )
  ) {
    return "test";
  }

  if (
    files.some((file) => file.includes("readme") || file.endsWith(".md") || file.includes("docs/"))
  ) {
    return "docs";
  }

  if (
    files.some(
      (file) => file.includes("api/") || file.includes("route.ts") || file.includes("routes/")
    )
  ) {
    return "api";
  }

  if (
    files.some(
      (file) =>
        file.includes("auth") ||
        file.includes("middleware") ||
        file.includes("login") ||
        file.includes("session")
    )
  ) {
    return "auth";
  }

  if (
    files.some(
      (file) => file.includes("prisma/") || file.includes("schema") || file.includes("database/")
    )
  ) {
    return "db";
  }

  if (
    files.some(
      (file) =>
        file.includes("/admin/") ||
        file.startsWith("app/(authenticated)/admin") ||
        file.startsWith("app/api/admin/")
    )
  ) {
    return "admin";
  }

  if (files.some((file) => file.includes("hof"))) {
    return "hof";
  }

  if (files.some((file) => file.startsWith("data/") || file.includes("/data/"))) {
    return "data";
  }

  if (files.some((file) => file === "package.json" || file === "package-lock.json")) {
    return "deps";
  }

  if (
    files.some(
      (file) =>
        file.includes("docker") ||
        file.includes("infra") ||
        file.includes("terraform") ||
        file.includes("bicep") ||
        file.includes("nginx") ||
        file.includes("compose")
    )
  ) {
    return "infra";
  }

  if (
    files.some(
      (file) =>
        file.includes("scripts/deployment") || file.includes("deploy.sh") || file.includes("deploy")
    )
  ) {
    return "deploy";
  }

  if (
    files.some(
      (file) =>
        file.includes("scripts/") ||
        file.includes("commitlint") ||
        file.includes("husky") ||
        file.includes(".github/") ||
        file.includes(".vscode/")
    )
  ) {
    return "tooling";
  }

  if (
    files.some(
      (file) =>
        file.endsWith(".css") ||
        file.endsWith(".tsx") ||
        file.endsWith(".jsx") ||
        file.includes("components/") ||
        file.includes("globals.css") ||
        file.includes("ui/")
    )
  ) {
    return "ui";
  }

  return null;
}

function inferTypeFromMessage(message, stagedFiles) {
  const lowerMessage = message.toLowerCase();

  if (/(^|\b)(fix|bug|error|issue|resolve|prevent|correct|patch)(\b|:)/.test(lowerMessage)) {
    return "fix";
  }

  if (
    /(^|\b)(refactor|cleanup|clean up|restructure|readability|maintainability|simplify)(\b|:)/.test(
      lowerMessage
    )
  ) {
    return "refactor";
  }

  if (/(^|\b)(docs|doc|readme|document)(\b|:)/.test(lowerMessage)) {
    return "docs";
  }

  if (/(^|\b)(test|spec|coverage)(\b|:)/.test(lowerMessage)) {
    return "test";
  }

  if (/(^|\b)(style|format|prettier|whitespace|spacing|css)(\b|:)/.test(lowerMessage)) {
    return "style";
  }

  if (
    /(^|\b)(deps|dependency|dependencies|bump|upgrade|pin|chore|config|tooling|ci|build|release)(\b|:)/.test(
      lowerMessage
    )
  ) {
    return "chore";
  }

  if (/(^|\b)(add|create|implement|introduce|enable|feature)(\b|:)/.test(lowerMessage)) {
    return "feat";
  }

  const scope = inferScopeFromStagedFiles(stagedFiles);

  if (scope === "docs") return "docs";
  if (scope === "test") return "test";
  if (scope === "deps" || scope === "tooling" || scope === "deploy" || scope === "infra") {
    return "chore";
  }

  return "feat";
}

function normalizeSubject(message, type) {
  let subject = message.trim().replace(/[.\s]+$/, "");

  const prefixPatterns = {
    fix: /^(fix|bugfix|resolve|resolved|prevent|prevented|correct|corrected)\b[:\s-]*/i,
    refactor: /^(refactor|refactored|refactoring|cleanup|clean up|restructure|simplify)\b[:\s-]*/i,
    docs: /^(docs|doc|document|documentation|readme|update docs)\b[:\s-]*/i,
    test: /^(test|tests|spec|coverage|add tests)\b[:\s-]*/i,
    style: /^(style|format|formatted|prettier|lint|whitespace)\b[:\s-]*/i,
    chore:
      /^(chore|deps|dependencies|dependency|bump|upgrade|pin|config|tooling|build|ci)\b[:\s-]*/i,
    feat: /^(feat|feature|add|create|implement|introduce|enable)\b[:\s-]*/i,
  };

  if (prefixPatterns[type]) {
    subject = subject.replace(prefixPatterns[type], "").trim();
  }

  if (!subject) {
    return type === "refactor" ? "improve code structure" : "update project files";
  }

  if (
    type === "refactor" &&
    !/^(improve|simplify|restructure|clean up|remove|extract|rename)\b/i.test(subject)
  ) {
    subject = `improve ${subject}`;
  }

  if (
    type === "feat" &&
    !/^(add|create|implement|introduce|enable|improve|support)\b/i.test(subject)
  ) {
    subject = `add ${subject}`;
  }

  return subject.charAt(0).toLowerCase() + subject.slice(1).replace(/\s+/g, " ");
}

function normalizeCommitMessageLine(message, stagedFiles = []) {
  const trimmed = message.trim();

  if (!trimmed || CONVENTIONAL_PATTERN.test(trimmed) || SPECIAL_MESSAGE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const type = inferTypeFromMessage(trimmed, stagedFiles);
  const scope = inferScopeFromStagedFiles(stagedFiles);
  const subject = normalizeSubject(trimmed, type);

  return `${type}${scope ? `(${scope})` : ""}: ${subject}`;
}

function rewriteCommitMessageFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const stagedFiles = getStagedFiles();

  const firstContentLineIndex = lines.findIndex((line) => line.trim() && !line.startsWith("#"));

  if (firstContentLineIndex === -1) {
    const generatedMessage =
      normalizeCommitMessageLine("", stagedFiles) ||
      normalizeCommitMessageLine("update project files", stagedFiles);
    fs.writeFileSync(filePath, [generatedMessage, ...lines].join("\n"));
    return;
  }

  const originalLine = lines[firstContentLineIndex].trim();
  const normalizedLine = normalizeCommitMessageLine(originalLine, stagedFiles);

  if (!normalizedLine || normalizedLine === originalLine) {
    return;
  }

  lines[firstContentLineIndex] = normalizedLine;
  fs.writeFileSync(filePath, lines.join("\n"));
}

function main() {
  const [, , messageFile, source] = process.argv;

  if (!messageFile || source === "merge") {
    return;
  }

  rewriteCommitMessageFile(messageFile);
}

if (require.main === module) {
  main();
}

module.exports = {
  inferScopeFromStagedFiles,
  inferTypeFromMessage,
  normalizeSubject,
  normalizeCommitMessageLine,
};
