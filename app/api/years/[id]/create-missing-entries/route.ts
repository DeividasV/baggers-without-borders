import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { logEvent } from "@/src/lib/auditLog";
import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";

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

    // Get ALL users regardless of status
    const users = await prisma.user.findMany({
      select: { id: true, email: true, status: true },
    });

    // Get all active HOFs
    const hofs = await prisma.hallOfFame.findMany({
      where: {
        isActive: true,
      },
      select: { id: true, code: true },
    });

    if (users.length === 0 || hofs.length === 0) {
      return NextResponse.json(
        {
          error: "No active users or halls of fame found",
        },
        { status: 400 },
      );
    }

    // Get existing entries for this year
    const existingEntries = await prisma.hofEntry.findMany({
      where: { yearId },
      select: { memberId: true, hofId: true },
    });

    const existingSet = new Set(
      existingEntries.map((e) => `${e.memberId}#${e.hofId}`),
    );

    // Build list of missing entries
    const toCreate = [];
    for (const user of users) {
      for (const hof of hofs) {
        const key = `${user.id}#${hof.id}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            memberId: user.id,
            hofId: hof.id,
            yearId,
            peaksInYear: 0,
            foreignPeaksInYear: 0,
            totalPeaks: 0, // Will be recalculated if needed
            foreignPeaks: 0,
          });
        }
      }
    }

    // Get existing UserYearParticipation records
    const existingParticipations = await prisma.userYearParticipation.findMany({
      where: { yearId },
      select: { userId: true },
    });

    const participationSet = new Set(
      existingParticipations.map((p) => p.userId),
    );

    // Build list of missing participations
    const participationsToCreate = users
      .filter((u) => !participationSet.has(u.id))
      .map((u) => ({
        userId: u.id,
        yearId,
        enabled: true,
        dataNotProvided: false,
      }));

    // Execute batch creates
    let hofEntriesCreated = 0;
    let participationsCreated = 0;
    let recalculationsPerformed = 0;

    if (toCreate.length > 0) {
      await prisma.hofEntry.createMany({
        data: toCreate,
      });
      hofEntriesCreated = toCreate.length;

      // Recalculate totals for each user+HOF combination
      // This ensures totalPeaks and foreignPeaks reflect cumulative data from all years
      const userHofPairs = new Set<string>();
      for (const entry of toCreate) {
        userHofPairs.add(`${entry.memberId}#${entry.hofId}`);
      }

      for (const pair of Array.from(userHofPairs)) {
        const [memberId, hofId] = pair.split("#");
        await recalculateTotalsForUserAndHof(memberId, hofId);
        recalculationsPerformed++;
      }
    }

    if (participationsToCreate.length > 0) {
      await prisma.userYearParticipation.createMany({
        data: participationsToCreate,
      });
      participationsCreated = participationsToCreate.length;
    }

    // Log the action
    await logEvent({
      eventType: "ADMIN_DATA_ENTRY_CREATE",
      eventCategory: "ADMIN",
      status: "SUCCESS",
      userId: session.user.id,
      headers: request.headers,
      resourceType: "Year",
      resourceId: yearId,
      actionDetails: {
        action: "create_missing_entries",
        hofEntriesCreated,
        participationsCreated,
        recalculationsPerformed,
        yearCode: year.code,
      },
    });

    return NextResponse.json({
      data: {
        hofEntriesCreated,
        participationsCreated,
        recalculationsPerformed,
        yearCode: year.code,
        yearTitle: year.title,
        totalUsers: users.length,
        totalHofs: hofs.length,
      },
    });
  } catch (error) {
    console.error("Error creating missing entries:", error);
    return NextResponse.json(
      { error: "Failed to create missing entries" },
      { status: 500 },
    );
  }
}
