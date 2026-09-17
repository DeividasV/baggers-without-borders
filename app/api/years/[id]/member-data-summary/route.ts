import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// GET /api/years/[id]/member-data-summary - Get member data summary for a year
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    // Verify year exists
    const year = await prisma.year.findUnique({
      where: { id },
      select: { id: true, code: true, title: true },
    });

    if (!year) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    // Get HofEntry counts and metadata grouped by HOF
    const entriesByHof = await prisma.hofEntry.groupBy({
      by: ["hofId"],
      where: { yearId: id },
      _count: { id: true, memberId: true },
      _max: { updatedAt: true },
    });

    // Get HOF details for each group
    const hofIds = entriesByHof.map((entry) => entry.hofId);
    const hofs = await prisma.hallOfFame.findMany({
      where: { id: { in: hofIds } },
      select: { id: true, code: true, title: true, displayOrder: true },
      orderBy: { displayOrder: "asc" },
    });

    // Get unique member counts per HOF
    const memberCountsByHof = await Promise.all(
      hofIds.map(async (hofId) => {
        const uniqueMembers = await prisma.hofEntry.findMany({
          where: { yearId: id, hofId },
          distinct: ["memberId"],
          select: { memberId: true },
        });
        return { hofId, uniqueMembers: uniqueMembers.length };
      }),
    );

    // Combine results
    const hofEntries = entriesByHof.map((entry) => {
      const hof = hofs.find((h) => h.id === entry.hofId);
      const memberCount = memberCountsByHof.find(
        (m) => m.hofId === entry.hofId,
      );
      return {
        hofId: entry.hofId,
        hofCode: hof?.code || "Unknown",
        hofTitle: hof?.title || "Unknown HOF",
        displayOrder: hof?.displayOrder || 999,
        entryCount: entry._count.id,
        participantCount: memberCount?.uniqueMembers || 0,
        lastUpdated: entry._max.updatedAt,
      };
    });

    // Sort by HOF displayOrder
    hofEntries.sort((a, b) => a.displayOrder - b.displayOrder);

    // Get total HofEntry count
    const totalHofEntries = await prisma.hofEntry.count({
      where: { yearId: id },
    });

    // Get total UserYearParticipation count
    const totalYearParticipations = await prisma.userYearParticipation.count({
      where: { yearId: id },
    });

    return NextResponse.json({
      hofEntries,
      totalHofEntries,
      totalYearParticipations,
    });
  } catch (error) {
    console.error("Error fetching member data summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch member data summary" },
      { status: 500 },
    );
  }
}
