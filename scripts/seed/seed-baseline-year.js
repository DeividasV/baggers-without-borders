const prisma = require("../shared/prisma-client");

/**
 * Seed the BASELINE year for opening balances
 * This year is used to record peaks climbed before the 2019 year
 */
async function seedBaselineYear() {
  console.log("🌱 Seeding BASELINE year...");

  try {
    // Create or update the BASELINE year
    const baselineYear = await prisma.year.upsert({
      where: { code: "BASELINE" },
      update: {
        title: "<2019",
        description: "Opening balance - peaks climbed before the 2019 year",
        isActive: true,
        displayOrder: -1,
        allowManualEntry: true,
      },
      create: {
        code: "BASELINE",
        title: "<2019",
        description: "Opening balance - peaks climbed before the 2019 year",
        isActive: true,
        displayOrder: -1,
        allowManualEntry: true,
      },
    });

    console.log(`✅ BASELINE year ${baselineYear.id ? "created/updated" : "exists"}`);
    console.log(`   Code: ${baselineYear.code}`);
    console.log(`   Title: ${baselineYear.title}`);
    console.log(`   Display Order: ${baselineYear.displayOrder}`);

    return baselineYear;
  } catch (error) {
    console.error("❌ Error seeding BASELINE year:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedBaselineYear()
    .then(() => {
      console.log("✅ BASELINE year seeding completed successfully");
    })
    .catch((error) => {
      console.error("❌ BASELINE year seeding failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedBaselineYear };
