/**
 * Support Request Type Definitions
 */

export const SUPPORT_REQUEST_CATEGORIES = {
  GENERAL: "GENERAL",
  HOF_DATA: "HOF_DATA",
  TECHNICAL: "TECHNICAL",
} as const;

export type SupportRequestCategory =
  (typeof SUPPORT_REQUEST_CATEGORIES)[keyof typeof SUPPORT_REQUEST_CATEGORIES];

/**
 * Type guard to validate category values
 */
export const isValidCategory = (
  value: unknown
): value is SupportRequestCategory => {
  return Object.values(SUPPORT_REQUEST_CATEGORIES).includes(value as any);
};

/**
 * Support Request interface
 */
export interface SupportRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  attachments: Array<{ filename: string; originalName: string }>;
  assignedTo?: {
    id: string;
    displayName: string;
    email: string;
  } | null;
}
