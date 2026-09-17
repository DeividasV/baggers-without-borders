const {
  inferScopeFromStagedFiles,
  normalizeCommitMessageLine,
} = require("@/scripts/versioning/prepare-commit-msg.js");

describe("prepare-commit-msg normalizer", () => {
  it("keeps already valid conventional commits unchanged", () => {
    expect(
      normalizeCommitMessageLine("fix(ui): keep documents menu in viewport", [
        "app/components/features/documents/FileActionsMenu.tsx",
      ])
    ).toBe("fix(ui): keep documents menu in viewport");
  });

  it("normalizes plain prose into a scoped conventional commit", () => {
    expect(
      normalizeCommitMessageLine(
        "Refactor code structure for improved readability and maintainability",
        ["app/components/features/documents/FileActionsMenu.tsx"]
      )
    ).toBe("refactor(ui): improve code structure for improved readability and maintainability");
  });

  it("uses docs scope for documentation-only changes", () => {
    expect(normalizeCommitMessageLine("Update commit workflow guidance", ["CONTRIBUTING.md"])).toBe(
      "docs(docs): update commit workflow guidance"
    );
  });

  it("infers tooling scope from hook and versioning files", () => {
    expect(
      inferScopeFromStagedFiles([
        ".husky/prepare-commit-msg",
        "scripts/versioning/prepare-commit-msg.js",
      ])
    ).toBe("tooling");
  });
});
