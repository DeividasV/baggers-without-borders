import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";
import { logEvent } from "@/src/lib/auditLog";

interface ImportEntry {
  memberId: string;
  hofId: string;
  peaksInYear: number;
  foreignPeaksInYear: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: yearId } = await params;

    // Get year details
    const year = await prisma.year.findUnique({
      where: { id: yearId },
    });

    if (!year) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    if (!year.isActive) {
      return NextResponse.json(
        { error: "Cannot import data to inactive year" },
        { status: 400 },
      );
    }

    // Parse request body
    const body = await request.json();
    const entries: ImportEntry[] = body.entries;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "No entries provided" },
        { status: 400 },
      );
    }

    // Perform import in transaction with full rollback on error
    const result = await prisma.$transaction(async (tx) => {
      let createdCount = 0;
      let updatedCount = 0;
      const memberHofPairs = new Set<string>(); // Batch load existing entries and participations (avoid N+1)
      const memberIdSet = new Set(entries.map((e) => e.memberId));
      const memberIds = Array.from(memberIdSet);
      const existingEntries = await tx.hofEntry.findMany({
        where: {
          yearId,
          memberId: { in: memberIds },
          hofId: { in: entries.map((e) => e.hofId) },
        },
        select: { id: true, memberId: true, hofId: true },
      });

      const existingParticipations = await tx.userYearParticipation.findMany({
        where: { yearId, userId: { in: memberIds } },
        select: { userId: true },
      });

      const existingMap = new Map(
        existingEntries.map((e) => [`${e.memberId}#${e.hofId}`, e.id]),
      );
      const participationSet = new Set(
        existingParticipations.map((p) => p.userId),
      );

      // Upsert all entries
      for (const entry of entries) {
        const key = `${entry.memberId}#${entry.hofId}`;
        const existingId = existingMap.get(key);

        if (existingId) {
          await tx.hofEntry.update({
            where: { id: existingId },
            data: {
              peaksInYear: entry.peaksInYear,
              foreignPeaksInYear: entry.foreignPeaksInYear,
            },
          });
          updatedCount++;
        } else {
          await tx.hofEntry.create({
            data: {
              memberId: entry.memberId,
              hofId: entry.hofId,
              yearId: yearId,
              peaksInYear: entry.peaksInYear,
              foreignPeaksInYear: entry.foreignPeaksInYear,
              totalPeaks: 0, // Will be recalculated
              foreignPeaks: 0, // Will be recalculated
            },
          });
          createdCount++;
        }

        // Track unique member+HOF pairs for recalculation (O(1) with Set)
        memberHofPairs.add(key);

        // Auto-create UserYearParticipation if missing
        if (!participationSet.has(entry.memberId)) {
          await tx.userYearParticipation.create({
            data: {
              id: `${entry.memberId}-${yearId}`,
              userId: entry.memberId,
              yearId: yearId,
              enabled: true,
              dataNotProvided: false,
              countryId: null,
            },
          });
          participationSet.add(entry.memberId);
        }
      }

      // Batch recalculation: deduplicate member+HOF pairs
      const recalculationPromises: Promise<number>[] = [];
      const keys = Array.from(memberHofPairs);
      for (const key of keys) {
        const [memberId, hofId] = key.split("#");
        recalculationPromises.push(
          recalculateTotalsForUserAndHof(memberId, hofId, tx),
        );
      }

      await Promise.all(recalculationPromises);

      return {
        imported: entries.length,
        created: createdCount,
        updated: updatedCount,
        recalculated: keys.length,
      };
    });

    // Log the import event
    await logEvent({
      eventType: "ADMIN_YEAR_UPDATE",
      eventCategory: "ADMIN",
      status: "SUCCESS",
      userId: session.user.id,
      headers: request.headers,
      resourceType: "Year",
      resourceId: yearId,
      actionDetails: {
        action: "bulk_import_member_data",
        yearCode: year.code,
        entriesImported: result.imported,
        entriesCreated: result.created,
        entriesUpdated: result.updated,
        memberHofPairsRecalculated: result.recalculated,
      },
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Import error:", errorMessage);
    console.error("Error stack:", errorStack);
    console.error("Full error object:", error);

    // Log failure
    try {
      const session = await getSession();
      const { id: yearId } = await params;
      await logEvent({
        eventType: "ADMIN_YEAR_UPDATE",
        eventCategory: "ADMIN",
        status: "FAILURE",
        userId: session.user.id,
        headers: request.headers,
        resourceType: "Year",
        resourceId: yearId,
        actionDetails: {
          action: "bulk_import_member_data",
          error: errorMessage,
          errorStack: errorStack?.split("\n").slice(0, 5).join("\n"),
        },
      });
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { error: `Failed to import data: ${errorMessage}` },
      { status: 500 },
    );
  }
}
