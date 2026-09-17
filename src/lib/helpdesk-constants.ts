/**
 * Helpdesk system constants
 * Centralized magic numbers and configuration values
 */

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total
export const MAX_CONTENT_LENGTH = 9999; // Max characters in note content

// Edit window for notes (milliseconds)
export const EDIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// File type whitelist for security
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".csv",
];

// Rate limiting
export const NOTE_RATE_LIMIT = {
  maxAttempts: 20,
  windowMs: 15 * 60 * 1000, // 15 minutes
};
