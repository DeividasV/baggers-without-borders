/**
 * Document Management Utilities
 *
 * Re-exports centralized file utilities
 */

import { Document } from "./types";

// Re-export all file utilities from centralized location
export {
  formatFileSize,
  truncatePath,
  canPreview,
  isMarkdown,
  getFileIcon,
  type Document as FileDocument,
} from "@/src/lib/utils";

/**
 * Format date with short relative time (documents-specific alias)
 * Uses formatDateShort from centralized utilities
 */
export { formatDateShort as formatDate } from "@/src/lib/utils";
