/**
 * Tests for document utility functions
 *
 * Tests file formatting, preview detection, and icon selection.
 */

import {
  formatFileSize,
  formatDate,
  truncatePath,
  canPreview,
  isMarkdown,
  getFileIcon,
} from "@/app/components/features/documents/utils";
import {
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  File,
  FileJson,
} from "lucide-react";
import { Document } from "@/app/components/features/documents/types";

describe("Document Utils", () => {
  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(512)).toBe("512 Bytes");
      expect(formatFileSize(1023)).toBe("1023 Bytes");
    });

    it("should format KB correctly", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(2048)).toBe("2 KB");
    });

    it("should format MB correctly", () => {
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(1572864)).toBe("1.5 MB");
      expect(formatFileSize(5242880)).toBe("5 MB");
    });

    it("should format GB correctly", () => {
      expect(formatFileSize(1073741824)).toBe("1 GB");
      expect(formatFileSize(2147483648)).toBe("2 GB");
    });

    it("should handle null", () => {
      expect(formatFileSize(null)).toBe("0 Bytes");
    });
  });

  describe("formatDate", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "just now" for very recent dates', () => {
      const date = new Date("2024-01-15T11:59:30Z").toISOString();
      expect(formatDate(date)).toBe("just now");
    });

    it("should return minutes ago", () => {
      const date = new Date("2024-01-15T11:45:00Z").toISOString();
      expect(formatDate(date)).toBe("15m ago");
    });

    it("should return hours ago", () => {
      const date = new Date("2024-01-15T09:00:00Z").toISOString();
      expect(formatDate(date)).toBe("3h ago");
    });

    it("should return days ago", () => {
      const date = new Date("2024-01-12T12:00:00Z").toISOString();
      expect(formatDate(date)).toBe("3d ago");
    });

    it("should return formatted date for older dates", () => {
      const date = new Date("2024-01-01T12:00:00Z").toISOString();
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe("truncatePath", () => {
    it("should not truncate short paths", () => {
      expect(truncatePath("short/path")).toBe("short/path");
      expect(truncatePath("a/b/c")).toBe("a/b/c");
    });

    it("should truncate long paths", () => {
      const longPath = "very/long/path/that/exceeds/the/maximum/length/allowed";
      const result = truncatePath(longPath, 30);
      expect(result.length).toBeLessThanOrEqual(33); // 30 + "..."
      expect(result).toContain("...");
    });

    it("should preserve beginning and end", () => {
      const path = "start/middle/middle/middle/end";
      const result = truncatePath(path, 20);
      expect(result.startsWith("start")).toBe(true);
      expect(result.endsWith("end")).toBe(true);
      expect(result).toContain("...");
    });

    it("should use default maxLength of 50", () => {
      const path = "a".repeat(100);
      const result = truncatePath(path);
      expect(result.length).toBeLessThanOrEqual(53); // 50 + "..."
    });
  });

  describe("canPreview", () => {
    const createDoc = (
      isFolder: boolean,
      mimeType: string | null
    ): Document => ({
      id: "doc-1",
      name: "test",
      isFolder,
      mimeType,
      path: "/",
      size: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: null,
      filename: null,
      originalName: null,
    });

    it("should return false for folders", () => {
      expect(canPreview(createDoc(true, null))).toBe(false);
    });

    it("should return false for no mimeType", () => {
      expect(canPreview(createDoc(false, null))).toBe(false);
    });

    it("should return true for image types", () => {
      expect(canPreview(createDoc(false, "image/jpeg"))).toBe(true);
      expect(canPreview(createDoc(false, "image/png"))).toBe(true);
      expect(canPreview(createDoc(false, "image/gif"))).toBe(true);
      expect(canPreview(createDoc(false, "image/webp"))).toBe(true);
      expect(canPreview(createDoc(false, "image/svg+xml"))).toBe(true);
    });

    it("should return true for PDF", () => {
      expect(canPreview(createDoc(false, "application/pdf"))).toBe(true);
    });

    it("should return true for text types", () => {
      expect(canPreview(createDoc(false, "text/plain"))).toBe(true);
      expect(canPreview(createDoc(false, "text/markdown"))).toBe(true);
      expect(canPreview(createDoc(false, "text/csv"))).toBe(true);
      expect(canPreview(createDoc(false, "application/json"))).toBe(true);
      expect(canPreview(createDoc(false, "text/html"))).toBe(true);
      expect(canPreview(createDoc(false, "text/css"))).toBe(true);
      expect(canPreview(createDoc(false, "text/javascript"))).toBe(true);
      expect(canPreview(createDoc(false, "application/xml"))).toBe(true);
    });

    it("should return false for non-previewable types", () => {
      expect(canPreview(createDoc(false, "application/zip"))).toBe(false);
      expect(canPreview(createDoc(false, "video/mp4"))).toBe(false);
      expect(canPreview(createDoc(false, "audio/mpeg"))).toBe(false);
    });
  });

  describe("isMarkdown", () => {
    const createDoc = (name: string, mimeType: string | null): Document => ({
      id: "doc-1",
      name,
      isFolder: false,
      mimeType,
      path: "/",
      size: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: null,
      filename: null,
      originalName: null,
    });

    it("should return false for folders", () => {
      const folder: Document = {
        ...createDoc("folder", null),
        isFolder: true,
      };
      expect(isMarkdown(folder)).toBe(false);
    });

    it("should detect markdown by MIME type", () => {
      expect(isMarkdown(createDoc("file.txt", "text/markdown"))).toBe(true);
    });

    it("should detect markdown by .md extension", () => {
      expect(isMarkdown(createDoc("README.md", "text/plain"))).toBe(true);
      expect(isMarkdown(createDoc("TEST.MD", "text/plain"))).toBe(true);
    });

    it("should detect markdown by .markdown extension", () => {
      expect(isMarkdown(createDoc("file.markdown", "text/plain"))).toBe(true);
      expect(isMarkdown(createDoc("FILE.MARKDOWN", "text/plain"))).toBe(true);
    });

    it("should return false for non-markdown files", () => {
      expect(isMarkdown(createDoc("file.txt", "text/plain"))).toBe(false);
      expect(isMarkdown(createDoc("file.pdf", "application/pdf"))).toBe(false);
    });
  });

  describe("getFileIcon", () => {
    const createDoc = (
      name: string,
      isFolder: boolean,
      mimeType: string | null
    ): Document => ({
      id: "doc-1",
      name,
      isFolder,
      mimeType,
      path: "/",
      size: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: null,
      filename: null,
      originalName: null,
    });

    it("should return Folder icon for folders", () => {
      expect(getFileIcon(createDoc("folder", true, null))).toBe(Folder);
    });

    it("should return FileImage for images", () => {
      expect(getFileIcon(createDoc("pic.jpg", false, "image/jpeg"))).toBe(
        FileImage
      );
      expect(getFileIcon(createDoc("pic.png", false, "image/png"))).toBe(
        FileImage
      );
    });

    it("should return FileVideo for videos", () => {
      expect(getFileIcon(createDoc("vid.mp4", false, "video/mp4"))).toBe(
        FileVideo
      );
    });

    it("should return FileAudio for audio", () => {
      expect(getFileIcon(createDoc("song.mp3", false, "audio/mpeg"))).toBe(
        FileAudio
      );
    });

    it("should return FileArchive for archives by MIME type", () => {
      expect(getFileIcon(createDoc("file.zip", false, "application/zip"))).toBe(
        FileArchive
      );
      expect(
        getFileIcon(createDoc("file.tar", false, "application/x-tar"))
      ).toBe(FileArchive);
    });

    it("should return FileArchive for archives by extension", () => {
      expect(getFileIcon(createDoc("file.zip", false, null))).toBe(FileArchive);
      expect(getFileIcon(createDoc("file.rar", false, null))).toBe(FileArchive);
      expect(getFileIcon(createDoc("file.tar", false, null))).toBe(FileArchive);
      expect(getFileIcon(createDoc("file.7z", false, null))).toBe(FileArchive);
      expect(getFileIcon(createDoc("file.gz", false, null))).toBe(FileArchive);
    });

    it("should return FileSpreadsheet for spreadsheets by MIME type", () => {
      expect(
        getFileIcon(
          createDoc(
            "data.xlsx",
            false,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          )
        )
      ).toBe(FileSpreadsheet);
    });

    it("should return FileSpreadsheet for spreadsheets by extension", () => {
      expect(getFileIcon(createDoc("data.xlsx", false, null))).toBe(
        FileSpreadsheet
      );
      expect(getFileIcon(createDoc("data.xls", false, null))).toBe(
        FileSpreadsheet
      );
      expect(getFileIcon(createDoc("data.csv", false, null))).toBe(
        FileSpreadsheet
      );
      expect(getFileIcon(createDoc("data.ods", false, null))).toBe(
        FileSpreadsheet
      );
    });

    it("should return FileCode for code files by MIME type", () => {
      expect(
        getFileIcon(createDoc("app.js", false, "application/javascript"))
      ).toBe(FileCode);
      expect(getFileIcon(createDoc("style.css", false, "text/css"))).toBe(
        FileCode
      );
      expect(getFileIcon(createDoc("page.html", false, "text/html"))).toBe(
        FileCode
      );
    });

    it("should return FileCode for code files by extension", () => {
      expect(getFileIcon(createDoc("app.js", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("app.jsx", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("app.ts", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("app.tsx", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("script.py", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("Main.java", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("app.c", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("app.cpp", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("app.h", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("style.scss", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("index.php", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("app.rb", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("main.go", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("main.rs", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("app.swift", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("app.kt", false, null))).toBe(FileCode);
    });

    it("should return FileJson for JSON files", () => {
      expect(
        getFileIcon(createDoc("data.json", false, "application/json"))
      ).toBe(FileJson);
      expect(getFileIcon(createDoc("data.json", false, null))).toBe(FileJson);
    });

    it("should return FileText for text files", () => {
      expect(getFileIcon(createDoc("note.txt", false, "text/plain"))).toBe(
        FileText
      );
      expect(getFileIcon(createDoc("README.md", false, "text/markdown"))).toBe(
        FileText
      );
      expect(getFileIcon(createDoc("note.txt", false, null))).toBe(FileText);
      expect(getFileIcon(createDoc("README.md", false, null))).toBe(FileText);
      expect(getFileIcon(createDoc("doc.markdown", false, null))).toBe(
        FileText
      );
    });

    it("should return File as default fallback", () => {
      expect(getFileIcon(createDoc("unknown.xyz", false, null))).toBe(File);
      expect(
        getFileIcon(createDoc("file", false, "application/octet-stream"))
      ).toBe(File);
    });

    it("should handle case-insensitive matching", () => {
      expect(getFileIcon(createDoc("FILE.ZIP", false, null))).toBe(FileArchive);
      expect(getFileIcon(createDoc("SCRIPT.PY", false, null))).toBe(FileCode);
      expect(getFileIcon(createDoc("DATA.JSON", false, null))).toBe(FileJson);
    });
  });
});
