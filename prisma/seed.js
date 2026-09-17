const fs = require("fs");
const path = require("path");
// Shared client loads .env/.env.local itself, so `node prisma/seed.js` works on
// a clean clone without pre-exporting DATABASE_URL.
const prisma = require("../scripts/shared/prisma-client");
const { seedCountries } = require("../scripts/seed/seed-countries");
const { seedInterests } = require("../scripts/seed/seed-interests");
const { seedHallOfFames } = require("../scripts/seed/seed-hofs");
const { seedYears } = require("../scripts/seed/seed-years");
const { seedBaselineYear } = require("../scripts/seed/seed-baseline-year");
const { seedHofYearConfigs } = require("../scripts/seed/seed-hof-year-configs");
const { seedAwardTiers } = require("../scripts/seed/seed-award-tiers");
const { seedDemoUsers } = require("../scripts/seed/seed-demo-users");

async function seedCountriesAndRegions() {
  console.log("\n🌍 Seeding countries and regions...");

  const countriesDir = path.join(__dirname, "countries");
  const regionsDir = path.join(__dirname, "regions");

  // Get all country files
  const continentFiles = fs.readdirSync(countriesDir).filter((file) => file.endsWith(".json"));

  let totalCountries = 0;
  let totalRegions = 0;

  // First, import all countries
  console.log("📋 Importing countries...");
  for (const file of continentFiles) {
    const filePath = path.join(countriesDir, file);
    const countries = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const country of countries) {
      await prisma.country.upsert({
        where: { code: country.code },
        update: {
          code3: country.code3,
          name: country.name,
          nativeName: country.nativeName,
          numericCode: country.numericCode,
          capital: country.capital,
          continent: country.continent,
          currency: country.currency,
          languages: country.languages,
          hasRegions: country.hasRegions,
        },
        create: {
          code: country.code,
          code3: country.code3,
          name: country.name,
          nativeName: country.nativeName,
          numericCode: country.numericCode,
          capital: country.capital,
          continent: country.continent,
          currency: country.currency,
          languages: country.languages,
          hasRegions: country.hasRegions,
        },
      });
      totalCountries++;
    }
  }
  console.log(`✅ Imported ${totalCountries} countries`);

  // Then, import all regions
  console.log("🗺️  Importing regions...");
  const regionFiles = fs.readdirSync(regionsDir).filter((file) => file.endsWith(".json"));

  for (const file of regionFiles) {
    const countryCode = path.basename(file, ".json");
    const filePath = path.join(regionsDir, file);
    const regions = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Find the country by code
    const country = await prisma.country.findUnique({
      where: { code: countryCode },
    });

    if (!country) {
      console.warn(`⚠️  Country not found for regions file: ${file}`);
      continue;
    }

    for (const region of regions) {
      await prisma.region.upsert({
        where: {
          countryId_code: {
            countryId: country.id,
            code: region.code,
          },
        },
        update: {
          name: region.name,
          nativeName: region.nativeName,
          type: region.type,
        },
        create: {
          code: region.code,
          name: region.name,
          nativeName: region.nativeName,
          type: region.type,
          countryId: country.id,
        },
      });
      totalRegions++;
    }
  }
  console.log(`✅ Imported ${totalRegions} regions`);
  console.log(`   📊 Total: ${totalCountries} countries, ${totalRegions} regions\n`);
}

async function seedConsentTypes() {
  console.log("\n📜 Seeding consent types...");

  const consentTypes = [
    {
      title: "Privacy Policy",
      description:
        "Acceptance of the platform's Privacy Policy regarding data collection, storage, and usage",
      status: "ACTIVE",
      dateIntroduced: new Date("2026-01-11T00:00:00Z"),
    },
    {
      title: "Terms of Service",
      description: "Acceptance of the platform's Terms of Service governing use of the application",
      status: "ACTIVE",
      dateIntroduced: new Date("2026-01-11T00:00:00Z"),
    },
    {
      title: "PR Hall Consent",
      description: "Consent to include user in the PR Hall (Prominence Rankings Hall of Fame)",
      status: "ACTIVE",
      dateIntroduced: new Date("2025-10-21T00:00:00Z"),
    },
    {
      title: "P-Index Consent",
      description: "Consent to calculate and display user's P-Index (Prominence Index score)",
      status: "ACTIVE",
      dateIntroduced: new Date("2025-10-21T00:00:00Z"),
    },
    {
      title: "Info Retention Consent",
      description: "Consent to retain and store user information for platform functionality",
      status: "ACTIVE",
      dateIntroduced: new Date("2025-10-21T00:00:00Z"),
    },
    {
      title: "Publish Totals Consent",
      description: "Consent to publish user's climbing totals and statistics publicly",
      status: "ACTIVE",
      dateIntroduced: new Date("2025-10-25T00:00:00Z"),
    },
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const consent of consentTypes) {
    // Check if consent type already exists
    const existing = await prisma.consentType.findFirst({
      where: { title: consent.title },
    });

    if (!existing) {
      await prisma.consentType.create({
        data: consent,
      });
      createdCount++;
    } else {
      // Update existing consent type
      await prisma.consentType.update({
        where: { id: existing.id },
        data: {
          description: consent.description,
          status: consent.status,
          dateIntroduced: consent.dateIntroduced,
        },
      });
      updatedCount++;
    }
  }

  console.log(
    `✅ Created ${createdCount} new consent types, updated ${updatedCount} existing ones`
  );

  // Assign required legal consents to all existing users
  const legalConsentTypes = await prisma.consentType.findMany({
    where: {
      title: {
        in: ["Privacy Policy", "Terms of Service"],
      },
    },
  });

  if (legalConsentTypes.length > 0) {
    const existingUsers = await prisma.user.findMany({
      select: { id: true },
    });

    if (existingUsers.length > 0) {
      console.log(`   📋 Assigning legal consents to ${existingUsers.length} existing users...`);

      for (const user of existingUsers) {
        for (const consentType of legalConsentTypes) {
          // Check if consent already exists
          const existingConsent = await prisma.userConsent.findUnique({
            where: {
              userId_consentTypeId: {
                userId: user.id,
                consentTypeId: consentType.id,
              },
            },
          });

          if (!existingConsent) {
            await prisma.userConsent.create({
              data: {
                userId: user.id,
                consentTypeId: consentType.id,
                dateGiven: null, // Not accepted yet - will trigger consent prompt
                consentMethod: null,
                isRequired: true,
              },
            });
          }
        }
      }

      console.log(`   ✅ Assigned legal consents to existing users\n`);
    }
  }
}

async function main() {
  console.log("🌱 Seeding database with core data structures...");

  // Seed countries and regions first
  await seedCountriesAndRegions();

  // Seed consent types
  await seedConsentTypes();

  // Seed interests (independent reference data, shown on member profiles)
  // This was previously imported but never called, so a fresh database had an
  // empty Interest table and the profile interest selector had no options.
  await seedInterests(prisma);

  // Seed halls of fame
  await seedHallOfFames();

  // Seed years (including regular years)
  await seedYears();

  // Seed baseline year (for pre-2019 opening balances)
  await seedBaselineYear();

  // Seed HoF Year Configurations (default configs for all HoF+Year combinations)
  await seedHofYearConfigs();

  // Seed Award Tiers (tier systems for all HoF+Year combinations)
  await seedAwardTiers();

  // Seed synthetic demo users (skipped automatically when NODE_ENV=production)
  await seedDemoUsers();

  console.log("✅ Core data structures seeded successfully!");
  console.log("📋 Next steps:");
  console.log("  1. Log in with a demo account printed above, or register a new one.");
  console.log("  2. Optional dev data: npm run db:seed-users && npm run db:seed-hof-entries");
  console.log("  3. See SETUP.md for configuration and deployment.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
