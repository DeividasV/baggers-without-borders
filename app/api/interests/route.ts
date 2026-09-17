import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

// GET /api/interests - List all interests
// Middleware ensures user is authenticated
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // For regular users, only return active interests without counts
    // For admins, return all interests with user counts
    const isAdmin = session.user.role === "ADMIN";

    const interests = await prisma.interest.findMany({
      where: isAdmin ? {} : { isActive: true },
      include: isAdmin
        ? {
            _count: {
              select: {
                userInterests: true,
              },
            },
          }
        : undefined,
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(interests);
  } catch (error) {
    console.error("Error fetching interests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/interests - Create new interest
// Middleware ensures user is admin
export async function POST(request: NextRequest) {
  try {
    await getSession(); // Verify session exists

    const body = await request.json();
    const { name, description, displayOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if interest with this name already exists
    const existing = await prisma.interest.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An interest with this name already exists" },
        { status: 409 }
      );
    }

    const interest = await prisma.interest.create({
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

    return NextResponse.json(interest, { status: 201 });
  } catch (error) {
    console.error("Error creating interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
