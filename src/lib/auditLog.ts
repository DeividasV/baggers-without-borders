/**
 * Audit logging service
 *
 * Provides centralized logging for authentication events, admin actions,
 * and security-related activities across the application.
 */

import { prisma } from "./prisma";
import { getGeoData } from "./geoip";
import { parseUserAgent } from "./utils/parseUserAgent";
import { EventType, EventCategory, EventStatus } from "@prisma/client";
import crypto from "crypto";

export interface LogEventParams {
  eventType: EventType;
  eventCategory: EventCategory;
  status: EventStatus;
  userId?: string | null;
  sessionId?: string | null;
  headers: Headers;
  resourceType?: string;
  resourceId?: string;
  actionDetails?: Record<string, any>;
  errorMessage?: string;
}

/**
 * Hash IP address using SHA-256 for privacy
 *
 * @param ip - IP address to hash
 * @returns SHA-256 hash of the IP
 */
function hashIpAddress(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

/**
 * Calculate retention date based on event category
 *
 * AUTH events: 90 days
 * ADMIN events: 730 days (2 years)
 * USER events: 730 days (2 years)
 *
 * @param eventCategory - Event category
 * @returns Date when log should be deleted
 */
function calculateRetentionDate(eventCategory: EventCategory): Date {
  const daysToRetain = eventCategory === EventCategory.AUTH ? 90 : 730;
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + daysToRetain);
  return retentionDate;
}

/**
 * Generic event logging function
 *
 * Extracts geographic and user agent data from headers,
 * hashes IP address, and stores event in audit log with
 * appropriate retention date.
 *
 * This function is fire-and-forget - failures are logged
 * to console but don't throw to prevent breaking application flows.
 *
 * @param params - Event parameters
 */
export async function logEvent(params: LogEventParams): Promise<void> {
  try {
    const {
      eventType,
      eventCategory,
      status,
      userId,
      sessionId,
      headers,
      resourceType,
      resourceId,
      actionDetails,
      errorMessage,
    } = params;

    // Extract geographic and IP data
    const geoData = getGeoData(headers);
    const ipHash = hashIpAddress(geoData.ip);

    // Parse user agent
    const userAgentString = headers.get("user-agent");
    const userAgent = parseUserAgent(userAgentString);

    // Calculate retention date
    const retentionDate = calculateRetentionDate(eventCategory);

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        eventType,
        eventCategory,
        status,
        userId: userId || null,
        sessionId: sessionId || null,
        ipAddressHash: ipHash,
        ipCountry: geoData.country,
        userAgent,
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        actionDetails: actionDetails ? JSON.stringify(actionDetails) : null,
        errorMessage: errorMessage || null,
        retentionDate,
      },
    });
  } catch (error) {
    // Log error but don't throw to prevent breaking application flows
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Log authentication-related events
 *
 * Convenience wrapper for auth events (login, register, password reset, etc.)
 *
 * @param eventType - Specific auth event type
 * @param status - SUCCESS or FAILURE
 * @param headers - Request headers
 * @param userId - User ID (if available)
 * @param sessionId - Session ID (if available)
 * @param actionDetails - Additional details (email, error reasons, etc.)
 * @param errorMessage - Error message if status is FAILURE
 */
export async function logAuthEvent(
  eventType: EventType,
  status: EventStatus,
  headers: Headers,
  options: {
    userId?: string;
    sessionId?: string;
    actionDetails?: Record<string, any>;
    errorMessage?: string;
  } = {}
): Promise<void> {
  await logEvent({
    eventType,
    eventCategory: EventCategory.AUTH,
    status,
    headers,
    ...options,
  });
}

/**
 * Log admin action events
 *
 * Tracks admin operations on resources (create, update, delete users, etc.)
 * Includes actor (admin performing action) and target (resource being modified)
 *
 * @param eventType - Specific admin event type
 * @param status - SUCCESS or FAILURE
 * @param headers - Request headers
 * @param actorUserId - ID of admin performing the action
 * @param options - Additional details about the action
 */
export async function logAdminAction(
  eventType: EventType,
  status: EventStatus,
  headers: Headers,
  actorUserId: string,
  options: {
    sessionId?: string;
    resourceType?: string;
    resourceId?: string;
    actionDetails?: Record<string, any>;
    errorMessage?: string;
  } = {}
): Promise<void> {
  await logEvent({
    eventType,
    eventCategory: EventCategory.ADMIN,
    status,
    userId: actorUserId,
    headers,
    ...options,
  });
}

/**
 * Log user action events
 *
 * Tracks user-initiated changes (password change, email change, etc.)
 *
 * @param eventType - Specific user event type
 * @param status - SUCCESS or FAILURE
 * @param headers - Request headers
 * @param userId - ID of user performing the action
 * @param options - Additional details about the action
 */
export async function logUserAction(
  eventType: EventType,
  status: EventStatus,
  headers: Headers,
  userId: string,
  options: {
    sessionId?: string;
    resourceType?: string;
    resourceId?: string;
    actionDetails?: Record<string, any>;
    errorMessage?: string;
  } = {}
): Promise<void> {
  await logEvent({
    eventType,
    eventCategory: EventCategory.USER,
    status,
    userId,
    headers,
    ...options,
  });
}
