async function seedInterests(prisma) {
  console.log("🎯 Starting interests seed...");

  const interests = [
    {
      name: "Hiking",
      description: "Walking and trekking in natural environments",
      displayOrder: 1,
    },
    {
      name: "Rock Climbing",
      description: "Climbing and scrambling on rock faces",
      displayOrder: 2,
    },
    {
      name: "Mountaineering",
      description: "Alpine and mountain climbing activities",
      displayOrder: 3,
    },
    {
      name: "Wildlife",
      description: "Plants and wildlife observation and study",
      displayOrder: 4,
    },
    {
      name: "Photography",
      description: "Outdoor and nature photography",
      displayOrder: 5,
    },
    {
      name: "Expeditions",
      description: "Multi-day expeditions and adventures",
      displayOrder: 6,
    },
    {
      name: "Peak Lists",
      description: "Creating and maintaining peak lists",
      displayOrder: 7,
    },
    {
      name: "Skiing",
      description: "Skiing and winter sports",
      displayOrder: 8,
    },
    {
      name: "Writing",
      description: "Trip reports and outdoor writing",
      displayOrder: 9,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const interest of interests) {
    try {
      const existing = await prisma.interest.findUnique({
        where: { name: interest.name },
      });

      if (existing) {
        console.log(`   ⏭️  Skipping ${interest.name} (already exists)`);
        skipped++;
      } else {
        await prisma.interest.create({
          data: interest,
        });
        console.log(`   ✅ Created ${interest.name}`);
        created++;
      }
    } catch (error) {
      console.error(`   ❌ Error creating ${interest.name}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${interests.length}`);
}

module.exports = { seedInterests };

// Only run if this is the main module
if (require.main === module) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  async function main() {
    try {
      await seedInterests(prisma);
      console.log("\n✨ Interests seeding completed successfully!");
    } catch (error) {
      console.error("❌ Error during seeding:", error);
      throw error;
    }
  }

  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
