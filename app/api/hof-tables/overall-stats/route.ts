import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// GET /api/hof-tables/overall-stats - Get overall statistics across all years and HOFs
export async function GET() {
  try {
    // Count all active members (excluding ARCHIVED status)
    const totalMembers = await prisma.user.count({
      where: {
        status: {
          not: "ARCHIVED",
        },
      },
    });

    // Fetch all HOF entries (no filters for year or HOF)
    const allEntries = await prisma.hofEntry.findMany({
      where: {
        year: {
          isActive: true,
        },
        hof: {
          isActive: true,
        },
      },
      select: {
        totalPeaks: true,
        foreignPeaks: true,
        memberId: true,
      },
    });

    // Group by member and sum their peaks across all years and HOFs
    const memberTotals = new Map<
      string,
      { totalPeaks: number; foreignPeaks: number }
    >();

    allEntries.forEach((entry) => {
      if (!memberTotals.has(entry.memberId)) {
        memberTotals.set(entry.memberId, { totalPeaks: 0, foreignPeaks: 0 });
      }
      const totals = memberTotals.get(entry.memberId)!;
      totals.totalPeaks += entry.totalPeaks;
      totals.foreignPeaks += entry.foreignPeaks;
    });

    // Calculate overall totals
    let totalPeaks = 0;
    let totalForeignPeaks = 0;

    memberTotals.forEach((totals) => {
      totalPeaks += totals.totalPeaks;
      totalForeignPeaks += totals.foreignPeaks;
    });

    return NextResponse.json({
      totalMembers,
      totalPeaks,
      totalForeignPeaks,
    });
  } catch (error) {
    console.error("Error fetching overall stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch overall stats" },
      { status: 500 }
    );
  }
}
