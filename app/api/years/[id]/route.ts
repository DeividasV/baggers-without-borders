import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

// GET /api/years/[id] - Get a single year
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const year = await prisma.year.findUnique({
      where: { id },
    });

    if (!year) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    return NextResponse.json(year);
  } catch (error) {
    console.error("Error fetching year:", error);
    return NextResponse.json(
      { error: "Failed to fetch year" },
      { status: 500 },
    );
  }
}

// PUT /api/years/[id] - Update a year
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const body = await request.json();
    const {
      code,
      title,
      description,
      isActive,
      displayOrder,
      allowManualEntry,
    } = body;

    // Validation
    if (!code || !title) {
      return NextResponse.json(
        { error: "Code and title are required" },
        { status: 400 },
      );
    }

    // Check if year exists
    const existing = await prisma.year.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    // Check if code is being changed and if it's already taken by another year
    if (code !== existing.code) {
      const codeExists = await prisma.year.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "Code already exists" },
          { status: 400 },
        );
      }
    }

    const year = await prisma.year.update({
      where: { id },
      data: {
        code,
        title,
        description,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
        allowManualEntry: allowManualEntry ?? true,
      },
    });

    // Log year update
    await logAdminAction(
      EventType.ADMIN_YEAR_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "Year",
        resourceId: id,
        actionDetails: {
          code: year.code,
          title: year.title,
        },
      },
    );

    return NextResponse.json(year);
  } catch (error) {
    console.error("Error updating year:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_YEAR_UPDATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Year",
          errorMessage: (error as Error).message,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to update year" },
      { status: 500 },
    );
  }
}

// DELETE /api/years/[id] - Delete a year
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    // Check if year exists
    const existing = await prisma.year.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    // Check if any configurations exist for this year
    const configCount = await prisma.hofYearConfig.count({
      where: { yearId: id },
    });

    if (configCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete Year: ${configCount} ${configCount === 1 ? "configuration" : "configurations"} exist for "${existing.title}". Delete all configurations first.`,
        },
        { status: 400 },
      );
    }

    // Check if any member data exists for this year
    const memberDataCount = await prisma.hofEntry.count({
      where: { yearId: id },
    });

    if (memberDataCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete Year: ${memberDataCount} member ${memberDataCount === 1 ? "entry" : "entries"} exist for "${existing.title}". Delete all member data first.`,
        },
        { status: 400 },
      );
    }

    await prisma.year.delete({
      where: { id },
    });

    // Log year deletion
    await logAdminAction(
      EventType.ADMIN_YEAR_DELETE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "Year",
        resourceId: id,
        actionDetails: {
          code: existing.code,
          title: existing.title,
        },
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting year:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_YEAR_DELETE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Year",
          errorMessage: (error as Error).message,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete year" },
      { status: 500 },
    );
  }
}
