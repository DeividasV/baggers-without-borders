import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

const CHANGE_REQUEST_TICKET_PREFIX = "BWB";
const CHANGE_REQUEST_SEQUENCE_PAD = 4;
const CHANGE_REQUEST_TICKET_REGEX = /^BWB-\d{4}-\d{4}$/i;

type ChangeRequestLookupClient = PrismaClient | Prisma.TransactionClient;

export function isMissingFriendlyTicketSchema(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("ticketnumber") ||
    message.includes("ticketslug") ||
    message.includes("no such column: ticketnumber") ||
    message.includes("no such column: ticketslug") ||
    message.includes("no such table: change_request_ticket_counters") ||
    message.includes('column "ticketnumber"') ||
    message.includes('column "ticketslug"') ||
    message.includes('relation "change_request_ticket_counters"')
  );
}

function formatChangeRequestTicketNumber(year: number, sequence: number): string {
  return `${CHANGE_REQUEST_TICKET_PREFIX}-${year}-${String(sequence).padStart(CHANGE_REQUEST_SEQUENCE_PAD, "0")}`;
}

function getChangeRequestTicketSlug(ticketNumber: string): string {
  return ticketNumber.trim().toLowerCase();
}

function isFriendlyChangeRequestIdentifier(identifier: string): boolean {
  return CHANGE_REQUEST_TICKET_REGEX.test(identifier.trim());
}

export async function generateChangeRequestTicketIdentifiers(
  tx: Prisma.TransactionClient,
  createdAt: Date = new Date()
): Promise<{ ticketNumber: string; ticketSlug: string }> {
  const year = createdAt.getUTCFullYear();

  const counter = await tx.changeRequestTicketCounter.upsert({
    where: { year },
    update: {
      nextNumber: {
        increment: 1,
      },
    },
    create: {
      year,
      // Reserve the next value while assigning 1 to this first ticket in a year.
      nextNumber: 2,
    },
  });

  const sequence = counter.nextNumber - 1;
  const ticketNumber = formatChangeRequestTicketNumber(year, sequence);

  return {
    ticketNumber,
    ticketSlug: getChangeRequestTicketSlug(ticketNumber),
  };
}

export async function resolveChangeRequestId(
  identifier: string,
  client: ChangeRequestLookupClient = prisma
): Promise<string | null> {
  const value = identifier.trim();
  if (!value) {
    return null;
  }

  try {
    const match = await client.changeRequest.findFirst({
      where: {
        OR: [
          { id: value },
          { ticketNumber: value.toUpperCase() },
          { ticketSlug: value.toLowerCase() },
        ],
      },
      select: {
        id: true,
      },
    });

    return match?.id ?? null;
  } catch (error) {
    if (!isMissingFriendlyTicketSchema(error)) {
      throw error;
    }

    // Backward-compatible fallback for environments that have not run the migration yet.
    const legacyMatch = await client.changeRequest.findUnique({
      where: { id: value },
      select: { id: true },
    });

    return legacyMatch?.id ?? null;
  }
}
