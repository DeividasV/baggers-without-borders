import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated
    const session = await getSession();
    const { id: userId } = await params;

    // Only allow admins or the user themselves to view this info
    if (session.user.role !== "ADMIN" && session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch HoF Meister assignments
    const assignments = await prisma.hofYearConfig.findMany({
      where: { hofmeisterId: userId },
      include: {
        hof: { select: { title: true, code: true } },
        year: { select: { title: true, code: true } },
      },
      orderBy: [{ year: { code: "desc" } }, { hof: { code: "asc" } }],
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching HoF Meister assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch HoF Meister assignments" },
      { status: 500 }
    );
  }
}
