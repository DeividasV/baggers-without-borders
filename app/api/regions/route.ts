import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("countryCode");

    if (!countryCode) {
      return NextResponse.json(
        { error: "Country code is required" },
        { status: 400 }
      );
    }

    // Find the country by code (2 or 3 letter code)
    const country = await prisma.country.findFirst({
      where: {
        OR: [{ code: countryCode }, { code3: countryCode }],
      },
      select: {
        id: true,
        hasRegions: true,
      },
    });

    if (!country) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    if (!country.hasRegions) {
      return NextResponse.json({ regions: [] });
    }

    const regions = await prisma.region.findMany({
      where: {
        countryId: country.id,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ regions });
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}
