/**
 * Identifier utilities for email/username detection
 *
 * Centralized logic for detecting and normalizing user identifiers
 * used across authentication flows.
 */

export interface IdentifierInfo {
  identifier: string;
  type: "email" | "username";
  normalized: string;
}

/**
 * Detect if input is an email address or username
 *
 * @param input - User input (email or username)
 * @returns Identifier info with type and normalized value
 */
export function parseIdentifier(input: string): IdentifierInfo {
  const isEmail = input.includes("@");
  const normalized = input.toLowerCase().trim();

  return {
    identifier: input,
    type: isEmail ? "email" : "username",
    normalized,
  };
}

/**
 * Build Prisma where clause for email or username lookup
 *
 * @param input - User input (email or username)
 * @returns Prisma where clause object
 */
export function buildIdentifierWhereClause(input: string):
  | {
      email: string;
    }
  | { username: string } {
  const { type, normalized } = parseIdentifier(input);
  return type === "email" ? { email: normalized } : { username: normalized };
}
