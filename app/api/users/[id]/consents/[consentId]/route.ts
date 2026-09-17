import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

// GET /api/users/[userId]/consents/[consentId] - Get single consent record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consentId: string }> }
) {
  try {
    // Middleware ensures user is authenticated
    const session = await getSession();
    const { id, consentId } = await params;

    // Users can only view their own consents unless they're admin
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userConsent = await prisma.userConsent.findUnique({
      where: { id: consentId },
      include: {
        consentType: true,
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!userConsent || userConsent.userId !== id) {
      return NextResponse.json(
        { error: "Consent record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(userConsent);
  } catch (error) {
    console.error("Error fetching user consent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[userId]/consents/[consentId] - Update consent record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consentId: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const { id, consentId } = await params;

    const body = await request.json();
    const { dateGiven, consentMethod, note, isRequired } = body;

    const updateData: any = {};
    if (dateGiven !== undefined)
      updateData.dateGiven = dateGiven ? new Date(dateGiven) : null;
    if (consentMethod !== undefined) updateData.consentMethod = consentMethod;
    if (note !== undefined) updateData.note = note;
    if (isRequired !== undefined) updateData.isRequired = isRequired;

    const userConsent = await prisma.userConsent.update({
      where: { id: consentId },
      data: updateData,
      include: {
        consentType: true,
        attachments: true,
      },
    });

    return NextResponse.json(userConsent);
  } catch (error) {
    console.error("Error updating user consent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/consents/[consentId] - Delete consent record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consentId: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const { id, consentId } = await params;

    await prisma.userConsent.delete({
      where: { id: consentId },
    });

    return NextResponse.json({
      message: "Consent record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user consent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
