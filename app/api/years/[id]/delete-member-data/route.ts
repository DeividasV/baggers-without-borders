import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/api-auth";
import { logEvent } from "@/src/lib/auditLog";
import { EventType, EventCategory, EventStatus } from "@prisma/client";

// POST /api/years/[id]/delete-member-data - Delete all member data for a year
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify year exists
    const year = await prisma.year.findUnique({
      where: { id },
      select: { id: true, code: true, title: true },
    });

    if (!year) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    // Delete member data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete HofEntry records (member achievement data)
      const deletedHofEntries = await tx.hofEntry.deleteMany({
        where: { yearId: id },
      });

      // Delete UserYearParticipation records (member participation data)
      const deletedYearParticipations =
        await tx.userYearParticipation.deleteMany({
          where: { yearId: id },
        });

      return {
        hofEntries: deletedHofEntries.count,
        userYearParticipations: deletedYearParticipations.count,
      };
    });

    // Log admin action
    await logEvent({
      eventType: EventType.ADMIN_YEAR_UPDATE,
      eventCategory: EventCategory.ADMIN,
      status: EventStatus.SUCCESS,
      userId: session.user.id,
      headers: request.headers,
      resourceType: "Year",
      resourceId: id,
      actionDetails: {
        action: "delete_member_data",
        yearCode: year.code,
        yearTitle: year.title,
        deletedHofEntries: result.hofEntries,
        deletedYearParticipations: result.userYearParticipations,
      },
    });

    return NextResponse.json({
      deleted: result,
      message: `Deleted ${result.hofEntries} HoF entries and ${result.userYearParticipations} year participations for ${year.title}`,
    });
  } catch (error) {
    console.error("Error deleting member data:", error);

    // Log failure
    if (session?.user?.id) {
      await logEvent({
        eventType: EventType.ADMIN_YEAR_UPDATE,
        eventCategory: EventCategory.ADMIN,
        status: EventStatus.FAILURE,
        userId: session.user.id,
        headers: request.headers,
        resourceType: "Year",
        resourceId: (await params).id,
        errorMessage: (error as Error).message,
      });
    }

    return NextResponse.json(
      { error: "Failed to delete member data" },
      { status: 500 },
    );
  }
}
