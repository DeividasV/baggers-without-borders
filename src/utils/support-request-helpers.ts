/**
 * Support Request Utility Functions
 * Pure utility functions for common operations
 */

import type { SupportRequest } from "@/src/types/support-request";

// Pre-compile regex for better performance
const NEWLINE_REGEX = /\n/g;

/**
 * Normalize message text by replacing newlines with spaces
 */
export const normalizeMessageText = (message: string): string => {
  return message.replace(NEWLINE_REGEX, " ");
};

/**
 * Check if a ticket is new (created within last 24 hours)
 */
export const isNewTicket = (createdAt: string): boolean => {
  const ticketDate = new Date(createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60);
  return diffHours < 24;
};

/**
 * Check if a ticket belongs to the current user
 */
export const isUserTicket = (
  ticket: SupportRequest,
  userEmail: string | null | undefined
): boolean => {
  return !!userEmail && ticket.email.toLowerCase() === userEmail.toLowerCase();
};

/**
 * Get the most recent ticket date from a list
 */
export const getMostRecentTicketDate = (
  tickets: SupportRequest[]
): string | null => {
  return tickets.length > 0 ? tickets[0].createdAt : null;
};
