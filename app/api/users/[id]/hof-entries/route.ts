import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

// GET /api/users/[id]/hof-entries - Get user's HOF entries count or list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const session = await getSession();
    const { id: userId } = await params;

    // Check if requesting count only
    const searchParams = request.nextUrl.searchParams;
    const countOnly = searchParams.get("count") === "true";

    if (countOnly) {
      // Return just the count
      const count = await prisma.hofEntry.count({
        where: { memberId: userId },
      });

      return NextResponse.json({ count });
    }

    // Otherwise return full entries (for future use)
    const entries = await prisma.hofEntry.findMany({
      where: { memberId: userId },
      include: {
        hof: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        year: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
      orderBy: [
        { year: { displayOrder: "desc" } },
        { hof: { displayOrder: "asc" } },
      ],
    });

    return NextResponse.json({ data: entries, total: entries.length });
  } catch (error) {
    console.error("Error fetching user HOF entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch HOF entries" },
      { status: 500 }
    );
  }
}
