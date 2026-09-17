import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";
import { logUserAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

// GET /api/my-bags/[id] - Get a single entry (only if it belongs to current user)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated
    const userId = await getCurrentUserId();

    const { id } = await params;

    const entry = await prisma.hofEntry.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            displayName: true,
            allowManualEntry: true,
          },
        },
        hof: {
          select: {
            id: true,
            code: true,
            title: true,
            allowManualEntry: true,
          },
        },
        year: {
          select: {
            id: true,
            code: true,
            title: true,
            allowManualEntry: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Ensure the entry belongs to the current user
    if (entry.memberId !== userId) {
      return NextResponse.json(
        { error: "You can only view your own entries" },
        { status: 403 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching my bags entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry" },
      { status: 500 }
    );
  }
}

// PUT /api/my-bags/[id] - Update an entry (only if it belongs to current user)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated
    const userId = await getCurrentUserId();

    const { id } = await params;
    const body = await request.json();
    const { totalPeaks, peaksInYear, foreignPeaks, foreignPeaksInYear } = body;

    // Verify the entry exists and belongs to the current user
    const existing = await prisma.hofEntry.findUnique({
      where: { id },
      include: {
        member: true,
        hof: true,
        year: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (existing.memberId !== userId) {
      return NextResponse.json(
        { error: "You can only update your own entries" },
        { status: 403 }
      );
    }

    // Check if manual entry is allowed
    if (!existing.member.allowManualEntry) {
      return NextResponse.json(
        {
          error:
            "Manual data entry is disabled for your account. Please contact an administrator if this is incorrect.",
        },
        { status: 403 }
      );
    }

    if (!existing.hof.allowManualEntry) {
      return NextResponse.json(
        { error: "Manual data entry is disabled for this hall of fame." },
        { status: 403 }
      );
    }

    if (!existing.year.allowManualEntry) {
      return NextResponse.json(
        { error: "Manual data entry is disabled for this year." },
        { status: 403 }
      );
    }

    // Update the entry
    const hofEntry = await prisma.hofEntry.update({
      where: { id },
      data: {
        peaksInYear: peaksInYear ?? existing.peaksInYear,
        foreignPeaksInYear: foreignPeaksInYear ?? existing.foreignPeaksInYear,
        // Note: totalPeaks and foreignPeaks will be recalculated below
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
          },
        },
        year: {
          select: {
            id: true,
            code: true,
            title: true,
            displayOrder: true,
          },
        },
      },
    });

    // Recalculate totalPeaks for all years (from BASELINE onwards)
    await recalculateTotalsForUserAndHof(existing.memberId, existing.hofId);

    // Fetch the updated entry with recalculated totalPeaks
    const updatedEntry = await prisma.hofEntry.findUnique({
      where: { id },
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
          },
        },
        year: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    // Log user bag update
    await logUserAction(
      EventType.USER_BAG_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      userId,
      {
        actionDetails: {
          hofCode: updatedEntry?.hof.code,
          yearCode: updatedEntry?.year.code,
          peaksInYear,
          foreignPeaksInYear,
        },
      }
    );

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error updating my bags entry:", error);

    // Log failure
    try {
      const userId = await getCurrentUserId();
      await logUserAction(
        EventType.USER_BAG_UPDATE,
        EventStatus.FAILURE,
        request.headers,
        userId,
        {
          errorMessage: "Failed to update bag entry",
        }
      );
    } catch (logError) {
      console.error("Failed to log action:", logError);
    }

    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/my-bags/[id] - Delete an entry (only if it belongs to current user)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated
    const userId = await getCurrentUserId();

    const { id } = await params;

    // Verify the entry exists and belongs to the current user
    const existing = await prisma.hofEntry.findUnique({
      where: { id },
      include: {
        hof: {
          select: {
            code: true,
          },
        },
        year: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (existing.memberId !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own entries" },
        { status: 403 }
      );
    }

    await prisma.hofEntry.delete({
      where: { id },
    });

    // Log user bag deletion
    await logUserAction(
      EventType.USER_BAG_DELETE,
      EventStatus.SUCCESS,
      request.headers,
      userId,
      {
        actionDetails: {
          hofCode: existing.hof.code,
          yearCode: existing.year.code,
          peaksInYear: existing.peaksInYear,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting my bags entry:", error);

    // Log failure
    try {
      const userId = await getCurrentUserId();
      await logUserAction(
        EventType.USER_BAG_DELETE,
        EventStatus.FAILURE,
        request.headers,
        userId,
        {
          errorMessage: "Failed to delete bag entry",
        }
      );
    } catch (logError) {
      console.error("Failed to log action:", logError);
    }

    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
