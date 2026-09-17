/**
 * Support Request Constants & Utilities
 * Centralized configuration for helpdesk/support features
 */

export const STATUS_MAP = {
  OPEN: { label: "Open", color: "text-yellow-400" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-400" },
  WAITING_RESPONSE: { label: "Waiting Response", color: "text-purple-400" },
  NEEDS_INFO: { label: "Needs Info", color: "text-orange-400" },
  ON_HOLD: { label: "On Hold", color: "text-gray-400" },
  RESOLVED: { label: "Resolved", color: "text-green-400" },
  CLOSED: { label: "Closed", color: "text-slate-400" },
  REOPENED: { label: "Reopened", color: "text-red-400" },
} as const;

export const SUPPORT_CATEGORIES = [
  { id: "", label: "All Categories" },
  { id: "GENERAL", label: "General Question" },
  { id: "HOF_DATA", label: "HoF Table Data" },
] as const;

export const SUPPORT_STATUSES = [
  { id: "", label: "All Statuses" },
  { id: "OPEN", label: "Open" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "WAITING_RESPONSE", label: "Waiting Response" },
  { id: "NEEDS_INFO", label: "Needs Info" },
  { id: "ON_HOLD", label: "On Hold" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "CLOSED", label: "Closed" },
  { id: "REOPENED", label: "Reopened" },
] as const;

/**
 * Get status display label (maps internal statuses to user-friendly labels)
 */
export const getStatusLabel = (status: string): string => {
  const mapped = STATUS_MAP[status as keyof typeof STATUS_MAP];
  return mapped?.label || status;
};

/**
 * Get status color class for display
 */
export const getStatusColor = (status: string): string => {
  const mapped = STATUS_MAP[status as keyof typeof STATUS_MAP];
  return mapped?.color || "text-gray-400";
};

/**
 * Get category display label
 */
export const getCategoryLabel = (category: string): string => {
  const categoryMap = {
    GENERAL: "General",
    TECHNICAL: "Technical",
    HOF_DATA: "HoF Data",
  } as const;
  return categoryMap[category as keyof typeof categoryMap] || category;
};
