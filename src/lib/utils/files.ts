/**
 * File Utilities
 * Functions for handling files, validation, and file type detection
 */

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

/**
 * Document interface for file operations
 */
export interface Document {
  name: string;
  isFolder: boolean;
  mimeType?: string | null;
}

/**
 * Validate file type
 */
export function isValidFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Check if document can be previewed
 */
export function canPreview(document: Document): boolean {
  if (document.isFolder || !document.mimeType) return false;

  const previewableTypes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // PDFs
    "application/pdf",
    // Text files
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/html",
    "text/css",
    "text/javascript",
    "application/xml",
  ];

  return previewableTypes.includes(document.mimeType);
}

/**
 * Check if document is markdown
 */
export function isMarkdown(document: Document): boolean {
  if (document.isFolder) return false;

  // Check by MIME type
  if (document.mimeType === "text/markdown") return true;

  // Check by file extension
  const name = document.name.toLowerCase();
  return name.endsWith(".md") || name.endsWith(".markdown");
}

/**
 * Get appropriate icon component for file type
 */
export function getFileIcon(document: Document) {
  if (document.isFolder) {
    return Folder;
  }

  const mimeType = document.mimeType?.toLowerCase() || "";
  const fileName = document.name.toLowerCase();

  // Images
  if (mimeType.startsWith("image/")) {
    return FileImage;
  }

  // Videos
  if (mimeType.startsWith("video/")) {
    return FileVideo;
  }

  // Audio
  if (mimeType.startsWith("audio/")) {
    return FileAudio;
  }

  // Archives
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar") ||
    mimeType.includes("7z") ||
    mimeType.includes("gzip") ||
    fileName.endsWith(".zip") ||
    fileName.endsWith(".rar") ||
    fileName.endsWith(".tar") ||
    fileName.endsWith(".7z") ||
    fileName.endsWith(".gz")
  ) {
    return FileArchive;
  }

  // Spreadsheets
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".ods")
  ) {
    return FileSpreadsheet;
  }

  // Code files
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("python") ||
    mimeType.includes("java") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("xml") ||
    fileName.endsWith(".js") ||
    fileName.endsWith(".jsx") ||
    fileName.endsWith(".ts") ||
    fileName.endsWith(".tsx") ||
    fileName.endsWith(".py") ||
    fileName.endsWith(".java") ||
    fileName.endsWith(".c") ||
    fileName.endsWith(".cpp") ||
    fileName.endsWith(".h") ||
    fileName.endsWith(".html") ||
    fileName.endsWith(".css") ||
    fileName.endsWith(".scss") ||
    fileName.endsWith(".php") ||
    fileName.endsWith(".rb") ||
    fileName.endsWith(".go") ||
    fileName.endsWith(".rs") ||
    fileName.endsWith(".swift") ||
    fileName.endsWith(".kt")
  ) {
    return FileCode;
  }

  // JSON
  if (mimeType.includes("json") || fileName.endsWith(".json")) {
    return FileJson;
  }

  // Text files and markdown
  if (
    mimeType.startsWith("text/") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".markdown")
  ) {
    return FileText;
  }

  // Default fallback
  return File;
}
