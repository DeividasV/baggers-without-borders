/**
 * Seed HofYearConfig - Creates default configurations for all HoF + Year combinations
 *
 * This script generates a configuration entry for each active Hall of Fame and Year combination.
 *
 * Run with: node prisma/seed-hof-year-configs.js
 */

const prisma = require("../shared/prisma-client");

async function seedHofYearConfigs() {
  console.log("🔧 Seeding HoF Year Configurations...");

  try {
    // Fetch all active HoFs
    const hofs = await prisma.hallOfFame.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    // Fetch all active Years
    const years = await prisma.year.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    console.log(
      `Found ${hofs.length} active HoFs and ${years.length} active Years`
    );

    let created = 0;
    let skipped = 0;
    let updated = 0;

    // Define minimum peaks per HOF
    const minPeaksByHof = {
      P100: 1200,
      P300: 350,
      P500: 150,
      P600: 120,
      P1000: 50,
      P1500: 30,
      P2000: 20,
      "P-TOP100": 10,
      "P-INDEX": 2, // Default for P-INDEX if not specified
    };

    // Create configs for all combinations
    for (const hof of hofs) {
      const minPeaks = minPeaksByHof[hof.code] || 2;

      for (const year of years) {
        // Check if config already exists
        const existing = await prisma.hofYearConfig.findUnique({
          where: {
            hofId_yearId: {
              hofId: hof.id,
              yearId: year.id,
            },
          },
        });

        if (existing) {
          // Update existing config with new minPeaks
          await prisma.hofYearConfig.update({
            where: {
              hofId_yearId: {
                hofId: hof.id,
                yearId: year.id,
              },
            },
            data: {
              minPeaks: minPeaks,
            },
          });
          console.log(
            `  🔄 Updated config: ${hof.code} - ${year.code} (minPeaks: ${minPeaks})`
          );
          updated++;
          continue;
        }

        // Create new config with defaults from HoF
        await prisma.hofYearConfig.create({
          data: {
            hofId: hof.id,
            yearId: year.id,
            minPeaks: minPeaks,
            minForeignPeaks: 2,
            minFpr: 10, // Minimum 10% Foreign Peak Ratio
            notes: `Default configuration for ${hof.title} in ${year.title}`,
          },
        });

        console.log(
          `  ✅ Created config: ${hof.code} - ${year.code} (minPeaks: ${minPeaks})`
        );
        created++;
      }
    }

    console.log(
      `\n✨ HofYearConfig seeding complete! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`
    );
  } catch (error) {
    console.error("❌ Error seeding HofYearConfigs:", error);
    throw error;
  }
}

async function main() {
  try {
    await seedHofYearConfigs();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { seedHofYearConfigs };
