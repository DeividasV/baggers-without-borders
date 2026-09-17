import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// GET /api/consent-types - List consent types (session read; writes are admin)
export async function GET(request: NextRequest) {
  try {
    // Session-level read: middleware only role-checks writes to this family,
    // because the member consents screen lists the types. The payload includes
    // each type's admin-only internal notes -- see FEATURES.md §9 item 39.

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where: any = {};
    if (statusFilter) {
      where.status = statusFilter;
    }

    const consentTypes = await prisma.consentType.findMany({
      where,
      include: {
        attachments: true,
        _count: {
          select: {
            attachments: true,
            userConsents: true,
          },
        },
      },
      orderBy: { dateIntroduced: "desc" },
    });

    return NextResponse.json({ consentTypes });
  } catch (error) {
    console.error("Error fetching consent types:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/consent-types - Create new consent type (admin only)
export async function POST(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const body = await request.json();
    const { title, description, internalNotes, status, dateIntroduced } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    // Validate status
    const validStatuses = ["ACTIVE", "INACTIVE"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const consentType = await prisma.consentType.create({
      data: {
        title,
        description,
        internalNotes: internalNotes || null,
        status: status || "ACTIVE",
        dateIntroduced: dateIntroduced ? new Date(dateIntroduced) : new Date(),
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

    return NextResponse.json(consentType, { status: 201 });
  } catch (error) {
    console.error("Error creating consent type:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
