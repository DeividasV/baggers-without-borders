/**
 * User Profile Utilities
 *
 * Re-exports centralized utilities and adds profile-specific functions
 */

import {
  calculatePasswordStrength as calculatePasswordStrengthShared,
  generateStrongPassword as generateStrongPasswordShared,
} from "@/src/lib/passwordStrength";

// Re-export centralized utilities
export {
  formatDateYMD,
  formatDateTimeYMD,
  formatTimeAgo,
  formatRoleOrStatus,
} from "@/src/lib/utils";

/**
 * Calculate password strength based on length and character variety
 */
export const calculatePasswordStrength = (
  password: string
): { strength: number; label: string; color: string } => {
  return calculatePasswordStrengthShared(password);
};

/**
 * Generate a strong random password
 */
export const generateStrongPassword = (): string => {
  return generateStrongPasswordShared(18);
};

/**
 * Format a date/time string for display with localized month name
 * This uses a different format than the centralized formatDateTime
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
