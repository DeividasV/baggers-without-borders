const prisma = require("../shared/prisma-client");

async function main() {
  console.log("🌱 Seeding HOF Entries...");

  try {
    // Get all users, HOFs, and years from 2019-2025
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    });

    const hofs = await prisma.hallOfFame.findMany({
      orderBy: { displayOrder: "asc" },
    });

    const years = await prisma.year.findMany({
      where: {
        code: {
          in: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    if (users.length === 0) {
      console.log("❌ No users found. Please run user seed first.");
      process.exit(1);
    }

    if (hofs.length === 0) {
      console.log("❌ No HOFs found. Please run HOF seed first.");
      process.exit(1);
    }

    if (years.length === 0) {
      console.log("❌ No years found. Please run year seed first.");
      process.exit(1);
    }

    console.log(
      `Found ${users.length} users, ${hofs.length} HOFs, ${years.length} years (2019-2025)`
    );

    // Delete existing entries for 2019-2025 years only
    const deleted = await prisma.hofEntry.deleteMany({
      where: {
        year: {
          code: {
            in: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
          },
        },
      },
    });
    console.log(
      `🗑️  Deleted ${deleted.count} existing HOF entries for 2019-2025`
    );

    // Target TOTALS across all 7 years (2019-2025):
    // P100: most 100-2000, high performers up to 5000
    // P300: most 100-1000, high performers up to 3000
    // P500: most 75-500, high performers up to 1000
    // P600: most 50-300, high performers up to 600
    // P1000: most 30-100, high performers up to 300
    // P1500: most 20-70, high performers up to 200
    // P2000: most 10-40, high performers up to 100
    // P-INDEX: most 100-400, high performers up to 1000
    // P-TOP100: most 5-30, high performers up to 100

    const entriesToCreate = [];

    users.forEach((user, userIndex) => {
      // Determine if this user is a high performer (20% of users)
      const isHighPerformer = userIndex % 5 === 0;

      // Generate target TOTALS for this user for each HOF
      const userHofTotals = {};

      hofs.forEach((hof) => {
        let minTotal, maxTotal;

        switch (hof.code) {
          case "P100":
            [minTotal, maxTotal] = isHighPerformer ? [2000, 5000] : [100, 2000];
            break;
          case "P300":
            [minTotal, maxTotal] = isHighPerformer ? [1000, 3000] : [100, 1000];
            break;
          case "P500":
            [minTotal, maxTotal] = isHighPerformer ? [500, 1000] : [75, 500];
            break;
          case "P600":
            [minTotal, maxTotal] = isHighPerformer ? [300, 600] : [50, 300];
            break;
          case "P1000":
            [minTotal, maxTotal] = isHighPerformer ? [100, 300] : [30, 100];
            break;
          case "P1500":
            [minTotal, maxTotal] = isHighPerformer ? [70, 200] : [20, 70];
            break;
          case "P2000":
            [minTotal, maxTotal] = isHighPerformer ? [40, 100] : [10, 40];
            break;
          case "P-INDEX":
            [minTotal, maxTotal] = isHighPerformer ? [400, 1000] : [100, 400];
            break;
          case "P-TOP100":
            [minTotal, maxTotal] = isHighPerformer ? [30, 100] : [5, 30];
            break;
          default:
            [minTotal, maxTotal] = [50, 200];
        }

        userHofTotals[hof.code] = Math.floor(
          minTotal + Math.random() * (maxTotal - minTotal)
        );
      });

      // Enforce hierarchy: P100 >= P300 >= P500 >= ... >= P-TOP100
      for (let i = 1; i < hofs.length; i++) {
        const lowerHof = hofs[i - 1].code;
        const higherHof = hofs[i].code;

        if (userHofTotals[higherHof] > userHofTotals[lowerHof]) {
          // Make higher category 50-90% of lower category
          userHofTotals[higherHof] = Math.floor(
            userHofTotals[lowerHof] * (0.5 + Math.random() * 0.4)
          );
        }
      }

      // Now distribute each total across the 7 years
      const cumulativeTotals = {};
      hofs.forEach((hof) => {
        cumulativeTotals[hof.id] = 0;
      });

      years.forEach((year, yearIndex) => {
        hofs.forEach((hof) => {
          const totalTarget = userHofTotals[hof.code];
          const remainingYears = years.length - yearIndex;
          const alreadyAllocated = cumulativeTotals[hof.id];
          const remaining = totalTarget - alreadyAllocated;

          // Distribute remaining peaks across remaining years with variation
          let peaksThisYear;
          if (remainingYears === 1) {
            // Last year - allocate all remaining
            peaksThisYear = remaining;
          } else {
            // Allocate a portion with random variation
            const avgPerRemainingYear = remaining / remainingYears;
            const variation = 0.5 + Math.random(); // 0.5 to 1.5
            peaksThisYear = Math.floor(avgPerRemainingYear * variation);
          }

          peaksThisYear = Math.max(0, peaksThisYear);

          // Update cumulative
          cumulativeTotals[hof.id] += peaksThisYear;

          // Foreign peaks: 0 to peaksInYear
          const foreignPeaks = Math.floor(Math.random() * (peaksThisYear + 1));

          entriesToCreate.push({
            memberId: user.id,
            hofId: hof.id,
            yearId: year.id,
            peaksInYear: peaksThisYear,
            totalPeaks: cumulativeTotals[hof.id],
            foreignPeaks,
          });
        });
      });
    });

    console.log(`📝 Creating ${entriesToCreate.length} entries...`);

    // Create entries
    let created = 0;
    for (const entry of entriesToCreate) {
      try {
        await prisma.hofEntry.create({
          data: entry,
        });
        created++;
      } catch (error) {
        // Skip if combination already exists
        if (error.code === "P2002") {
          console.log(
            `⚠️  Skipped duplicate entry for member ${entry.memberId}, HOF ${entry.hofId}, year ${entry.yearId}`
          );
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ Created ${created} HOF entries`);

    // Show summary
    const totalEntries = await prisma.hofEntry.count();
    console.log(`\n📊 Total HOF entries in database: ${totalEntries}`);

    const entriesWithDetails = await prisma.hofEntry.findMany({
      take: 5,
      include: {
        member: { select: { displayName: true, username: true } },
        hof: { select: { code: true, title: true } },
        year: { select: { code: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("\n📝 Sample entries:");
    entriesWithDetails.forEach((entry) => {
      console.log(
        `  • ${entry.member.displayName} (@${entry.member.username}) - ${entry.hof.code} (${entry.year.code}): ${entry.peaksInYear} peaks this year, ${entry.totalPeaks} total`
      );
    });
  } catch (error) {
    console.error("❌ Error seeding HOF entries:", error);
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
