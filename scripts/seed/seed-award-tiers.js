/**
 * Seed Award Tiers - Creates default award tier configurations
 *
 * This script creates award tier systems for all existing HofYearConfigs.
 * Each tier has a name and peak range. Colors are determined by the tier name.
 *
 * Valid tier names: Bronze, Silver, Gold, Emerald, Sapphire, Diamond
 *
 * Run with: node prisma/seed-award-tiers.js
 */

const prisma = require("../shared/prisma-client");

// Default 6-tier award system (fallback)
const DEFAULT_TIERS = [
  { name: "Bronze", minPeaks: 0, maxPeaks: 50, displayOrder: 1 },
  { name: "Silver", minPeaks: 51, maxPeaks: 100, displayOrder: 2 },
  { name: "Gold", minPeaks: 101, maxPeaks: 300, displayOrder: 3 },
  { name: "Emerald", minPeaks: 301, maxPeaks: 500, displayOrder: 4 },
  { name: "Sapphire", minPeaks: 501, maxPeaks: 700, displayOrder: 5 },
  { name: "Diamond", minPeaks: 701, maxPeaks: null, displayOrder: 6 },
];

// HoF-specific tier templates derived from the images you provided.
// Keys are normalized hof.code values (uppercased). If a HoF code is not
// found here we fall back to DEFAULT_TIERS.
const HOF_TEMPLATES = {
  // P30 - Lowest prominence threshold
  P30: [
    { name: "Bronze", minPeaks: 5000, maxPeaks: 9999, displayOrder: 1 },
    { name: "Silver", minPeaks: 10000, maxPeaks: 19999, displayOrder: 2 },
    { name: "Gold", minPeaks: 20000, maxPeaks: 29999, displayOrder: 3 },
    { name: "Emerald", minPeaks: 30000, maxPeaks: 39999, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 40000, maxPeaks: 49999, displayOrder: 5 },
    { name: "Diamond", minPeaks: 50000, maxPeaks: null, displayOrder: 6 },
  ],

  // 1st image -> P100
  P100: [
    { name: "Bronze", minPeaks: 2000, maxPeaks: 3499, displayOrder: 1 },
    { name: "Silver", minPeaks: 3500, maxPeaks: 5999, displayOrder: 2 },
    { name: "Gold", minPeaks: 6000, maxPeaks: 8999, displayOrder: 3 },
    { name: "Emerald", minPeaks: 9000, maxPeaks: 12999, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 13000, maxPeaks: 17999, displayOrder: 5 },
    { name: "Diamond", minPeaks: 18000, maxPeaks: null, displayOrder: 6 },
  ],

  // 2nd image -> P300
  P300: [
    { name: "Bronze", minPeaks: 700, maxPeaks: 1299, displayOrder: 1 },
    { name: "Silver", minPeaks: 1300, maxPeaks: 1999, displayOrder: 2 },
    { name: "Gold", minPeaks: 2000, maxPeaks: 2999, displayOrder: 3 },
    { name: "Emerald", minPeaks: 3000, maxPeaks: 3999, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 4000, maxPeaks: 5499, displayOrder: 5 },
    { name: "Diamond", minPeaks: 5500, maxPeaks: null, displayOrder: 6 },
  ],

  // 3rd image -> P500
  P500: [
    { name: "Bronze", minPeaks: 350, maxPeaks: 749, displayOrder: 1 },
    { name: "Silver", minPeaks: 750, maxPeaks: 1199, displayOrder: 2 },
    { name: "Gold", minPeaks: 1200, maxPeaks: 1999, displayOrder: 3 },
    { name: "Emerald", minPeaks: 2000, maxPeaks: 2999, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 3000, maxPeaks: 3999, displayOrder: 5 },
    { name: "Diamond", minPeaks: 4000, maxPeaks: null, displayOrder: 6 },
  ],

  // 4th image -> P600
  P600: [
    { name: "Bronze", minPeaks: 300, maxPeaks: 599, displayOrder: 1 },
    { name: "Silver", minPeaks: 600, maxPeaks: 999, displayOrder: 2 },
    { name: "Gold", minPeaks: 1000, maxPeaks: 1799, displayOrder: 3 },
    { name: "Emerald", minPeaks: 1800, maxPeaks: 2499, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 2500, maxPeaks: 3499, displayOrder: 5 },
    { name: "Diamond", minPeaks: 3500, maxPeaks: null, displayOrder: 6 },
  ],

  // 5th image -> P1000 (expanded to 6 tiers)
  P1000: [
    { name: "Bronze", minPeaks: 150, maxPeaks: 299, displayOrder: 1 },
    { name: "Silver", minPeaks: 300, maxPeaks: 499, displayOrder: 2 },
    { name: "Gold", minPeaks: 500, maxPeaks: 999, displayOrder: 3 },
    { name: "Emerald", minPeaks: 1000, maxPeaks: 1499, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 1500, maxPeaks: 1999, displayOrder: 5 },
    { name: "Diamond", minPeaks: 2000, maxPeaks: null, displayOrder: 6 },
  ],

  // 6th image -> P1500 (expanded to 6 tiers)
  P1500: [
    { name: "Bronze", minPeaks: 75, maxPeaks: 149, displayOrder: 1 },
    { name: "Silver", minPeaks: 150, maxPeaks: 299, displayOrder: 2 },
    { name: "Gold", minPeaks: 300, maxPeaks: 399, displayOrder: 3 },
    { name: "Emerald", minPeaks: 400, maxPeaks: 499, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 500, maxPeaks: 699, displayOrder: 5 },
    { name: "Diamond", minPeaks: 700, maxPeaks: null, displayOrder: 6 },
  ],

  // 7th image -> P2000 (expanded to 6 tiers)
  P2000: [
    { name: "Bronze", minPeaks: 30, maxPeaks: 59, displayOrder: 1 },
    { name: "Silver", minPeaks: 60, maxPeaks: 99, displayOrder: 2 },
    { name: "Gold", minPeaks: 100, maxPeaks: 149, displayOrder: 3 },
    { name: "Emerald", minPeaks: 150, maxPeaks: 179, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 180, maxPeaks: 249, displayOrder: 5 },
    { name: "Diamond", minPeaks: 250, maxPeaks: null, displayOrder: 6 },
  ],

  // 8th image -> P-TOP100 (expanded to 6 tiers)
  "P-TOP100": [
    { name: "Bronze", minPeaks: 20, maxPeaks: 34, displayOrder: 1 },
    { name: "Silver", minPeaks: 35, maxPeaks: 49, displayOrder: 2 },
    { name: "Gold", minPeaks: 50, maxPeaks: 59, displayOrder: 3 },
    { name: "Emerald", minPeaks: 60, maxPeaks: 69, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 70, maxPeaks: 74, displayOrder: 5 },
    { name: "Diamond", minPeaks: 75, maxPeaks: null, displayOrder: 6 },
  ],

  // P-TOP50 (similar to TOP100 but with adjusted ranges)
  "P-TOP50": [
    { name: "Bronze", minPeaks: 10, maxPeaks: 14, displayOrder: 1 },
    { name: "Silver", minPeaks: 15, maxPeaks: 19, displayOrder: 2 },
    { name: "Gold", minPeaks: 20, maxPeaks: 24, displayOrder: 3 },
    { name: "Emerald", minPeaks: 25, maxPeaks: 29, displayOrder: 4 },
    { name: "Sapphire", minPeaks: 30, maxPeaks: 34, displayOrder: 5 },
    { name: "Diamond", minPeaks: 35, maxPeaks: null, displayOrder: 6 },
  ],
};

async function seedAwardTiers() {
  console.log("🏆 Seeding Award Tiers...\n");

  try {
    // Get all HofYearConfigs
    const configs = await prisma.hofYearConfig.findMany({
      include: {
        hof: {
          select: { code: true },
        },
        year: {
          select: { code: true },
        },
      },
    });

    console.log(`Found ${configs.length} HofYearConfig entries\n`);

    let created = 0;
    let skipped = 0;

    for (const config of configs) {
      // Check if this config already has award tiers
      const existingTiers = await prisma.awardTier.findMany({
        where: { hofYearConfigId: config.id },
      });

      if (existingTiers.length > 0) {
        console.log(
          `  ⏭️  ${config.hof.code}-${config.year.code}: Already has ${existingTiers.length} tiers`
        );
        skipped++;
        continue;
      }

      // Choose template for this HoF (try exact code, then sanitized code, then default)
      const rawCode = (config.hof.code || "").toUpperCase();
      const sanitized = rawCode.replace(/[^A-Z0-9]/g, "");
      const template =
        HOF_TEMPLATES[rawCode] || HOF_TEMPLATES[sanitized] || DEFAULT_TIERS;

      // Create tiers for this config
      for (const tier of template) {
        await prisma.awardTier.create({
          data: {
            hofYearConfigId: config.id,
            name: tier.name,
            minPeaks: tier.minPeaks,
            maxPeaks: tier.maxPeaks,
            displayOrder: tier.displayOrder,
          },
        });
      }

      console.log(
        `  ✅ ${config.hof.code}-${config.year.code}: Created ${template.length} tiers`
      );
      created++;
    }

    console.log(
      `\n✨ Award tier seeding complete!\n   Configs with new tiers: ${created}\n   Configs skipped: ${skipped}`
    );
  } catch (error) {
    console.error("❌ Error seeding award tiers:", error);
    throw error;
  }
}

async function main() {
  try {
    await seedAwardTiers();
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

module.exports = { seedAwardTiers };
