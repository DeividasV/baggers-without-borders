import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { logAuthEvent } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

/**
 * POST /api/users/accept-consents
 * Records user acceptance of required consents
 * Updates UserConsent.dateGiven and logs to audit trail
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Get all user's required consents that haven't been accepted
    // Only for the new legal consents (Privacy Policy and Terms of Service)
    const missingConsents = await prisma.userConsent.findMany({
      where: {
        userId,
        isRequired: true,
        dateGiven: null,
        consentType: {
          status: "ACTIVE",
          title: {
            in: ["Privacy Policy", "Terms of Service"],
          },
        },
      },
      include: {
        consentType: true,
      },
    });

    if (missingConsents.length === 0) {
      return NextResponse.json(
        { success: true, message: "No missing consents to accept" },
        { status: 200 }
      );
    }

    // Update all missing required consents
    const updatePromises = missingConsents.map((consent) =>
      prisma.userConsent.update({
        where: {
          id: consent.id,
        },
        data: {
          dateGiven: now,
          consentMethod: "web_prompt",
        },
      })
    );

    await Promise.all(updatePromises);

    const consentTypeIds = missingConsents.map((c) => c.consentTypeId);

    // Log to audit trail
    await logAuthEvent(
      EventType.USER_PROFILE_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      {
        userId,
        actionDetails: {
          action: "consent_accepted",
          consentTypeIds,
          method: "web_prompt",
          timestamp: now.toISOString(),
        },
      }
    );

    return NextResponse.json(
      { success: true, message: "Consents recorded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error accepting consents:", error);
    return NextResponse.json(
      { error: "Failed to record consent acceptance" },
      { status: 500 }
    );
  }
}
