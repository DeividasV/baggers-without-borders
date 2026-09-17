/**
 * File Utilities Tests
 * Tests for secure path handling and validation
 */

import path from "path";
import {
  normalizeDocumentPath,
  safeResolvePath,
  isValidFolderName,
  isValidFileName,
} from "@/src/lib/fileUtils";

describe("fileUtils", () => {
  describe("normalizeDocumentPath", () => {
    it("should remove leading slash", () => {
      expect(normalizeDocumentPath("/uploads/file.pdf")).toBe(
        "uploads/file.pdf",
      );
    });

    it("should keep path without leading slash unchanged", () => {
      expect(normalizeDocumentPath("uploads/file.pdf")).toBe(
        "uploads/file.pdf",
      );
    });

    it("should handle empty string", () => {
      expect(normalizeDocumentPath("")).toBe("");
    });

    it("should handle single slash", () => {
      expect(normalizeDocumentPath("/")).toBe("");
    });
  });

  describe("safeResolvePath", () => {
    const basePath = "/var/uploads";

    it("should resolve valid relative path", () => {
      const result = safeResolvePath(basePath, "user/file.pdf");
      expect(result).toBe(path.join(basePath, "user/file.pdf"));
    });

    it("should handle path with leading slash", () => {
      const result = safeResolvePath(basePath, "/user/file.pdf");
      expect(result).toBe(path.join(basePath, "user/file.pdf"));
    });

    it("should reject path traversal with ..", () => {
      const result = safeResolvePath(basePath, "../etc/passwd");
      expect(result).toBeNull();
    });

    it("should reject multiple path traversal attempts", () => {
      const result = safeResolvePath(basePath, "../../etc/passwd");
      expect(result).toBeNull();
    });

    it("should reject path traversal in middle of path", () => {
      const result = safeResolvePath(basePath, "user/../../../etc/passwd");
      expect(result).toBeNull();
    });

    it("should treat absolute-like paths as relative after normalization", () => {
      // After normalization, "/etc/passwd" becomes "etc/passwd" which is safe
      const result = safeResolvePath(basePath, "/etc/passwd");
      // This is SAFE - it resolves to /var/uploads/etc/passwd, still within base
      expect(result).toBe(path.join(basePath, "etc/passwd"));
    });

    it("should allow subdirectories within base", () => {
      const result = safeResolvePath(basePath, "user/documents/file.pdf");
      expect(result).toBe(path.join(basePath, "user/documents/file.pdf"));
    });

    it("should handle base path without trailing slash", () => {
      const result = safeResolvePath("/var/uploads", "file.pdf");
      expect(result).toBe("/var/uploads/file.pdf");
    });

    it("should handle relative . in path", () => {
      const result = safeResolvePath(basePath, "./file.pdf");
      expect(result).toBe(path.join(basePath, "file.pdf"));
    });
  });

  describe("isValidFolderName", () => {
    it("should accept valid folder name", () => {
      expect(isValidFolderName("MyFolder")).toBe(true);
    });

    it("should accept folder with spaces", () => {
      expect(isValidFolderName("My Folder")).toBe(true);
    });

    it("should accept folder with numbers", () => {
      expect(isValidFolderName("Folder123")).toBe(true);
    });

    it("should reject empty string", () => {
      expect(isValidFolderName("")).toBe(false);
    });

    it("should reject whitespace only", () => {
      expect(isValidFolderName("   ")).toBe(false);
    });

    it("should reject path traversal ..", () => {
      expect(isValidFolderName("../etc")).toBe(false);
    });

    it("should reject current directory reference", () => {
      expect(isValidFolderName("./folder")).toBe(false);
    });

    it("should reject paths with forward slash", () => {
      expect(isValidFolderName("folder/subfolder")).toBe(false);
    });

    it("should reject paths with backslash", () => {
      expect(isValidFolderName("folder\\subfolder")).toBe(false);
    });

    it("should reject null byte", () => {
      expect(isValidFolderName("folder\x00name")).toBe(false);
    });

    it("should reject leading dot", () => {
      expect(isValidFolderName(".hidden")).toBe(false);
    });

    it("should reject trailing dot", () => {
      expect(isValidFolderName("folder.")).toBe(false);
    });

    it("should reject double dots", () => {
      expect(isValidFolderName("..")).toBe(false);
    });
  });

  describe("isValidFileName", () => {
    it("should accept valid file name", () => {
      expect(isValidFileName("file.pdf")).toBe(true);
    });

    it("should accept file with spaces", () => {
      expect(isValidFileName("My Document.pdf")).toBe(true);
    });

    it("should accept file with numbers", () => {
      expect(isValidFileName("report-2024.xlsx")).toBe(true);
    });

    it("should accept file with multiple extensions", () => {
      expect(isValidFileName("file.tar.gz")).toBe(true);
    });

    it("should reject empty string", () => {
      expect(isValidFileName("")).toBe(false);
    });

    it("should reject path traversal", () => {
      expect(isValidFileName("../etc/passwd")).toBe(false);
    });

    it("should reject path with slashes", () => {
      expect(isValidFileName("folder/file.pdf")).toBe(false);
    });

    it("should reject path with backslashes", () => {
      expect(isValidFileName("folder\\file.pdf")).toBe(false);
    });

    it("should reject null byte", () => {
      expect(isValidFileName("file\x00.pdf")).toBe(false);
    });

    it("should reject current directory reference", () => {
      expect(isValidFileName("./file.pdf")).toBe(false);
    });
  });
});
