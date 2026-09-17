/**
 * Styling Utilities
 * Tailwind CSS helpers and styling functions
 */

import { type ClassValue, clsx } from "clsx";

/**
 * Merge class names (for Tailwind CSS)
 * Combines multiple class names intelligently, handling conditionals
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Get badge variant based on type, priority, or status
 */
export function getBadgeVariant(
  value: string,
  type: "type" | "priority" | "status"
):
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "feature"
  | "bug"
  | "enhancement" {
  if (type === "type") {
    const typeMap: Record<
      string,
      "default" | "feature" | "bug" | "enhancement" | "info"
    > = {
      FEATURE: "feature",
      BUG: "bug",
      ENHANCEMENT: "enhancement",
      DOCUMENTATION: "info",
      OTHER: "default",
    };
    return typeMap[value] || "default";
  }

  if (type === "priority") {
    const priorityMap: Record<string, "success" | "warning" | "danger"> = {
      LOW: "success",
      MEDIUM: "warning",
      HIGH: "danger",
      CRITICAL: "danger",
    };
    return priorityMap[value] || "default";
  }

  if (type === "status") {
    const statusMap: Record<
      string,
      "default" | "success" | "danger" | "info" | "primary"
    > = {
      PENDING: "default",
      APPROVED: "success",
      REJECTED: "danger",
      IN_PROGRESS: "info",
      COMPLETED: "primary",
    };
    return statusMap[value] || "default";
  }

  return "default";
}

/**
 * Get color class for priority/status/impact options
 */
export function getOptionColor(
  value: string,
  options: Array<{ value: string; color?: string }>
): string {
  const option = options.find((opt) => opt.value === value);
  return option?.color || "text-gray-600";
}

/**
 * Get label for a value from an options array
 */
export function getOptionLabel(
  value: string,
  options: Array<{ value: string; label: string }>
): string {
  return options.find((opt) => opt.value === value)?.label || value;
}
