/**
 * Support Request Form Validation
 * Centralized validation logic for support request forms
 */

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export interface SupportRequestData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  hofId?: string;
}

/**
 * Validates support request form data
 * @param data - Form data to validate
 * @returns Validation result with error message if invalid
 */
export function validateSupportRequest(
  data: SupportRequestData
): ValidationResult {
  if (!data.name.trim()) {
    return { valid: false, error: "Please provide your name" };
  }

  if (!data.email.trim()) {
    return { valid: false, error: "Please provide your email address" };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, error: "Please provide a valid email address" };
  }

  if (!data.subject.trim()) {
    return { valid: false, error: "Please provide a subject" };
  }

  if (!data.message.trim()) {
    return { valid: false, error: "Please provide a message" };
  }

  if (data.category === "HOF_DATA" && !data.hofId) {
    return { valid: false, error: "Please select a Hall of Fame table" };
  }

  return { valid: true };
}
