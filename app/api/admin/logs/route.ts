import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { EventType, EventStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Admin-only endpoint
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    // Filter by event type (can be multiple)
    const eventTypes = searchParams.getAll("eventType");
    if (eventTypes.length > 0) {
      where.eventType = { in: eventTypes as EventType[] };
    }

    // Filter by user ID
    const userId = searchParams.get("userId");
    if (userId) {
      if (userId === "anonymous") {
        // Special case: filter for null userId (anonymous users)
        where.userId = null;
      } else {
        where.userId = userId;
      }
    }

    // Filter by status
    const status = searchParams.get("status");
    if (status && ["SUCCESS", "FAILURE"].includes(status)) {
      where.status = status as EventStatus;
    }

    // Filter by country
    const country = searchParams.get("ipCountry");
    if (country) {
      where.ipCountry = country;
    }

    // Filter by date range
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const validSortFields = [
      "createdAt",
      "eventType",
      "status",
      "userId",
      "ipCountry",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    // Fetch logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortField]: sortOrder as "asc" | "desc",
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Calculate stats
    const [failedCount, uniqueUserCount, topCountries] = await Promise.all([
      // Count failed events
      prisma.auditLog.count({
        where: {
          ...where,
          status: EventStatus.FAILURE,
        },
      }),

      // Count unique users (using raw query for distinct count)
      prisma.auditLog
        .findMany({
          where: {
            ...where,
            userId: { not: null },
          },
          distinct: ["userId"],
          select: { userId: true },
        })
        .then((users) => users.length),

      // Get top 5 countries
      prisma.auditLog.groupBy({
        by: ["ipCountry"],
        where: {
          ...where,
          ipCountry: { not: null },
        },
        _count: {
          ipCountry: true,
        },
        orderBy: {
          _count: {
            ipCountry: "desc",
          },
        },
        take: 5,
      }),
    ]);

    // Get country names for top countries
    const countryNames = await prisma.country.findMany({
      where: {
        code: {
          in: topCountries
            .map((c) => c.ipCountry)
            .filter((code): code is string => code !== null),
        },
      },
      select: {
        code: true,
        name: true,
      },
    });

    const countryMap = new Map(countryNames.map((c) => [c.code, c.name]));

    // Get all users for filter dropdown
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
      },
      orderBy: {
        displayName: "asc",
      },
    });

    // Get all countries for filter dropdown
    const allCountries = await prisma.country.findMany({
      select: {
        code: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: logs,
      users: allUsers,
      countries: allCountries,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      stats: {
        total: totalCount,
        failed: failedCount,
        uniqueUsers: uniqueUserCount,
        topCountries: topCountries.map((c) => ({
          code: c.ipCountry,
          name: c.ipCountry
            ? countryMap.get(c.ipCountry) || c.ipCountry
            : "Unknown",
          count: c._count.ipCountry,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
