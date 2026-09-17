import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

/**
 * GET /api/hof-year-configs/[id]
 * Retrieves a specific HoF Year configuration by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const config = await prisma.hofYearConfig.findUnique({
      where: { id },
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
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching HoF year config:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/hof-year-configs/[id]
 * Updates a specific HoF Year configuration
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
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
      meisterReportContent,
      meisterReportImageTitle,
      meisterReportImageAttribution,
      lceEnabled,
      lceMinFpr,
      lceMinPeaks,
      lceMinForeignPeaks,
      lceCountryIds,
    } = body;
    const { id } = await context.params;

    // Check if config exists
    const existing = await prisma.hofYearConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    // Update config
    const config = await prisma.hofYearConfig.update({
      where: { id },
      data: {
        hofmeisterId:
          hofmeisterId !== undefined ? hofmeisterId : existing.hofmeisterId,
        minPeaks: minPeaks !== undefined ? minPeaks : existing.minPeaks,
        minPeaksEnabled:
          minPeaksEnabled !== undefined
            ? minPeaksEnabled
            : existing.minPeaksEnabled,
        minForeignPeaks:
          minForeignPeaks !== undefined
            ? minForeignPeaks
            : existing.minForeignPeaks,
        minForeignPeaksEnabled:
          minForeignPeaksEnabled !== undefined
            ? minForeignPeaksEnabled
            : existing.minForeignPeaksEnabled,
        minFpr: minFpr !== undefined ? minFpr : existing.minFpr,
        minFprEnabled:
          minFprEnabled !== undefined ? minFprEnabled : existing.minFprEnabled,
        minimumAge: minimumAge !== undefined ? minimumAge : existing.minimumAge,
        minimumAgeEnabled:
          minimumAgeEnabled !== undefined
            ? minimumAgeEnabled
            : existing.minimumAgeEnabled,
        notes: notes !== undefined ? notes : existing.notes,
        meisterReportContent:
          meisterReportContent !== undefined
            ? meisterReportContent
            : existing.meisterReportContent,
        meisterReportImageTitle:
          meisterReportImageTitle !== undefined
            ? meisterReportImageTitle
            : existing.meisterReportImageTitle,
        meisterReportImageAttribution:
          meisterReportImageAttribution !== undefined
            ? meisterReportImageAttribution
            : existing.meisterReportImageAttribution,
        lceEnabled: lceEnabled !== undefined ? lceEnabled : existing.lceEnabled,
        lceMinFpr: lceMinFpr !== undefined ? lceMinFpr : existing.lceMinFpr,
        lceMinPeaks:
          lceMinPeaks !== undefined ? lceMinPeaks : existing.lceMinPeaks,
        lceMinForeignPeaks:
          lceMinForeignPeaks !== undefined
            ? lceMinForeignPeaks
            : existing.lceMinForeignPeaks,
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

    // Update LCE country mappings
    // Always delete existing mappings if lceCountryIds is provided or if LCE is disabled
    if (lceCountryIds !== undefined || lceEnabled === false) {
      // Delete existing mappings
      await prisma.countryLceConfig.deleteMany({
        where: { hofYearConfigId: id },
      });

      // Only create new mappings if LCE is enabled and countries are provided
      if (
        lceEnabled !== false &&
        Array.isArray(lceCountryIds) &&
        lceCountryIds.length > 0
      ) {
        await prisma.countryLceConfig.createMany({
          data: lceCountryIds.map((countryId: string) => ({
            hofYearConfigId: id,
            countryId,
            hasLce: true,
          })),
        });
      }
    }

    // Fetch updated config with relations
    const updatedConfig = await prisma.hofYearConfig.findUnique({
      where: { id },
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
      },
    });

    // Log HOF year config update
    await logAdminAction(
      EventType.ADMIN_HOF_YEAR_CONFIG_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "HofYearConfig",
        resourceId: id,
        actionDetails: {
          hofId: updatedConfig?.hofId,
          yearId: updatedConfig?.yearId,
        },
      },
    );

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error("Error updating HoF year config:", error);

    // Log failure
    const session = await getServerSession(authOptions);
    if (session) {
      await logAdminAction(
        EventType.ADMIN_HOF_YEAR_CONFIG_UPDATE,
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
      { error: "Failed to update configuration" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/hof-year-configs/[id]
 * Deletes a specific HoF Year configuration
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if config exists
    const existing = await prisma.hofYearConfig.findUnique({
      where: { id },
      include: {
        hof: true,
        year: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    // Check if any member data (HoF entries) exists for this configuration
    const memberDataCount = await prisma.hofEntry.count({
      where: {
        hofId: existing.hofId,
        yearId: existing.yearId,
      },
    });

    if (memberDataCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete configuration: ${memberDataCount} member ${memberDataCount === 1 ? "entry" : "entries"} exist for ${existing.hof.title} in ${existing.year.title}. Delete member data first.`,
        },
        { status: 400 },
      );
    }

    // Delete config
    await prisma.hofYearConfig.delete({
      where: { id },
    });

    // Log HOF year config deletion
    await logAdminAction(
      EventType.ADMIN_HOF_YEAR_CONFIG_DELETE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "HofYearConfig",
        resourceId: id,
        actionDetails: {
          hofId: existing.hofId,
          yearId: existing.yearId,
        },
      },
    );

    return NextResponse.json({ message: "Configuration deleted successfully" });
  } catch (error) {
    console.error("Error deleting HoF year config:", error);

    // Log failure
    const session = await getServerSession(authOptions);
    if (session) {
      await logAdminAction(
        EventType.ADMIN_HOF_YEAR_CONFIG_DELETE,
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
      { error: "Failed to delete configuration" },
      { status: 500 },
    );
  }
}
