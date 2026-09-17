import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

/**
 * PUT /api/award-tiers/[id]
 * Updates an award tier's peak ranges
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Only admin users can update award tiers
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { minPeaks, maxPeaks } = body;

    // Validate input
    if (typeof minPeaks !== "number" || minPeaks < 0) {
      return NextResponse.json(
        { error: "Invalid minPeaks value" },
        { status: 400 }
      );
    }

    if (
      maxPeaks !== null &&
      (typeof maxPeaks !== "number" || maxPeaks < minPeaks)
    ) {
      return NextResponse.json(
        { error: "Invalid maxPeaks value" },
        { status: 400 }
      );
    }

    // Update the award tier
    const updatedTier = await prisma.awardTier.update({
      where: { id },
      data: {
        minPeaks,
        maxPeaks,
      },
    });

    return NextResponse.json(updatedTier);
  } catch (error) {
    console.error("Error updating award tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
