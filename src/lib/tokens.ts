import crypto from "crypto";

/**
 * Generate a secure random token
 * @returns hex-encoded token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a verification token with expiration
 * @returns object with token and expiration date (24 hours)
 */
export function generateVerificationToken(): {
  token: string;
  expires: Date;
} {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hour expiry

  return { token, expires };
}

/**
 * Generate a password reset token with expiration
 * @returns object with token and expiration date (1 hour)
 */
export function generateResetToken(): { token: string; expires: Date } {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour expiry

  return { token, expires };
}

/**
 * Check if a token has expired
 * @param expiresDate - The expiration date to check
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(expiresDate: Date | null): boolean {
  if (!expiresDate) return true;
  return new Date() > expiresDate;
}

/**
 * Generate SHA256 hash of content
 * @param content - Content to hash
 * @returns hex-encoded hash
 */
export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
