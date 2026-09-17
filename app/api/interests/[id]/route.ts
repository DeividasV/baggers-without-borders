import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// GET /api/interests/[id] - Get single interest (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const interest = await prisma.interest.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            userInterests: true,
          },
        },
      },
    });

    if (!interest) {
      return NextResponse.json(
        { error: "Interest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(interest);
  } catch (error) {
    console.error("Error fetching interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/interests/[id] - Update interest (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    const body = await request.json();
    const { name, description, displayOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if interest exists
    const existing = await prisma.interest.findUnique({
      where: { id: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Interest not found" },
        { status: 404 }
      );
    }

    // Check if another interest with this name exists
    const duplicate = await prisma.interest.findFirst({
      where: {
        name,
        NOT: { id: id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "An interest with this name already exists" },
        { status: 409 }
      );
    }

    const interest = await prisma.interest.update({
      where: { id: id },
      data: {
        name,
        description: description || null,
        displayOrder: displayOrder ?? 0,
        isActive: isActive ?? true,
      },
      include: {
        _count: {
          select: {
            userInterests: true,
          },
        },
      },
    });

    return NextResponse.json(interest);
  } catch (error) {
    console.error("Error updating interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/interests/[id] - Delete interest (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const { id } = await params;

    // Check if interest exists
    const interest = await prisma.interest.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            userInterests: true,
          },
        },
      },
    });

    if (!interest) {
      return NextResponse.json(
        { error: "Interest not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if interest is in use
    if (interest._count.userInterests > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete interest. It is currently assigned to ${interest._count.userInterests} user(s).`,
        },
        { status: 409 }
      );
    }

    await prisma.interest.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
