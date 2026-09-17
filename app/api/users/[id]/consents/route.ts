import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

// GET /api/users/[id]/consents - Get all consent records for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated
    const session = await getSession();
    const { id } = await params;

    // Users can only view their own consents unless they're admin
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userConsents = await prisma.userConsent.findMany({
      where: { userId: id },
      include: {
        consentType: true,
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ consents: userConsents });
  } catch (error) {
    console.error("Error fetching user consents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/consents - Create or update user consent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const { id } = await params;

    const body = await request.json();
    const { consentTypeId, dateGiven, consentMethod, note, isRequired } = body;

    if (!consentTypeId) {
      return NextResponse.json(
        { error: "Consent type ID is required" },
        { status: 400 }
      );
    }

    // Check if consent record already exists
    const existing = await prisma.userConsent.findUnique({
      where: {
        userId_consentTypeId: {
          userId: id,
          consentTypeId,
        },
      },
    });

    let userConsent;
    if (existing) {
      // Update existing
      userConsent = await prisma.userConsent.update({
        where: { id: existing.id },
        data: {
          dateGiven: dateGiven ? new Date(dateGiven) : undefined,
          consentMethod: consentMethod || null,
          note: note || null,
          isRequired:
            isRequired !== undefined ? isRequired : existing.isRequired,
        },
        include: {
          consentType: true,
          attachments: true,
        },
      });
    } else {
      // Create new
      userConsent = await prisma.userConsent.create({
        data: {
          userId: id,
          consentTypeId,
          dateGiven: dateGiven ? new Date(dateGiven) : null,
          consentMethod: consentMethod || null,
          note: note || null,
          isRequired: isRequired !== undefined ? isRequired : true,
        },
        include: {
          consentType: true,
          attachments: true,
        },
      });
    }

    return NextResponse.json(userConsent, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("Error creating/updating user consent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
