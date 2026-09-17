import { SITE_NAME } from "@/src/config/site";
/**
 * Constants for the BWB Climbing App
 */

// Application constants
export const APP_NAME = SITE_NAME;
export const APP_PORT = 1345; // Ben Nevis height in meters
export const APP_VERSION = "1.0.0";

// File upload constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Change request constants
export const CHANGE_REQUEST_TYPES = [
  { value: "FEATURE", label: "Feature Request" },
  { value: "BUG", label: "Bug Report" },
  { value: "ENHANCEMENT", label: "Enhancement" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "OTHER", label: "Other" },
];

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "text-green-600" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
  { value: "HIGH", label: "High", color: "text-orange-600" },
  { value: "CRITICAL", label: "Critical", color: "text-red-600" },
];

export const IMPACT_OPTIONS = [
  { value: "LOW", label: "Low", color: "text-green-600" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
  { value: "HIGH", label: "High", color: "text-red-600" },
];

export const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", color: "text-gray-600" },
  { value: "APPROVED", label: "Approved", color: "text-green-600" },
  { value: "REJECTED", label: "Rejected", color: "text-red-600" },
  { value: "IN_PROGRESS", label: "In Progress", color: "text-blue-600" },
  { value: "COMPLETED", label: "Completed", color: "text-purple-600" },
];

// Git commit category options (mapped from commit scope)
export const CATEGORY_OPTIONS = [
  { value: "ui", label: "User Interface", color: "text-blue-400" },
  { value: "api", label: "Backend API", color: "text-green-400" },
  { value: "db", label: "Database", color: "text-yellow-400" },
  { value: "auth", label: "Authentication", color: "text-red-400" },
  { value: "docs", label: "Documentation", color: "text-gray-400" },
  { value: "test", label: "Testing", color: "text-purple-400" },
  { value: "deploy", label: "Deployment", color: "text-orange-400" },
  { value: "other", label: "Other", color: "text-gray-500" },
];

// Source filter options for change requests
export const SOURCE_OPTIONS = [
  { value: "ALL", label: "All Sources" },
  { value: "GIT", label: "From Git" },
  { value: "MANUAL", label: "Manual Entry" },
];

// Affected areas for business reporting
export const AFFECTED_AREAS_OPTIONS = [
  { value: "ui", label: "User Interface", icon: "🖥️" },
  { value: "reports", label: "Reports & Analytics", icon: "📊" },
  { value: "security", label: "Security", icon: "🔒" },
  { value: "data-management", label: "Data Management", icon: "💾" },
  { value: "user-management", label: "User Management", icon: "👥" },
  { value: "documentation", label: "Documentation", icon: "📚" },
  { value: "performance", label: "Performance", icon: "⚡" },
  { value: "quality", label: "Quality Assurance", icon: "✅" },
  { value: "administration", label: "Administration", icon: "⚙️" },
  { value: "integration", label: "Integration", icon: "🔗" },
];

// User roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

// NOTE: credentials for development accounts are intentionally NOT defined
// here. Hardcoding usernames and a shared password in shipped application code
// leaks real accounts. Demo accounts are created by
// scripts/seed/seed-demo-users.js with a generated password.

// API endpoints
export const API_ENDPOINTS = {
  AUTH: "/api/auth",
  USERS: "/api/users",
  CHANGE_REQUESTS: "/api/change-requests",
  ATTACHMENTS: "/attachments",
};

// Navigation tabs
export const NAV_TABS = {
  DASHBOARD: "dashboard",
  USERS: "users",
  CHANGE_REQUESTS: "change-requests",
};

// File paths
export const UPLOAD_PATHS = {
  CHANGE_REQUESTS: "/uploads/change-requests/",
  SUPPORT_REQUESTS: "/uploads/support-requests/",
};

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: "This field is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters.",
  FILE_TOO_LARGE: "File size must be less than 10MB.",
  INVALID_FILE_TYPE: "File type not supported.",
};

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: "User created.",
  USER_UPDATED: "User updated.",
  USER_DELETED: "User deleted.",
  CHANGE_REQUEST_CREATED: "Change request created.",
  CHANGE_REQUEST_UPDATED: "Change request updated.",
  CHANGE_REQUEST_DELETED: "Change request deleted.",
  FILE_UPLOADED: "File uploaded.",
  FILE_DELETED: "File deleted.",
};

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You don't have permission to access this feature.",
  USER_NOT_FOUND: "User not found.",
  INVALID_CREDENTIALS:
    "Incorrect email/username or password. Check your credentials and try again.",
  CHANGE_REQUEST_NOT_FOUND: "Change request not found.",
  FILE_UPLOAD_FAILED:
    "Couldn't upload file. Check the file size (max 10MB) and format, then try again.",
  GENERIC_ERROR:
    "Something went wrong. Please try again or contact support if the problem continues.",
  NETWORK_ERROR: "Unable to connect. Check your connection and try again.",
};

// Upload directories
// Uses UPLOADS_DIR env var (set in docker-compose.prod.yml as /app/uploads)
// The Docker volume maps /app/uploads (container) -> /srv/bwb/uploads (host)
export const getUploadsBaseDir = (): string => {
  if (process.env.UPLOADS_DIR) {
    return process.env.UPLOADS_DIR;
  }

  // In production we require an explicit, non-public uploads directory.
  // Falling back to "public/" would bypass all API-level auth checks.
  if (process.env.NODE_ENV === "production") {
    throw new Error("UPLOADS_DIR must be set in production");
  }

  // Development fallback (non-public)
  const path = require("path");
  return path.join(process.cwd(), "uploads");
};

/**
 * Directory holding backup archives.
 *
 * Single source of truth: listing backups, downloading one, and the health
 * check must all resolve the same path, or downloads silently 404.
 */
export const getBackupDir = (): string => {
  if (process.env.BACKUP_DIR) {
    return process.env.BACKUP_DIR;
  }

  const path = require("path");
  // Inside the Docker image the volume is mounted here; see docker-compose.prod.yml.
  return process.env.NODE_ENV === "production"
    ? "/app/backups"
    : path.join(process.cwd(), "backups");
};

export const getDocumentsDir = (): string => {
  const path = require("path");
  return path.join(getUploadsBaseDir(), "documents");
};

export const getUserConsentsDir = (): string => {
  const path = require("path");
  return path.join(getUploadsBaseDir(), "user-consents");
};

export const getChangeRequestsDir = (): string => {
  const path = require("path");
  return path.join(getUploadsBaseDir(), "change-requests");
};

export const getConsentTypesDir = (): string => {
  const path = require("path");
  return path.join(getUploadsBaseDir(), "consent-types");
};

export const getMeisterReportsDir = (): string => {
  const path = require("path");
  return path.join(getUploadsBaseDir(), "meister-reports");
};

export const getNotesDir = (): string => {
  const path = require("path");
  return path.join(getUploadsBaseDir(), "notes");
};

export const getSupportRequestsDir = (): string => {
  const path = require("path");
  return path.join(getUploadsBaseDir(), "support-requests");
};

export const getJournalPhotosDir = (): string => {
  const path = require("path");
  return path.join(getUploadsBaseDir(), "journal");
};

export const getSponsorsDir = (): string => {
  const path = require("path");
  return path.join(getUploadsBaseDir(), "sponsors");
};

/**
 * Get the file path for a HoF Meister report image
 * @param configId HofYearConfig ID
 * @returns Absolute path to the image file
 */
export const getMeisterReportImagePath = (configId: string): string => {
  const path = require("path");
  return path.join(getMeisterReportsDir(), `${configId}.webp`);
};
