import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// POST /api/consent-types/[id]/assign - Assign consent type to users
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const { id } = await params;

    const body = await request.json();
    const {
      assignTo, // "all", "country", "specific"
      countryIds, // array of country IDs (for assignTo="country")
      userIds, // array of user IDs (for assignTo="specific")
      isRequired, // whether consent is required
    } = body;

    // Check if consent type exists
    const consentType = await prisma.consentType.findUnique({
      where: { id: id },
    });

    if (!consentType) {
      return NextResponse.json(
        { error: "Consent type not found" },
        { status: 404 }
      );
    }

    let usersToAssign: { id: string }[] = [];

    // Get users based on assignment criteria
    if (assignTo === "all") {
      usersToAssign = await prisma.user.findMany({
        where: {
          status: { in: ["NEW", "ACTIVE"] }, // Only assign to active/new users
        },
        select: { id: true },
      });
    } else if (assignTo === "country" && countryIds && countryIds.length > 0) {
      usersToAssign = await prisma.user.findMany({
        where: {
          status: { in: ["NEW", "ACTIVE"] },
          OR: [
            { birthCountryId: { in: countryIds } },
            { residenceCountryId: { in: countryIds } },
          ],
        },
        select: { id: true },
      });
    } else if (assignTo === "specific" && userIds && userIds.length > 0) {
      usersToAssign = await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: { id: true },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid assignment criteria" },
        { status: 400 }
      );
    }

    // Create consent records for users who don't already have them
    let assignedCount = 0;
    let skippedCount = 0;

    for (const user of usersToAssign) {
      try {
        // Check if consent already exists
        const existing = await prisma.userConsent.findUnique({
          where: {
            userId_consentTypeId: {
              userId: user.id,
              consentTypeId: id,
            },
          },
        });

        if (!existing) {
          await prisma.userConsent.create({
            data: {
              userId: user.id,
              consentTypeId: id,
              isRequired: isRequired !== undefined ? isRequired : true,
              dateGiven: null,
              consentMethod: null,
              note: null,
            },
          });
          assignedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error assigning consent to user ${user.id}:`, error);
        // Continue with other users
      }
    }

    return NextResponse.json({
      message: "Consent type assigned successfully",
      assignedCount,
      skippedCount,
      totalUsers: usersToAssign.length,
    });
  } catch (error) {
    console.error("Error assigning consent type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
