import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

interface Country {
  id: string;
  code: string;
  code3: string;
  name: string;
  nativeName: string | null;
  numericCode: string | null;
  continent: string;
  currency: string | null;
  languages: string | null;
  hasRegions: boolean;
}

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        code: true,
        code3: true,
        name: true,
        nativeName: true,
        numericCode: true,
        continent: true,
        currency: true,
        languages: true,
        hasRegions: true,
      },
      orderBy: [{ continent: "asc" }, { name: "asc" }],
    });

    // Group countries by continent
    const grouped = countries.reduce(
      (acc: Record<string, Country[]>, country: Country) => {
        if (!acc[country.continent]) {
          acc[country.continent] = [];
        }
        acc[country.continent].push(country);
        return acc;
      },
      {} as Record<string, Country[]>
    );

    return NextResponse.json({
      countries,
      grouped,
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}
