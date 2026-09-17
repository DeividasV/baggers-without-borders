import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ENTRIES = 10000;

interface JsonEntry {
  year: number;
  cid: number;
  [hofCode: string]: number | [number | null, number | null];
}

interface ValidEntry {
  cid: number;
  memberName: string;
  memberId: string;
  hofCode: string;
  hofTitle: string;
  hofId: string;
  peaksInYear: number;
  foreignPeaksInYear: number;
  operation: "create" | "update";
  hasChanges: boolean;
  previousPeaksInYear: number | null;
  previousForeignPeaksInYear: number | null;
}

interface ErrorEntry {
  cid: number;
  hofCode?: string;
  error: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: yearId } = await params;

    // Get year details
    const year = await prisma.year.findUnique({
      where: { id: yearId },
    });

    if (!year) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    if (!year.isActive) {
      return NextResponse.json(
        { error: "Cannot upload data to inactive year" },
        { status: 400 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 },
      );
    }

    // Validate file type
    if (file.type !== "application/json") {
      return NextResponse.json(
        { error: "Invalid file type (JSON only)" },
        { status: 400 },
      );
    }

    // Read and parse JSON
    const text = await file.text();
    let jsonData: JsonEntry[];

    try {
      jsonData = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 },
      );
    }

    if (!Array.isArray(jsonData)) {
      return NextResponse.json(
        { error: "JSON must be an array of entries" },
        { status: 400 },
      );
    }

    if (jsonData.length > MAX_ENTRIES) {
      return NextResponse.json(
        { error: `Too many entries (max ${MAX_ENTRIES})` },
        { status: 400 },
      );
    }

    // Get all HOF codes
    const hofs = await prisma.hallOfFame.findMany({
      select: { id: true, code: true, title: true },
    });

    const hofMap = new Map(hofs.map((h) => [h.code, h]));

    const validEntries: ValidEntry[] = [];
    const errors: ErrorEntry[] = [];
    const seenKeys = new Set<string>();

    for (const entry of jsonData) {
      // Validate year match
      if (entry.year.toString() !== year.code) {
        errors.push({
          cid: entry.cid,
          error: `Year mismatch: expected ${year.code}, got ${entry.year}`,
        });
        continue;
      }

      // Look up user by peakbaggerId (cid)
      const user = await prisma.user.findFirst({
        where: { peakbaggerId: entry.cid.toString() },
        select: {
          id: true,
          displayName: true,
          givenName: true,
          familyName: true,
        },
      });

      if (!user) {
        errors.push({
          cid: entry.cid,
          error: `Member not found with CID ${entry.cid}`,
        });
        continue;
      }

      const memberName =
        user.displayName ||
        `${user.givenName || ""} ${user.familyName || ""}`.trim() ||
        "Unknown";

      // Process each HOF entry
      for (const [key, value] of Object.entries(entry)) {
        // Skip non-HOF fields
        if (key === "year" || key === "cid") continue;

        const hofCode = key;
        const hof = hofMap.get(hofCode);

        if (!hof) {
          errors.push({
            cid: entry.cid,
            hofCode,
            error: `Invalid HOF code: ${hofCode}`,
          });
          continue;
        }

        // Convert null values to zeros and handle both 1 and 2-element arrays
        let parsedValue: [number, number] | null = null;

        if (value === null) {
          parsedValue = [0, 0];
        } else if (Array.isArray(value)) {
          const arrayValue = value as unknown[];
          if (arrayValue.length === 0) {
            // Skip empty arrays
            continue;
          } else if (arrayValue.length === 1) {
            // Single element array: [totalPeaks] → [totalPeaks, 0]
            const val = arrayValue[0] as number | null;
            parsedValue = [val === null ? 0 : val, 0];
          } else if (arrayValue.length === 2) {
            // Two element array: [peaksInYear, foreignPeaksInYear]
            const val0 = arrayValue[0] as number | null;
            const val1 = arrayValue[1] as number | null;
            parsedValue = [val0 === null ? 0 : val0, val1 === null ? 0 : val1];
          } else {
            errors.push({
              cid: entry.cid,
              hofCode,
              error: `Invalid format for ${hofCode}: expected [peaksInYear, foreignPeaksInYear] or [totalPeaks]`,
            });
            continue;
          }
        } else {
          errors.push({
            cid: entry.cid,
            hofCode,
            error: `Invalid format for ${hofCode}: expected array`,
          });
          continue;
        }

        if (parsedValue === null) continue;

        const [peaksInYear, foreignPeaksInYear] = parsedValue;

        // Validate numeric values
        if (
          typeof peaksInYear !== "number" ||
          typeof foreignPeaksInYear !== "number" ||
          peaksInYear < 0 ||
          foreignPeaksInYear < 0
        ) {
          errors.push({
            cid: entry.cid,
            hofCode,
            error: `Invalid peak values for ${hofCode}: must be non-negative numbers`,
          });
          continue;
        }

        // Check for duplicates within file
        const duplicateKey = `${user.id}-${hof.id}-${yearId}`;
        if (seenKeys.has(duplicateKey)) {
          errors.push({
            cid: entry.cid,
            hofCode,
            error: `Duplicate entry: CID ${entry.cid} + ${hofCode} appears multiple times`,
          });
          continue;
        }
        seenKeys.add(duplicateKey);

        // Check if entry exists in database
        const existingEntry = await prisma.hofEntry.findUnique({
          where: {
            memberId_hofId_yearId: {
              memberId: user.id,
              hofId: hof.id,
              yearId: yearId,
            },
          },
        });

        // Check if values actually change for updates
        let hasChanges = true;
        let previousPeaksInYear: number | null = null;
        let previousForeignPeaksInYear: number | null = null;

        if (existingEntry) {
          hasChanges =
            existingEntry.peaksInYear !== peaksInYear ||
            existingEntry.foreignPeaksInYear !== foreignPeaksInYear;
          previousPeaksInYear = existingEntry.peaksInYear;
          previousForeignPeaksInYear = existingEntry.foreignPeaksInYear;
        }

        validEntries.push({
          cid: entry.cid,
          memberName,
          memberId: user.id,
          hofCode,
          hofTitle: hof.title,
          hofId: hof.id,
          peaksInYear,
          foreignPeaksInYear,
          operation: existingEntry ? "update" : "create",
          hasChanges,
          previousPeaksInYear,
          previousForeignPeaksInYear,
        });
      }
    }

    const createdCount = validEntries.filter(
      (e) => e.operation === "create",
    ).length;
    const updatedCount = validEntries.filter(
      (e) => e.operation === "update",
    ).length;
    const modifiedCount = validEntries.filter(
      (e) => e.operation === "update" && e.hasChanges,
    ).length;

    return NextResponse.json({
      valid: validEntries,
      errors,
      summary: {
        totalProcessed: jsonData.length,
        validCount: validEntries.length,
        created: createdCount,
        updated: updatedCount,
        modified: modifiedCount,
        skipped: 0, // Null entries are skipped silently
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate data" },
      { status: 500 },
    );
  }
}
