import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import type { Session } from "next-auth";

/**
 * Auth utilities for API routes
 *
 * NOTE: Most routes are protected by middleware.ts
 * These helpers are for getting session data in already-protected routes
 */

/**
 * Get current session (assumes middleware has already validated auth)
 * Use this in routes protected by middleware
 */
export async function getSession(): Promise<Session> {
  const session = await getServerSession(authOptions);

  // If middleware is working correctly, session should always exist
  // But we add a safety check just in case
  if (!session?.user?.id) {
    throw new Error(
      "Session not found - middleware may not be configured correctly"
    );
  }

  return session;
}

/**
 * Get current user ID (convenience method)
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  return session.user.id;
}

/**
 * Check if current user is admin (convenience method)
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.user.role === "ADMIN";
}

/**
 * Get session or null (for public routes)
 * Handles JWT decryption errors gracefully (e.g., old cookies with different secrets)
 */
export async function getOptionalSession(): Promise<Session | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id ? session : null;
  } catch (error) {
    // JWT decryption failed (old cookie with different secret) - return null
    console.warn(
      "Session decryption failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}
