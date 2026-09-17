import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

/**
 * GET /api/hof-year-configs
 * Retrieves all HoF Year configurations with optional filtering
 * Query params: hofId, yearId
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only authenticated users can view configs
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hofId = searchParams.get("hofId");
    const yearId = searchParams.get("yearId");

    const where: any = {};
    if (hofId) where.hofId = hofId;
    if (yearId) where.yearId = yearId;

    const configs = await prisma.hofYearConfig.findMany({
      where,
      include: {
        hof: {
          select: {
            id: true,
            code: true,
            title: true,
            isActive: true,
            displayOrder: true,
          },
        },
        year: {
          select: {
            id: true,
            code: true,
            title: true,
            isActive: true,
            displayOrder: true,
          },
        },
        lceCountries: {
          include: {
            country: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        hofmeister: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
      },
      orderBy: [
        { hof: { displayOrder: "asc" } },
        { year: { displayOrder: "asc" } },
      ],
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error fetching HoF year configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch configurations" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/hof-year-configs
 * Creates a new HoF Year configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can create configs
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      hofId,
      yearId,
      hofmeisterId,
      minPeaks,
      minPeaksEnabled,
      minForeignPeaks,
      minForeignPeaksEnabled,
      minFpr,
      minFprEnabled,
      minimumAge,
      minimumAgeEnabled,
      notes,
      lceEnabled,
      lceMinFpr,
      lceMinPeaks,
      lceMinForeignPeaks,
      lceCountryIds,
    } = body;

    // Validate required fields
    if (!hofId || !yearId) {
      return NextResponse.json(
        { error: "HoF ID and Year ID are required" },
        { status: 400 },
      );
    }

    // Check if config already exists
    const existing = await prisma.hofYearConfig.findUnique({
      where: {
        hofId_yearId: {
          hofId,
          yearId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Configuration already exists for this HoF and Year combination",
        },
        { status: 400 },
      );
    }

    // Create new config
    const config = await prisma.hofYearConfig.create({
      data: {
        hofId,
        yearId,
        hofmeisterId: hofmeisterId || null,
        minPeaks: minPeaks || 0,
        minPeaksEnabled: minPeaksEnabled ?? true,
        minForeignPeaks: minForeignPeaks || 0,
        minForeignPeaksEnabled: minForeignPeaksEnabled ?? true,
        minFpr: minFpr || 0,
        minFprEnabled: minFprEnabled ?? true,
        minimumAge: minimumAge || 0,
        minimumAgeEnabled: minimumAgeEnabled ?? true,
        notes: notes || "",
        lceEnabled: lceEnabled || false,
        lceMinFpr: lceMinFpr || null,
        lceMinPeaks: lceMinPeaks || null,
        lceMinForeignPeaks: lceMinForeignPeaks || null,
      },
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
        lceCountries: {
          include: {
            country: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        hofmeister: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
      },
    });

    // Create LCE country mappings if provided
    if (
      lceEnabled &&
      lceCountryIds &&
      Array.isArray(lceCountryIds) &&
      lceCountryIds.length > 0
    ) {
      await prisma.countryLceConfig.createMany({
        data: lceCountryIds.map((countryId: string) => ({
          hofYearConfigId: config.id,
          countryId,
          hasLce: true,
        })),
      });
    }

    // Log HOF year config creation
    await logAdminAction(
      EventType.ADMIN_HOF_YEAR_CONFIG_CREATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "HofYearConfig",
        resourceId: config.id,
        actionDetails: {
          hofId: config.hofId,
          yearId: config.yearId,
        },
      },
    );

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("Error creating HoF year config:", error);

    // Log failure
    const session = await getServerSession(authOptions);
    if (session) {
      await logAdminAction(
        EventType.ADMIN_HOF_YEAR_CONFIG_CREATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "HofYearConfig",
          errorMessage: (error as Error).message,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to create configuration" },
      { status: 500 },
    );
  }
}
