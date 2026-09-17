import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

/**
 * Recalculate cumulative totals for all years for a specific user and HOF
 *
 * This function:
 * 1. Fetches all entries for the user+HOF combination, ordered by year
 * 2. Calculates cumulative domestic peaks (totalPeaks) and cumulative foreign peaks (foreignPeaks)
 * 3. Updates only the entries that have changed
 * 4. Uses a transaction to ensure data consistency
 *
 * Cumulative calculations:
 * - totalPeaks = sum of all peaksInYear from BASELINE to current year
 * - foreignPeaks = sum of all foreignPeaksInYear from BASELINE to current year
 *
 * @param memberId - User ID
 * @param hofId - Hall of Fame ID
 * @param prismaClient - Optional Prisma client instance (can be main client or transaction client)
 * @returns Number of entries updated
 */
export async function recalculateTotalsForUserAndHof(
  memberId: string,
  hofId: string,
  prismaClient: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<number> {
  // Get all entries for this user and HOF, ordered by year displayOrder
  const allEntries = await prismaClient.hofEntry.findMany({
    where: {
      memberId,
      hofId,
      year: {
        isActive: true, // Only active years
      },
    },
    include: {
      year: {
        select: {
          id: true,
          code: true,
          displayOrder: true,
        },
      },
    },
    orderBy: {
      year: {
        displayOrder: "asc",
      },
    },
  });

  if (allEntries.length === 0) {
    return 0;
  }

  // Calculate cumulative totals for both domestic and foreign peaks
  let cumulativeDomestic = 0;
  let cumulativeForeign = 0;
  const updates: Promise<any>[] = [];

  for (const entry of allEntries) {
    // Add current year's peaks to cumulative totals
    cumulativeDomestic += entry.peaksInYear;
    cumulativeForeign += entry.foreignPeaksInYear;

    // Check if either cumulative value needs updating
    const needsUpdate =
      entry.totalPeaks !== cumulativeDomestic ||
      entry.foreignPeaks !== cumulativeForeign;

    if (needsUpdate) {
      console.log(
        `  Updating entry ${entry.id}: totalPeaks ${entry.totalPeaks} → ${cumulativeDomestic}, foreignPeaks ${entry.foreignPeaks} → ${cumulativeForeign}`,
      );
      updates.push(
        prismaClient.hofEntry.update({
          where: { id: entry.id },
          data: {
            totalPeaks: cumulativeDomestic,
            foreignPeaks: cumulativeForeign,
          },
        }),
      );
    }
  }

  // Execute all updates
  if (updates.length > 0) {
    // If prismaClient has $transaction, we're not in a transaction yet
    // If it doesn't, we're already in a transaction and should execute directly
    if (
      "$transaction" in prismaClient &&
      typeof prismaClient.$transaction === "function"
    ) {
      await (prismaClient as any).$transaction(updates);
    } else {
      // Already in a transaction, execute updates sequentially to ensure consistency
      for (const update of updates) {
        await update;
      }
    }
    console.log(
      `✅ Recalculated ${updates.length} entries for member ${memberId}, HOF ${hofId}`,
    );
  } else {
    console.log(
      `  No updates needed for member ${memberId}, HOF ${hofId} (already up-to-date)`,
    );
  }

  return updates.length;
}
