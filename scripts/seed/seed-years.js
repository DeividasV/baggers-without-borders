const prisma = require("../shared/prisma-client");

/**
 * Seed the years table with Hall of Fame table periods
 * These years represent different years for Hall of Fame table periods (2019-2025)
 */
async function seedYears() {
  console.log("📅 Seeding years...");

  const years = [
    {
      code: "2019",
      title: "2019",
      description: "Hall of Fame period for 2019",
      isActive: true,
      displayOrder: 0,
    },
    {
      code: "2020",
      title: "2020",
      description: "Hall of Fame period for 2020",
      isActive: true,
      displayOrder: 1,
    },
    {
      code: "2021",
      title: "2021",
      description: "Hall of Fame period for 2021",
      isActive: true,
      displayOrder: 2,
    },
    {
      code: "2022",
      title: "2022",
      description: "Hall of Fame period for 2022",
      isActive: true,
      displayOrder: 3,
    },
    {
      code: "2023",
      title: "2023",
      description: "Hall of Fame period for 2023",
      isActive: true,
      displayOrder: 4,
    },
    {
      code: "2024",
      title: "2024",
      description: "Hall of Fame period for 2024",
      isActive: true,
      displayOrder: 5,
    },
    {
      code: "2025",
      title: "2025",
      description: "Hall of Fame period for 2025",
      isActive: true,
      displayOrder: 6,
    },
  ];

  let created = 0;
  let updated = 0;

  for (const year of years) {
    const existing = await prisma.year.findUnique({
      where: { code: year.code },
    });

    if (existing) {
      await prisma.year.update({
        where: { code: year.code },
        data: year,
      });
      updated++;
      console.log(`   ✓ Updated year: ${year.code} (${year.title})`);
    } else {
      await prisma.year.create({
        data: year,
      });
      created++;
      console.log(`   ✓ Created year: ${year.code} (${year.title})`);
    }
  }

  console.log(`✅ Years seeded: ${created} created, ${updated} updated`);
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedYears()
    .catch((e) => {
      console.error("Error seeding years:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedYears };
