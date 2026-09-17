const prisma = require("../shared/prisma-client");

/**
 * Seed the hofs table with prominence-based mountain halls of fame
 * These halls of fame represent different prominence thresholds for peak bagging achievements
 */
async function seedHallOfFames() {
  console.log("🏔️  Seeding halls of fame...");

  const hofs = [
    {
      code: "P30",
      title: "P30m Table",
      description: "Peaks with prominence of 30 meters or more",
      isActive: true,
      displayOrder: -1,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P100",
      title: "P100m Table",
      description: "Peaks with prominence of 100 meters or more",
      isActive: true,
      displayOrder: 0,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P300",
      title: "P300m Table",
      description: "Peaks with prominence of 300 meters or more",
      isActive: true,
      displayOrder: 1,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P500",
      title: "P500m Table",
      description: "Peaks with prominence of 500 meters or more",
      isActive: true,
      displayOrder: 2,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P600",
      title: "P600m Table",
      description: "Peaks with prominence of 600 meters or more",
      isActive: true,
      displayOrder: 3,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P1000",
      title: "P1000m Table",
      description: "Peaks with prominence of 1000 meters or more",
      isActive: true,
      displayOrder: 4,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P1500",
      title: "P1500m Table",
      description: "Peaks with prominence of 1500 meters or more",
      isActive: true,
      displayOrder: 5,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P2000",
      title: "P2000m Table",
      description: "Peaks with prominence of 2000 meters or more",
      isActive: true,
      displayOrder: 6,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P-INDEX",
      title: "P-Index League",
      description: "Prominence Index achievement table",
      isActive: true,
      displayOrder: 7,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P-TOP50",
      title: "P-Top 50 Table",
      description: "Top 50 peaks by prominence",
      isActive: true,
      displayOrder: 8,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
    {
      code: "P-TOP100",
      title: "P-Top 100 Table",
      description: "Top 100 peaks by prominence",
      isActive: true,
      displayOrder: 9,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
  ];

  let created = 0;
  let updated = 0;

  for (const hof of hofs) {
    const existing = await prisma.hallOfFame.findUnique({
      where: { code: hof.code },
    });

    if (existing) {
      await prisma.hallOfFame.update({
        where: { code: hof.code },
        data: hof,
      });
      updated++;
      console.log(`   ✓ Updated hall of fame: ${hof.code}`);
    } else {
      await prisma.hallOfFame.create({
        data: hof,
      });
      created++;
      console.log(`   ✓ Created hall of fame: ${hof.code}`);
    }
  }

  console.log(
    `✅ Halls of fame seeded: ${created} created, ${updated} updated`
  );
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedHallOfFames()
    .catch((e) => {
      console.error("Error seeding halls of fame:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedHallOfFames };
