import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/src/lib/prisma";

// GET /api/consent-types/[id] - Get single consent type (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const consentType = await prisma.consentType.findUnique({
      where: { id: id },
      include: {
        attachments: true,
        _count: {
          select: {
            userConsents: true,
            attachments: true,
          },
        },
      },
    });

    if (!consentType) {
      return NextResponse.json(
        { error: "Consent type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(consentType);
  } catch (error) {
    console.error("Error fetching consent type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/consent-types/[id] - Update consent type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const body = await request.json();
    const { title, description, internalNotes, status, dateIntroduced } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["ACTIVE", "INACTIVE"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const consentType = await prisma.consentType.update({
      where: { id: id },
      data: {
        title,
        description,
        internalNotes: internalNotes || null,
        status,
        dateIntroduced: dateIntroduced ? new Date(dateIntroduced) : undefined,
      },
      include: {
        attachments: true,
        _count: {
          select: {
            attachments: true,
            userConsents: true,
          },
        },
      },
    });

    return NextResponse.json(consentType);
  } catch (error) {
    console.error("Error updating consent type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/consent-types/[id] - Delete consent type (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    // Check if consent type has any user consents
    const consentType = await prisma.consentType.findUnique({
      where: { id: id },
      include: {
        attachments: true,
        _count: {
          select: { userConsents: true },
        },
      },
    });

    if (!consentType) {
      return NextResponse.json(
        { error: "Consent type not found" },
        { status: 404 }
      );
    }

    if (consentType._count.userConsents > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete consent type with existing user consent records. Consider setting it to INACTIVE instead.",
        },
        { status: 400 }
      );
    }

    // Delete all associated attachments from filesystem
    for (const attachment of consentType.attachments) {
      try {
        const filePath = path.join(process.cwd(), "public", attachment.path);
        await fs.unlink(filePath);
      } catch (error) {
        console.error("Error deleting file:", error);
        // Continue even if file deletion fails
      }
    }

    // Delete consent type (this will cascade delete attachments due to schema)
    await prisma.consentType.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Consent type deleted successfully" });
  } catch (error) {
    console.error("Error deleting consent type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
