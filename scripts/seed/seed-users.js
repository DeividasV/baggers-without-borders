const bcrypt = require("bcryptjs");
const prisma = require("../shared/prisma-client");

// Configuration
const USER_COUNT = 32;

// Sample data pools
const givenNames = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Barbara",
  "David",
  "Elizabeth",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Charles",
  "Karen",
  "Christopher",
  "Nancy",
  "Daniel",
  "Lisa",
  "Matthew",
  "Betty",
  "Anthony",
  "Margaret",
  "Mark",
  "Sandra",
  "Donald",
  "Ashley",
];

const familyNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Thompson",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
];

const genders = ["M", "F"];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBoolean() {
  return Math.random() > 0.5;
}

function generateUsername(givenName, familyName) {
  const patterns = [
    `${givenName.toLowerCase()}${familyName.toLowerCase()}`,
    `${givenName.toLowerCase()}.${familyName.toLowerCase()}`,
    `${givenName.toLowerCase()}${randomNumber(1, 999)}`,
    `${givenName.toLowerCase()}_${familyName.toLowerCase()}`,
    `${givenName.charAt(0).toLowerCase()}${familyName.toLowerCase()}`,
  ];
  return randomItem(patterns);
}

function generateEmail(givenName, familyName) {
  const emailProviders = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "protonmail.com"];
  return `${givenName.toLowerCase()}.${familyName.toLowerCase()}@${randomItem(emailProviders)}`;
}

async function main() {
  console.log(`🌱 Seeding ${USER_COUNT} random users...`);

  // Fetch all countries and regions from database
  console.log("📦 Loading countries and regions from database...");
  const allCountries = await prisma.country.findMany({
    include: {
      regions: true,
    },
  });

  if (allCountries.length === 0) {
    console.error(
      "❌ No countries found in database. Please run the countries/regions seed first!"
    );
    process.exit(1);
  }

  console.log(`✓ Loaded ${allCountries.length} countries`);

  const users = [];

  for (let i = 0; i < USER_COUNT; i++) {
    const givenName = randomItem(givenNames);
    const familyName = randomItem(familyNames);
    const username = generateUsername(givenName, familyName);
    const email = generateEmail(givenName, familyName);
    const password = await bcrypt.hash("change-me-1234", 10);
    const role = i < 3 ? "ADMIN" : "USER"; // First 3 are admins
    const statuses = ["NEW", "ACTIVE", "INACTIVE", "DECEASED", "ARCHIVED"];
    const status = randomItem(statuses);

    const birthCountry = randomItem(allCountries);
    const residenceCountry = randomBoolean() ? birthCountry : randomItem(allCountries);

    const yearOfBirth = randomNumber(1950, 2000);
    const forumJoinDate = new Date(
      randomNumber(2010, 2024),
      randomNumber(0, 11),
      randomNumber(1, 28)
    );

    // Pick a random region from residence country if it has regions
    const residenceRegion =
      randomBoolean() && residenceCountry.regions.length > 0
        ? randomItem(residenceCountry.regions)
        : null;

    users.push({
      username,
      password,
      displayName: `${givenName} ${familyName}`,
      email,
      role,
      status,
      givenName: givenName,
      familyName: familyName,
      gender: randomItem(genders),
      birthYear: yearOfBirth,
      birthCountryId: birthCountry.id,
      residenceCountryId: residenceCountry.id,
      residenceRegionId: residenceRegion ? residenceRegion.id : null,
      peakbaggerId: randomBoolean() ? `PB${randomNumber(1000, 9999)}` : null,
      peakbaggerAllAscents: randomBoolean(),
      bwbForumNickname: randomBoolean() ? username : null,
      hillBaggingId: randomBoolean() ? `HB${randomNumber(100, 999)}` : null,
      forumJoinDate: randomBoolean() ? forumJoinDate : null,
      // Consent fields are DateTime - set to date if consented, null if not
      prHallConsent: randomBoolean() ? new Date() : null,
      pIndexConsent: randomBoolean() ? new Date() : null,
      infoRetentionConsent: randomBoolean() ? new Date() : null,
      publishTotalsConsent: randomBoolean() ? new Date() : null,
    });
  }

  // Create users
  for (const user of users) {
    try {
      await prisma.user.create({
        data: user,
      });
      console.log(`✓ Created user: ${user.username} (${user.displayName})`);
    } catch (error) {
      console.log(`✗ Failed to create ${user.username}: ${error.message}`);
    }
  }

  console.log(`\n✅ Successfully seeded ${users.length} users!`);
  console.log("\n📝 Test credentials:");
  console.log("   Username: any username from above");
  console.log("   Password: change-me-1234");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
