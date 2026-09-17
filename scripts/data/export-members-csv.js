#!/usr/bin/env node

/**
 * Export Members to CSV
 *
 * Extracts member ID, given name, family name, and peakbagger ID (externalId)
 * from the database and exports to CSV file.
 *
 * Usage: node scripts/export-members-csv.js [output-file.csv]
 */

const fs = require("fs");
const path = require("path");
const prisma = require("../shared/prisma-client");

async function exportMembersToCSV() {
  try {
    console.log("🔍 Fetching members from database...");

    // Fetch all users with relevant fields
    const members = await prisma.user.findMany({
      select: {
        id: true,
        givenName: true,
        familyName: true,
        peakbaggerId: true,
      },
      orderBy: [{ familyName: "asc" }, { givenName: "asc" }],
    });

    console.log(`✅ Found ${members.length} members`);

    // Generate CSV content
    const headers = ["Given Name", "Family Name", "Peakbagger ID"];
    const csvRows = [headers.join(",")];

    for (const member of members) {
      const row = [
        escapeCsvField(member.givenName || ""),
        escapeCsvField(member.familyName || ""),
        member.peakbaggerId || "",
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");

    // Determine output file path
    const outputFile =
      process.argv[2] || path.join(__dirname, "../data/members-export.csv");
    const resolvedPath = path.resolve(outputFile);

    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write CSV file
    fs.writeFileSync(resolvedPath, csvContent, "utf8");

    console.log(`\n✅ Export complete!`);
    console.log(`📄 File saved to: ${resolvedPath}`);
    console.log(`📊 Total records: ${members.length}`);
  } catch (error) {
    console.error("❌ Error exporting members:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Escape CSV field values containing commas, quotes, or newlines
 */
function escapeCsvField(value) {
  if (!value) return "";

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

// Run the export
exportMembersToCSV();
