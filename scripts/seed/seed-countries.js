// Seed script for countries
const prisma = require("../shared/prisma-client");

// Load countries from continent JSON files
const africa = require("../../prisma/countries/africa.json");
const asia = require("../../prisma/countries/asia.json");
const europe = require("../../prisma/countries/europe.json");
const northAmerica = require("../../prisma/countries/north-america.json");
const southAmerica = require("../../prisma/countries/south-america.json");
const oceania = require("../../prisma/countries/oceania.json");
const antarctica = require("../../prisma/countries/antarctica.json");

// Merge all continents into one array
const countries = [
  ...africa,
  ...asia,
  ...europe,
  ...northAmerica,
  ...southAmerica,
  ...oceania,
  ...antarctica,
];

async function seedCountries() {
  console.log("Seeding countries...");

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    });
  }

  console.log(`✅ Seeded ${countries.length} countries`);
  console.log(`   - Africa: ${africa.length}`);
  console.log(`   - Asia: ${asia.length}`);
  console.log(`   - Europe: ${europe.length}`);
  console.log(`   - North America: ${northAmerica.length}`);
  console.log(`   - South America: ${southAmerica.length}`);
  console.log(`   - Oceania: ${oceania.length}`);
  console.log(`   - Antarctica: ${antarctica.length}`);
}

seedCountries()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
