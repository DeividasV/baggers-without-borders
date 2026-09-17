import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

/**
 * GET /api/users/[id]/participations
 * Retrieves user's HOF and Year participation settings
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Get user's HOF participations
    const hofParticipations = await prisma.userHofParticipation.findMany({
      where: { userId: id },
      include: {
        hof: {
          select: {
            id: true,
            code: true,
            title: true,
            isActive: true,
            displayOrder: true,
          },
        },
      },
      orderBy: {
        hof: { displayOrder: "asc" },
      },
    });

    // Get user's Year participations
    const yearParticipations = await prisma.userYearParticipation.findMany({
      where: { userId: id },
      include: {
        year: {
          select: {
            id: true,
            code: true,
            title: true,
            isActive: true,
            displayOrder: true,
          },
        },
        country: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        year: { displayOrder: "asc" },
      },
    });

    return NextResponse.json({
      hofParticipations,
      yearParticipations,
    });
  } catch (error) {
    console.error("Error fetching user participations:", error);
    return NextResponse.json(
      { error: "Failed to fetch participations" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]/participations
 * Updates user's HOF and Year participation settings
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { hofParticipations, yearParticipations } = body;

    // Update HOF participations
    if (hofParticipations && Array.isArray(hofParticipations)) {
      for (const participation of hofParticipations) {
        await prisma.userHofParticipation.upsert({
          where: {
            userId_hofId: {
              userId: id,
              hofId: participation.hofId,
            },
          },
          create: {
            userId: id,
            hofId: participation.hofId,
            enabled: participation.enabled,
          },
          update: {
            enabled: participation.enabled,
          },
        });
      }
    }

    // Update Year participations
    if (yearParticipations && Array.isArray(yearParticipations)) {
      for (const participation of yearParticipations) {
        await prisma.userYearParticipation.upsert({
          where: {
            userId_yearId: {
              userId: id,
              yearId: participation.yearId,
            },
          },
          create: {
            userId: id,
            yearId: participation.yearId,
            enabled: participation.enabled,
            dataNotProvided: participation.dataNotProvided || false,
            countryId: participation.countryId || null,
          },
          update: {
            enabled: participation.enabled,
            dataNotProvided: participation.dataNotProvided || false,
            countryId: participation.countryId || null,
          },
        });
      }
    }

    // Fetch updated participations
    const [updatedHofParticipations, updatedYearParticipations] =
      await Promise.all([
        prisma.userHofParticipation.findMany({
          where: { userId: id },
          include: {
            hof: {
              select: {
                id: true,
                code: true,
                title: true,
                isActive: true,
                displayOrder: true,
              },
            },
          },
          orderBy: {
            hof: { displayOrder: "asc" },
          },
        }),
        prisma.userYearParticipation.findMany({
          where: { userId: id },
          include: {
            year: {
              select: {
                id: true,
                code: true,
                title: true,
                isActive: true,
                displayOrder: true,
              },
            },
            country: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
          orderBy: {
            year: { displayOrder: "asc" },
          },
        }),
      ]);

    return NextResponse.json({
      hofParticipations: updatedHofParticipations,
      yearParticipations: updatedYearParticipations,
    });
  } catch (error) {
    console.error("Error updating user participations:", error);
    return NextResponse.json(
      { error: "Failed to update participations" },
      { status: 500 }
    );
  }
}
