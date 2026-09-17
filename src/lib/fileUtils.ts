/**
 * File and Path Utilities
 * Provides secure path handling and normalization for document management
 */

import path from "path";

/**
 * Normalize a document path by removing leading slash
 * This prevents path.join from treating it as an absolute path
 * 
 * @param docPath - The document path to normalize
 * @returns Normalized path without leading slash
 * 
 * @example
 * normalizeDocumentPath("/uploads/file.pdf") // "uploads/file.pdf"
 * normalizeDocumentPath("uploads/file.pdf")  // "uploads/file.pdf"
 */
export function normalizeDocumentPath(docPath: string): string {
  return docPath.startsWith("/") ? docPath.substring(1) : docPath;
}

/**
 * Safely resolve a path relative to a base directory
 * SECURITY: Prevents path traversal attacks by ensuring resolved path stays within basePath
 * 
 * @param basePath - The base directory (e.g., uploads directory)
 * @param relativePath - The relative path provided by user/database
 * @returns Resolved absolute path, or null if path traversal detected
 * 
 * @example
 * safeResolvePath("/uploads", "user/file.pdf")     // "/uploads/user/file.pdf"
 * safeResolvePath("/uploads", "../etc/passwd")     // null (path traversal)
 * safeResolvePath("/uploads", "/etc/passwd")       // null (absolute path)
 */
export function safeResolvePath(
  basePath: string,
  relativePath: string,
): string | null {
  // Normalize the relative path first
  const normalized = normalizeDocumentPath(relativePath);

  // Resolve to absolute path
  const resolved = path.resolve(basePath, normalized);

  // Ensure resolved path starts with base path (prevents traversal)
  const resolvedBase = path.resolve(basePath);
  if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
    console.warn("Path traversal attempt detected:", {
      basePath,
      relativePath,
      resolved,
    });
    return null;
  }

  return resolved;
}

/**
 * Validate a folder name for security
 * Prevents path traversal sequences and invalid characters
 * 
 * @param folderName - The folder name to validate
 * @returns True if valid, false otherwise
 * 
 * @example
 * isValidFolderName("MyFolder")     // true
 * isValidFolderName("../etc")       // false
 * isValidFolderName("folder/sub")   // false (no slashes allowed)
 */
export function isValidFolderName(folderName: string): boolean {
  if (!folderName || folderName.trim().length === 0) {
    return false;
  }

  // Check for path traversal sequences
  if (folderName.includes("..") || folderName.includes("./")) {
    return false;
  }

  // Check for path separators (folder names should be single level)
  if (folderName.includes("/") || folderName.includes("\\")) {
    return false;
  }

  // Check for null bytes (security issue)
  if (folderName.includes("\x00")) {
    return false;
  }

  // Check for leading/trailing dots (hidden files, traversal)
  if (folderName.startsWith(".") || folderName.endsWith(".")) {
    return false;
  }

  return true;
}

/**
 * Validate a file name for security
 * Similar to folder validation but allows file extensions
 * 
 * @param fileName - The file name to validate
 * @returns True if valid, false otherwise
 */
export function isValidFileName(fileName: string): boolean {
  if (!fileName || fileName.trim().length === 0) {
    return false;
  }

  // Check for path traversal sequences
  if (fileName.includes("..") || fileName.includes("./")) {
    return false;
  }

  // Check for path separators
  if (fileName.includes("/") || fileName.includes("\\")) {
    return false;
  }

  // Check for null bytes
  if (fileName.includes("\x00")) {
    return false;
  }

  return true;
}
