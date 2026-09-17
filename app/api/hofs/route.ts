import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

// GET /api/hofs - Get all halls of fame (accessible by any authenticated user)
export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated (any role can read HoFs)

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("activeOnly") === "true";
    const limit = searchParams.get("limit");

    const where = activeOnly ? { isActive: true } : {};

    const hofs = await prisma.hallOfFame.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      ...(limit && { take: parseInt(limit) }),
    });

    return NextResponse.json(hofs);
  } catch (error) {
    console.error("Error fetching halls of fame:", error);
    return NextResponse.json(
      { error: "Failed to fetch halls of fame" },
      { status: 500 }
    );
  }
}

// Zod validation schema for HOF creation
const hofCreateSchema = z.object({
  code: z.string({ message: "Code is required" }).min(1, "Code is required"),
  title: z.string({ message: "Title is required" }).min(1, "Title is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  allowManualEntry: z.boolean().optional(),
  progressRegisterExcludeRetired: z.boolean().optional(),
  progressRegisterExcludeDeceased: z.boolean().optional(),
  progressRegisterExcludeInactive: z.boolean().optional(),
  progressRegisterInactivityYears: z
    .number()
    .int()
    .min(1, "Inactivity years must be at least 1")
    .max(10, "Inactivity years cannot exceed 10")
    .optional(),
});

// POST /api/hofs - Create a new hall of fame
export async function POST(request: NextRequest) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const body = await request.json();

    // Validate input with Zod
    const validationResult = hofCreateSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      // Format the first error message to be more user-friendly
      let firstError = errors[0]?.message || "Validation failed";

      // Replace Zod's default undefined message with our required message
      if (firstError.includes("expected string, received undefined")) {
        const field = errors[0]?.path[0];
        firstError = `${
          field
            ? field.toString().charAt(0).toUpperCase() +
              field.toString().slice(1)
            : "Field"
        } is required`;
      }

      return NextResponse.json(
        {
          error: firstError,
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const {
      code,
      title,
      description,
      isActive,
      allowManualEntry,
      progressRegisterExcludeRetired,
      progressRegisterExcludeDeceased,
      progressRegisterExcludeInactive,
      progressRegisterInactivityYears,
    } = validatedData;

    // Check if code already exists
    const existing = await prisma.hallOfFame.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A hall of fame with this code already exists" },
        { status: 400 }
      );
    }

    // Get the highest display order
    const maxOrder = await prisma.hallOfFame.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });

    const displayOrder = (maxOrder?.displayOrder ?? -1) + 1;

    const hof = await prisma.hallOfFame.create({
      data: {
        code,
        title,
        description,
        isActive: isActive ?? true,
        allowManualEntry: allowManualEntry ?? true,
        progressRegisterExcludeRetired: progressRegisterExcludeRetired ?? true,
        progressRegisterExcludeDeceased:
          progressRegisterExcludeDeceased ?? true,
        progressRegisterExcludeInactive:
          progressRegisterExcludeInactive ?? true,
        progressRegisterInactivityYears: progressRegisterInactivityYears ?? 2,
        displayOrder,
      },
    });

    // Create HOF participation records for all existing users
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    if (users.length > 0) {
      await prisma.userHofParticipation.createMany({
        data: users.map((user) => ({
          userId: user.id,
          hofId: hof.id,
          enabled: true,
        })),
      });
    }
    // Log HoF creation
    await logAdminAction(
      EventType.ADMIN_HOF_CREATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "HoF",
        resourceId: hof.id,
        actionDetails: {
          code: hof.code,
          title: hof.title,
        },
      }
    );
    return NextResponse.json(hof, { status: 201 });
  } catch (error) {
    console.error("Error creating hall of fame:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_HOF_CREATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "HoF",
          errorMessage: (error as Error).message,
        }
      );
    }

    return NextResponse.json(
      { error: "Failed to create hall of fame" },
      { status: 500 }
    );
  }
}
