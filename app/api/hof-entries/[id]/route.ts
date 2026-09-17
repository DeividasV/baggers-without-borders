import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

// GET /api/hof-entries/[id] - Get a specific HOF entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const hofEntry = await prisma.hofEntry.findUnique({
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

    if (!hofEntry) {
      return NextResponse.json(
        { error: "HOF entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(hofEntry);
  } catch (error) {
    console.error("Error fetching HOF entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch HOF entry" },
      { status: 500 }
    );
  }
}

// PUT /api/hof-entries/[id] - Update a HOF entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const body = await request.json();
    const {
      memberId,
      hofId,
      yearId,
      totalPeaks,
      peaksInYear,
      foreignPeaksInYear,
    } = body;

    // Validation
    if (!memberId || !hofId || !yearId) {
      return NextResponse.json(
        { error: "Member, HOF, and Year are required" },
        { status: 400 }
      );
    }

    // Check if entry exists
    const existing = await prisma.hofEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "HOF entry not found" },
        { status: 404 }
      );
    }

    // Check if the new combination already exists (excluding current entry)
    if (
      existing.memberId !== memberId ||
      existing.hofId !== hofId ||
      existing.yearId !== yearId
    ) {
      const duplicate = await prisma.hofEntry.findUnique({
        where: {
          memberId_hofId_yearId: {
            memberId,
            hofId,
            yearId,
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          {
            error:
              "An entry for this member, HOF, and year combination already exists",
          },
          { status: 400 }
        );
      }
    }

    const hofEntry = await prisma.hofEntry.update({
      where: { id },
      data: {
        memberId,
        hofId,
        yearId,
        totalPeaks: totalPeaks ?? 0,
        peaksInYear: peaksInYear ?? 0,
        foreignPeaks: 0, // Will be calculated by recalculateTotalsForUserAndHof
        foreignPeaksInYear: foreignPeaksInYear ?? 0,
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
          },
        },
      },
    });

    // Recalculate totals for all years after updating peaksInYear or foreignPeaksInYear
    await recalculateTotalsForUserAndHof(memberId, hofId);

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

    // Log HOF entry update
    await logAdminAction(
      EventType.ADMIN_DATA_ENTRY_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "HofEntry",
        resourceId: id,
        actionDetails: {
          memberId,
          memberName: updatedEntry?.member.displayName,
          hofId,
          hofCode: updatedEntry?.hof.code,
          yearId,
          yearCode: updatedEntry?.year.code,
          peaksInYear,
          foreignPeaksInYear,
        },
      }
    );

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error updating HOF entry:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_DATA_ENTRY_UPDATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "HofEntry",
          errorMessage: (error as Error).message,
        }
      );
    }

    return NextResponse.json(
      { error: "Failed to update HOF entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/hof-entries/[id] - Delete a HOF entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const existing = await prisma.hofEntry.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            displayName: true,
          },
        },
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
      return NextResponse.json(
        { error: "HOF entry not found" },
        { status: 404 }
      );
    }

    await prisma.hofEntry.delete({
      where: { id },
    });

    // Log HOF entry deletion
    await logAdminAction(
      EventType.ADMIN_DATA_ENTRY_DELETE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "HofEntry",
        resourceId: id,
        actionDetails: {
          memberName: existing.member.displayName,
          hofCode: existing.hof.code,
          yearCode: existing.year.code,
          peaksInYear: existing.peaksInYear,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting HOF entry:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_DATA_ENTRY_DELETE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "HofEntry",
          errorMessage: (error as Error).message,
        }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete HOF entry" },
      { status: 500 }
    );
  }
}
