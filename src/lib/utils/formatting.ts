/**
 * Formatting Utilities
 * Number and text formatting functions
 */

/**
 * Format file size from bytes to human-readable format
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format number with thousand separators (non-breakable space) and dot as decimal separator
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  const num = value.toString();
  const parts = num.split(".");
  // Add non-breakable space (\u00A0) every 3 digits from the right
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return parts.join(".");
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Truncate file path intelligently (preserves start and end)
 */
export function truncatePath(path: string, maxLength: number = 50): string {
  if (path.length <= maxLength) return path;
  const halfLength = Math.floor((maxLength - 3) / 2);
  return path.slice(0, halfLength) + "..." + path.slice(-halfLength);
}

/**
 * Format role or status for display (capitalize first letter, lowercase rest)
 */
export function formatRoleOrStatus(
  value: string | undefined
): string | undefined {
  if (!value) return undefined;
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format minutes to hours and minutes (e.g., 90 -> "1h30", 120 -> "2h00", 45 -> "0h45")
 */
export function formatMinutesToHoursMinutes(
  minutes: number | null | undefined
): string {
  if (minutes === null || minutes === undefined) return "";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours}h${mins.toString().padStart(2, "0")}`;
}

/**
 * Parse hours and minutes format to total minutes (e.g., "2h30" -> 150, "1h00" -> 60)
 */
export function parseHoursMinutesToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;

  // Remove any spaces
  const cleaned = timeStr.replace(/\s/g, "");

  // Check if it contains 'h'
  if (cleaned.includes("h")) {
    // Format: "2h30", "2h", "h30"
    const parts = cleaned.split("h");
    const hours = parts[0] ? parseInt(parts[0]) : 0;
    const minutes = parts[1] ? parseInt(parts[1]) : 0;

    return hours * 60 + minutes;
  } else {
    // Plain number - treat as total minutes
    const num = parseInt(cleaned);
    return isNaN(num) ? null : num;
  }
}

/**
 * Format time input as user types (e.g., "230" -> "2h30", "145" -> "1h45")
 */
export function formatTimeInput(value: string): string {
  // Remove non-digits
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  const totalMinutes = parseInt(digits);

  // If less than 60, treat as minutes
  if (totalMinutes < 60) {
    return `0h${digits.padStart(2, "0")}`;
  }

  // Convert to hours and minutes
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return `${hours}h${mins.toString().padStart(2, "0")}`;
}
