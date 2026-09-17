import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

// GET /api/hof-entries - Get all HOF entries with pagination and filters
export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const memberId = searchParams.get("memberId") || undefined;
    const hofId = searchParams.get("hofId") || undefined;
    const yearId = searchParams.get("yearId") || undefined;
    const sortBy = searchParams.get("sortBy") || "member.displayName";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as
      | "asc"
      | "desc";

    // Build where clause for filtering
    const where: any = {};
    if (memberId && memberId !== "ALL") where.memberId = memberId;
    if (hofId && hofId !== "ALL") where.hofId = hofId;
    if (yearId && yearId !== "ALL") where.yearId = yearId;

    // Get total count for pagination
    const totalCount = await prisma.hofEntry.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // Build dynamic orderBy based on sortBy parameter
    let orderBy: any[] = [];

    switch (sortBy) {
      case "member.displayName":
        orderBy = [
          { member: { displayName: sortOrder } },
          { year: { displayOrder: "desc" } },
          { hof: { displayOrder: "asc" } },
        ];
        break;
      case "hof.code":
        orderBy = [
          { hof: { code: sortOrder } },
          { year: { displayOrder: "desc" } },
          { member: { displayName: "asc" } },
        ];
        break;
      case "year.code":
        orderBy = [
          { year: { code: sortOrder } },
          { hof: { displayOrder: "asc" } },
          { member: { displayName: "asc" } },
        ];
        break;
      case "peaksInYear":
        orderBy = [
          { peaksInYear: sortOrder },
          { member: { displayName: "asc" } },
        ];
        break;
      case "foreignPeaksInYear":
        orderBy = [
          { foreignPeaksInYear: sortOrder },
          { member: { displayName: "asc" } },
        ];
        break;
      case "totalPeaks":
        orderBy = [
          { totalPeaks: sortOrder },
          { member: { displayName: "asc" } },
        ];
        break;
      case "foreignPeaks":
        orderBy = [
          { foreignPeaks: sortOrder },
          { member: { displayName: "asc" } },
        ];
        break;
      default:
        orderBy = [
          { year: { displayOrder: "desc" } },
          { hof: { displayOrder: "asc" } },
          { member: { displayName: "asc" } },
        ];
    }

    // Fetch paginated entries
    const entries = await prisma.hofEntry.findMany({
      where,
      skip,
      take: limit,
      include: {
        member: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
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
      orderBy,
    });

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching HOF entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch HOF entries" },
      { status: 500 }
    );
  }
}

// POST /api/hof-entries - Create a new HOF entry
export async function POST(request: NextRequest) {
  const session = await getSession();

  try {
    // Middleware ensures user is authenticated and is ADMIN

    const body = await request.json();
    const {
      memberId,
      hofId,
      yearId,
      totalPeaks,
      peaksInYear,
      foreignPeaksInYear,
    } = body;

    // Validation
    if (!memberId || !hofId || !yearId) {
      return NextResponse.json(
        { error: "Member, HOF, and Year are required" },
        { status: 400 }
      );
    }

    // Check if HOF is active
    const hof = await prisma.hallOfFame.findUnique({
      where: { id: hofId },
      select: { isActive: true },
    });

    if (!hof) {
      return NextResponse.json(
        { error: "Hall of Fame not found" },
        { status: 404 }
      );
    }

    if (!hof.isActive) {
      return NextResponse.json(
        { error: "Cannot create entries for inactive Hall of Fame" },
        { status: 400 }
      );
    }

    // Check if Year is active
    const year = await prisma.year.findUnique({
      where: { id: yearId },
      select: { isActive: true },
    });

    if (!year) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    if (!year.isActive) {
      return NextResponse.json(
        { error: "Cannot create entries for inactive Year" },
        { status: 400 }
      );
    }

    // Check if entry already exists
    const existing = await prisma.hofEntry.findUnique({
      where: {
        memberId_hofId_yearId: {
          memberId,
          hofId,
          yearId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "An entry for this member, HOF, and year combination already exists",
        },
        { status: 400 }
      );
    }

    const hofEntry = await prisma.hofEntry.create({
      data: {
        memberId,
        hofId,
        yearId,
        totalPeaks: totalPeaks ?? 0,
        peaksInYear: peaksInYear ?? 0,
        foreignPeaks: 0, // Will be calculated by recalculateTotalsForUserAndHof
        foreignPeaksInYear: foreignPeaksInYear ?? 0,
      },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
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
    });

    // Recalculate totals for all years after creating a new entry
    await recalculateTotalsForUserAndHof(memberId, hofId);

    // Fetch the updated entry with recalculated totalPeaks
    const updatedEntry = await prisma.hofEntry.findUnique({
      where: { id: hofEntry.id },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
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
    });

    // Log HOF entry creation
    await logAdminAction(
      EventType.ADMIN_DATA_ENTRY_CREATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "HofEntry",
        resourceId: hofEntry.id,
        actionDetails: {
          memberId,
          memberName: updatedEntry?.member.displayName,
          hofId,
          hofCode: updatedEntry?.hof.code,
          yearId,
          yearCode: updatedEntry?.year.code,
          peaksInYear,
          foreignPeaksInYear,
        },
      }
    );

    return NextResponse.json(updatedEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating HOF entry:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_DATA_ENTRY_CREATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "HofEntry",
          errorMessage: (error as Error).message,
        }
      );
    }

    return NextResponse.json(
      { error: "Failed to create HOF entry" },
      { status: 500 }
    );
  }
}
