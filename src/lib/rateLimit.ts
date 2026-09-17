/**
 * Database-backed rate limiting utility
 *
 * Provides persistent rate limiting across server restarts and multiple instances.
 * Replaces in-memory Map-based rate limiting with database storage.
 */

import { prisma } from "./prisma";
import crypto from "crypto";

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export type RateLimitType =
  | "registration"
  | "password-reset"
  | "email-verification"
  | "donation-checkout"
  | "support-request"
  | "note-creation";

// Default configurations for different rate limit types
const defaultConfigs: Record<RateLimitType, RateLimitConfig> = {
  registration: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  "password-reset": {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  "email-verification": {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  "donation-checkout": {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  "note-creation": {
    maxAttempts: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  "support-request": {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
};

/**
 * Hash identifier for privacy (e.g., IP addresses)
 * For emails, we use them directly as they're already user-specific
 */
function hashIdentifier(identifier: string): string {
  // Check if it looks like an IP address (contains dots or colons)
  const isIpAddress = identifier.includes(".") || identifier.includes(":");

  if (isIpAddress) {
    // Hash IP addresses for privacy
    return crypto.createHash("sha256").update(identifier).digest("hex");
  }

  // Use emails directly (they're already user-specific identifiers)
  return identifier;
}

/**
 * Check if rate limit has been exceeded and record attempt
 *
 * @param identifier - IP address or email to check
 * @param type - Type of rate limit (registration, password-reset, etc.)
 * @param config - Optional custom rate limit configuration
 * @returns true if request should be allowed, false if rate limit exceeded
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType,
  config?: RateLimitConfig,
): Promise<boolean> {
  const rateLimitConfig = config || defaultConfigs[type];
  const hashedIdentifier = hashIdentifier(identifier);
  const now = Date.now();
  const windowStart = new Date(now - rateLimitConfig.windowMs);

  try {
    // Count recent attempts within the time window
    const recentAttempts = await prisma.rateLimitAttempt.count({
      where: {
        identifier: hashedIdentifier,
        type,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    // Check if limit exceeded
    if (recentAttempts >= rateLimitConfig.maxAttempts) {
      return false;
    }

    // Record this attempt
    await prisma.rateLimitAttempt.create({
      data: {
        identifier: hashedIdentifier,
        type,
      },
    });

    return true;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open - allow request if database error
    // This prevents rate limiting from blocking all traffic during DB issues
    return true;
  }
}

/**
 * Get remaining attempts for an identifier
 *
 * @param identifier - IP address or email to check
 * @param type - Type of rate limit
 * @param config - Optional custom rate limit configuration
 * @returns Number of remaining attempts
 */
export async function getRemainingAttempts(
  identifier: string,
  type: RateLimitType,
  config?: RateLimitConfig,
): Promise<number> {
  const rateLimitConfig = config || defaultConfigs[type];
  const hashedIdentifier = hashIdentifier(identifier);
  const now = Date.now();
  const windowStart = new Date(now - rateLimitConfig.windowMs);

  try {
    const recentAttempts = await prisma.rateLimitAttempt.count({
      where: {
        identifier: hashedIdentifier,
        type,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    return Math.max(0, rateLimitConfig.maxAttempts - recentAttempts);
  } catch (error) {
    console.error("Failed to get remaining attempts:", error);
    return rateLimitConfig.maxAttempts; // Return max on error
  }
}

/**
 * Reset rate limit for an identifier (useful for admin override)
 *
 * @param identifier - IP address or email to reset
 * @param type - Type of rate limit to reset
 */
export async function resetRateLimit(
  identifier: string,
  type: RateLimitType,
): Promise<void> {
  const hashedIdentifier = hashIdentifier(identifier);

  try {
    await prisma.rateLimitAttempt.deleteMany({
      where: {
        identifier: hashedIdentifier,
        type,
      },
    });
  } catch (error) {
    console.error("Failed to reset rate limit:", error);
  }
}

/**
 * Clean up old rate limit attempts (should be run periodically)
 * Deletes attempts older than the longest window (1 hour by default)
 *
 * @param olderThanMs - Delete attempts older than this many milliseconds (default: 24 hours)
 */
export async function cleanupOldAttempts(
  olderThanMs: number = 24 * 60 * 60 * 1000,
): Promise<number> {
  const cutoffDate = new Date(Date.now() - olderThanMs);

  try {
    const result = await prisma.rateLimitAttempt.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("Failed to cleanup old rate limit attempts:", error);
    return 0;
  }
}
