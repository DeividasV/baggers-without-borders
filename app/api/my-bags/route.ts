import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

// GET /api/my-bags - Get current user's HOF entries
export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated
    const userId = await getCurrentUserId();

    // Get user's allowManualEntry flag
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        allowManualEntry: true,
      },
    });

    // Get user's participation data
    const hofParticipations = await prisma.userHofParticipation.findMany({
      where: { userId },
      select: {
        hofId: true,
        enabled: true,
      },
    });

    const yearParticipations = await prisma.userYearParticipation.findMany({
      where: { userId },
      select: {
        yearId: true,
        enabled: true,
      },
    });

    // Create sets of participating HOF and Year IDs
    const participatingHofIds = new Set(
      hofParticipations.filter((p) => p.enabled).map((p) => p.hofId)
    );

    const participatingYearIds = new Set(
      yearParticipations.filter((p) => p.enabled).map((p) => p.yearId)
    );

    // Fetch all entries for current user (only active HOFs and Years)
    const allEntries = await prisma.hofEntry.findMany({
      where: {
        memberId: userId,
        hof: {
          isActive: true,
        },
        year: {
          isActive: true,
        },
      },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        hof: {
          select: {
            id: true,
            code: true,
            title: true,
            displayOrder: true,
            isActive: true,
            allowManualEntry: true,
          },
        },
        year: {
          select: {
            id: true,
            code: true,
            title: true,
            displayOrder: true,
            isActive: true,
            allowManualEntry: true,
          },
        },
      },
      orderBy: [
        { year: { displayOrder: "desc" } },
        { hof: { displayOrder: "asc" } },
      ],
    });

    // Mark entries with participation status
    const entries = allEntries.map((entry) => ({
      ...entry,
      isParticipatingHof:
        participatingHofIds.size === 0 || participatingHofIds.has(entry.hofId),
      isParticipatingYear:
        participatingYearIds.size === 0 ||
        participatingYearIds.has(entry.yearId),
      isParticipating:
        (participatingHofIds.size === 0 ||
          participatingHofIds.has(entry.hofId)) &&
        (participatingYearIds.size === 0 ||
          participatingYearIds.has(entry.yearId)),
    }));

    // Count disabled entries
    const disabledCount = entries.filter((e) => !e.isParticipating).length;

    return NextResponse.json({
      entries,
      userAllowManualEntry: user?.allowManualEntry ?? true,
      disabledCount,
    });
  } catch (error) {
    console.error("Error fetching my bags entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
