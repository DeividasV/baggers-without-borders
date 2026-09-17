import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

/**
 * GET /api/award-tiers
 * Retrieves award tiers grouped by HOF for a specific year OR by Year for a specific HOF OR for a specific config
 * Query params: yearId OR hofId OR configId (one required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearId = searchParams.get("yearId");
    const hofId = searchParams.get("hofId");
    const configId = searchParams.get("configId");

    if (!yearId && !hofId && !configId) {
      return NextResponse.json(
        { error: "Either yearId, hofId, or configId is required" },
        { status: 400 }
      );
    }

    if (configId) {
      // Get award tiers for a specific config
      const tiers = await prisma.awardTier.findMany({
        where: { hofYearConfigId: configId },
        orderBy: { displayOrder: "asc" },
      });

      return NextResponse.json(tiers);
    } else if (yearId) {
      // Get all HofYearConfigs for this year with their award tiers
      const configs = await prisma.hofYearConfig.findMany({
        where: { yearId },
        include: {
          hof: {
            select: {
              code: true,
              title: true,
              displayOrder: true,
            },
          },
          awardTiers: {
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: {
          hof: {
            displayOrder: "asc",
          },
        },
      });

      // Group by HOF
      const grouped = configs.map((config) => ({
        hofCode: config.hof.code,
        hofTitle: config.hof.title,
        configId: config.id,
        tiers: config.awardTiers,
      }));

      return NextResponse.json(grouped);
    } else if (hofId) {
      // Get all HofYearConfigs for this HOF with their award tiers
      const configs = await prisma.hofYearConfig.findMany({
        where: { hofId },
        include: {
          year: {
            select: {
              code: true,
              title: true,
              displayOrder: true,
            },
          },
          awardTiers: {
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: {
          year: {
            displayOrder: "asc",
          },
        },
      });

      // Group by Year
      const grouped = configs.map((config) => ({
        yearCode: config.year.code,
        yearTitle: config.year.title,
        configId: config.id,
        tiers: config.awardTiers,
      }));

      return NextResponse.json(grouped);
    }
  } catch (error) {
    console.error("Error fetching award tiers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
