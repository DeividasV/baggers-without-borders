import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

// GET /api/years - Get all years
export async function GET(request: NextRequest) {
  try {
    // Session-level read: middleware only role-checks writes to this family,
    // because member screens (contact form, funding bar) read the year list.

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where = activeOnly ? { isActive: true } : {};

    const years = await prisma.year.findMany({
      where,
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(years);
  } catch (error) {
    console.error("Error fetching years:", error);
    return NextResponse.json({ error: "Failed to fetch years" }, { status: 500 });
  }
}

// POST /api/years - Create a new year
export async function POST(request: NextRequest) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const body = await request.json();
    const { code, title, description, isActive, allowManualEntry } = body;

    // Validation
    if (!code || !title) {
      return NextResponse.json({ error: "Code and title are required" }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.year.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json({ error: "A year with this code already exists" }, { status: 400 });
    }

    // Get the highest display order
    const maxOrder = await prisma.year.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });

    const displayOrder = (maxOrder?.displayOrder ?? -1) + 1;

    const year = await prisma.year.create({
      data: {
        code,
        title,
        description,
        isActive: isActive ?? true,
        allowManualEntry: allowManualEntry ?? true,
        displayOrder,
      },
    });

    // Create Year participation records for all existing users
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    if (users.length > 0) {
      await prisma.userYearParticipation.createMany({
        data: users.map((user) => ({
          userId: user.id,
          yearId: year.id,
          enabled: true,
          countryId: null,
        })),
      });
    }

    // Log year creation
    await logAdminAction(
      EventType.ADMIN_YEAR_CREATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "Year",
        resourceId: year.id,
        actionDetails: {
          code: year.code,
          title: year.title,
        },
      }
    );

    return NextResponse.json(year, { status: 201 });
  } catch (error) {
    console.error("Error creating year:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_YEAR_CREATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Year",
          errorMessage: (error as Error).message,
        }
      );
    }

    return NextResponse.json({ error: "Failed to create year" }, { status: 500 });
  }
}
