import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

// GET /api/hofs/[id] - Get a single hall of fame
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const hof = await prisma.hallOfFame.findUnique({
      where: { id },
    });

    if (!hof) {
      return NextResponse.json(
        { error: "Hall of Fame not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(hof);
  } catch (error) {
    console.error("Error fetching hall of fame:", error);
    return NextResponse.json(
      { error: "Failed to fetch hall of fame" },
      { status: 500 },
    );
  }
}

// Zod validation schema for HOF update
const hofUpdateSchema = z.object({
  code: z.string().min(1, "Code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().optional(),
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

// PUT /api/hofs/[id] - Update a hall of fame
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const body = await request.json();

    // Validate input with Zod
    const validationResult = hofUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validatedData = validationResult.data;
    const {
      code,
      title,
      description,
      isActive,
      displayOrder,
      allowManualEntry,
      progressRegisterExcludeRetired,
      progressRegisterExcludeDeceased,
      progressRegisterExcludeInactive,
      progressRegisterInactivityYears,
    } = validatedData;

    // Check if hall of fame exists
    const existing = await prisma.hallOfFame.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Hall of Fame not found" },
        { status: 404 },
      );
    }

    // Check if code is being changed and if it's already taken by another hall of fame
    if (code !== existing.code) {
      const codeExists = await prisma.hallOfFame.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "Code already exists" },
          { status: 400 },
        );
      }
    }

    const hof = await prisma.hallOfFame.update({
      where: { id },
      data: {
        code,
        title,
        description,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
        allowManualEntry: allowManualEntry ?? true,
        progressRegisterExcludeRetired:
          progressRegisterExcludeRetired ??
          existing.progressRegisterExcludeRetired ??
          true,
        progressRegisterExcludeDeceased:
          progressRegisterExcludeDeceased ??
          existing.progressRegisterExcludeDeceased ??
          true,
        progressRegisterExcludeInactive:
          progressRegisterExcludeInactive ??
          existing.progressRegisterExcludeInactive ??
          true,
        progressRegisterInactivityYears:
          progressRegisterInactivityYears ??
          existing.progressRegisterInactivityYears ??
          2,
      },
    });

    // Log HoF update
    await logAdminAction(
      EventType.ADMIN_HOF_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "HoF",
        resourceId: id,
        actionDetails: {
          code: hof.code,
          title: hof.title,
        },
      },
    );

    return NextResponse.json(hof);
  } catch (error) {
    console.error("Error updating hall of fame:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_HOF_UPDATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "HoF",
          errorMessage: (error as Error).message,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to update hall of fame" },
      { status: 500 },
    );
  }
}

// DELETE /api/hofs/[id] - Delete a hall of fame
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    // Check if hall of fame exists
    const existing = await prisma.hallOfFame.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Hall of Fame not found" },
        { status: 404 },
      );
    }

    // Check if any configurations exist for this HoF
    const configCount = await prisma.hofYearConfig.count({
      where: { hofId: id },
    });

    if (configCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete Hall of Fame: ${configCount} ${configCount === 1 ? "configuration" : "configurations"} exist for "${existing.title}". Delete all configurations first.`,
        },
        { status: 400 },
      );
    }

    // Check if any member data (HoF entries) exists for this HoF
    const memberDataCount = await prisma.hofEntry.count({
      where: { hofId: id },
    });

    if (memberDataCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete Hall of Fame: ${memberDataCount} member ${memberDataCount === 1 ? "entry" : "entries"} exist for "${existing.title}". Delete all member data first.`,
        },
        { status: 400 },
      );
    }

    await prisma.hallOfFame.delete({
      where: { id },
    });

    // Log HoF deletion
    await logAdminAction(
      EventType.ADMIN_HOF_DELETE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "HoF",
        resourceId: id,
        actionDetails: {
          code: existing.code,
          title: existing.title,
        },
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hall of fame:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_HOF_DELETE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "HoF",
          errorMessage: (error as Error).message,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete hall of fame" },
      { status: 500 },
    );
  }
}
