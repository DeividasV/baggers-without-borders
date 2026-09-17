/**
 * Test Data Factory
 *
 * Provides reusable functions to create test data for integration tests
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export interface TestDataContext {
  countries: {
    usa: any;
    uk: any;
    france: any;
    germany: any;
  };
  hofs: {
    bwbHof: any;
    p600Hof: any;
  };
  years: {
    year2023: any;
    year2024: any;
    year2025: any;
  };
}

/**
 * Create a complete set of base test data (countries, HOFs, years)
 */
export async function createBaseTestData(prisma: PrismaClient): Promise<TestDataContext> {
  // Create test countries
  const usa = await prisma.country.create({
    data: {
      code: "US",
      code3: "USA",
      name: "United States",
      continent: "North America",
      hasRegions: true,
    },
  });

  const uk = await prisma.country.create({
    data: {
      code: "GB",
      code3: "GBR",
      name: "United Kingdom",
      continent: "Europe",
      hasRegions: true,
    },
  });

  const france = await prisma.country.create({
    data: {
      code: "FR",
      code3: "FRA",
      name: "France",
      continent: "Europe",
      hasRegions: true,
    },
  });

  const germany = await prisma.country.create({
    data: {
      code: "DE",
      code3: "DEU",
      name: "Germany",
      continent: "Europe",
      hasRegions: true,
    },
  });

  // Create test HOFs
  const bwbHof = await prisma.hallOfFame.create({
    data: {
      code: "BWB",
      title: "BWB Hall of Fame",
      description: "Baggers Without Borders",
      isActive: true,
      displayOrder: 1,
      allowManualEntry: true,
    },
  });

  const p600Hof = await prisma.hallOfFame.create({
    data: {
      code: "P600",
      title: "P600 Hall of Fame",
      description: "P600 Peaks",
      isActive: true,
      displayOrder: 2,
      allowManualEntry: true,
    },
  });

  // Create test years
  const year2023 = await prisma.year.create({
    data: {
      code: "2023",
      title: "2023",
      description: "Year 2023",
      isActive: true,
      displayOrder: 1,
    },
  });

  const year2024 = await prisma.year.create({
    data: {
      code: "2024",
      title: "2024",
      description: "Year 2024",
      isActive: true,
      displayOrder: 2,
    },
  });

  const year2025 = await prisma.year.create({
    data: {
      code: "2025",
      title: "2025",
      description: "Year 2025",
      isActive: true,
      displayOrder: 3,
    },
  });

  return {
    countries: { usa, uk, france, germany },
    hofs: { bwbHof, p600Hof },
    years: { year2023, year2024, year2025 },
  };
}

/**
 * Create a test user
 */
export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<{
    username: string;
    displayName: string;
    password: string;
    role: string;
    status: string;
    email: string;
    residenceCountryId: string;
    birthCountryId: string;
  }> = {}
): Promise<any> {
  const defaultPassword = await bcrypt.hash("change-me-1234", 12);

  return prisma.user.create({
    data: {
      username: overrides.username || `testuser_${Date.now()}`,
      displayName: overrides.displayName || "Test User",
      password: overrides.password || defaultPassword,
      role: overrides.role || "USER",
      status: overrides.status || "ACTIVE",
      email: overrides.email || `testuser_${Date.now()}@test.com`,
      residenceCountryId: overrides.residenceCountryId || null,
      birthCountryId: overrides.birthCountryId || null,
    },
  });
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(
  prisma: PrismaClient,
  overrides: Partial<{
    username: string;
    displayName: string;
    email: string;
  }> = {}
): Promise<any> {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  return prisma.user.create({
    data: {
      username: overrides.username || `admin_${Date.now()}`,
      displayName: overrides.displayName || "Test Admin",
      email: overrides.email || `admin_${Date.now()}@test.com`,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
}

/**
 * Create HOF entries for a user
 */
export async function createHofEntries(
  prisma: PrismaClient,
  userId: string,
  hofId: string,
  entries: Array<{
    yearId: string;
    peaksInYear: number;
    foreignPeaks: number; // This is now foreignPeaksInYear
  }>
): Promise<any[]> {
  const created = [];
  for (const entry of entries) {
    const hofEntry = await prisma.hofEntry.create({
      data: {
        memberId: userId,
        hofId,
        yearId: entry.yearId,
        totalPeaks: 0, // Will be recalculated
        peaksInYear: entry.peaksInYear,
        foreignPeaks: 0, // Will be recalculated
        foreignPeaksInYear: entry.foreignPeaks, // Use the value as yearly foreign peaks
      },
    });
    created.push(hofEntry);
  }
  return created;
}

/**
 * Create HOF year configuration with award tiers
 */
export async function createHofYearConfig(
  prisma: PrismaClient,
  hofId: string,
  yearId: string,
  config: {
    minPeaks?: number;
    minForeignPeaks?: number;
    minFpr?: number;
    minimumAge?: number;
    lceEnabled?: boolean;
    lceMinFpr?: number | null;
    notes?: string;
  } = {},
  tiers: Array<{
    name: string;
    minPeaks: number;
    maxPeaks: number | null;
    displayOrder: number;
  }> = []
): Promise<any> {
  const hofYearConfig = await prisma.hofYearConfig.create({
    data: {
      hofId,
      yearId,
      minPeaks: config.minPeaks ?? 0,
      minForeignPeaks: config.minForeignPeaks ?? 0,
      minFpr: config.minFpr ?? 0,
      minimumAge: config.minimumAge ?? 0,
      lceEnabled: config.lceEnabled ?? false,
      lceMinFpr: config.lceMinFpr ?? null,
      notes: config.notes ?? "",
    },
  });

  // Create award tiers if provided
  if (tiers.length > 0) {
    await prisma.awardTier.createMany({
      data: tiers.map((tier) => ({
        hofYearConfigId: hofYearConfig.id,
        name: tier.name,
        minPeaks: tier.minPeaks,
        maxPeaks: tier.maxPeaks,
        displayOrder: tier.displayOrder,
      })),
    });
  }

  return hofYearConfig;
}

/**
 * Create user HOF participations
 */
export async function createUserHofParticipations(
  prisma: PrismaClient,
  userId: string,
  hofIds: string[],
  enabled: boolean = true
): Promise<void> {
  await prisma.userHofParticipation.createMany({
    data: hofIds.map((hofId) => ({
      userId,
      hofId,
      enabled,
    })),
  });
}

/**
 * Create user year participations
 */
export async function createUserYearParticipations(
  prisma: PrismaClient,
  userId: string,
  yearIds: string[],
  enabled: boolean = true
): Promise<void> {
  await prisma.userYearParticipation.createMany({
    data: yearIds.map((yearId) => ({
      userId,
      yearId,
      enabled,
      dataNotProvided: false,
    })),
  });
}

/**
 * Create a complete user with participations
 */
export async function createCompleteUser(
  prisma: PrismaClient,
  context: TestDataContext,
  options: {
    username?: string;
    hofIds?: string[];
    yearIds?: string[];
    countryId?: string;
  } = {}
): Promise<any> {
  const user = await createTestUser(prisma, {
    username: options.username,
    residenceCountryId: options.countryId || context.countries.uk.id,
  });

  // Create HOF participations
  const hofIds = options.hofIds || [context.hofs.bwbHof.id, context.hofs.p600Hof.id];
  await createUserHofParticipations(prisma, user.id, hofIds);

  // Create year participations
  const yearIds = options.yearIds || [
    context.years.year2023.id,
    context.years.year2024.id,
    context.years.year2025.id,
  ];
  await createUserYearParticipations(prisma, user.id, yearIds);

  return user;
}

/**
 * Create regions for a country
 */
export async function createRegions(
  prisma: PrismaClient,
  countryId: string,
  regions: Array<{ code: string; name: string; type: string }>
): Promise<any[]> {
  const created = [];
  for (const region of regions) {
    const r = await prisma.region.create({
      data: {
        countryId,
        code: region.code,
        name: region.name,
        type: region.type,
      },
    });
    created.push(r);
  }
  return created;
}

/**
 * Create consent types
 */
export async function createConsentTypes(
  prisma: PrismaClient,
  consentTypes: Array<{
    title: string;
    description: string;
    status?: string;
  }>
): Promise<any[]> {
  const created = [];
  for (const ct of consentTypes) {
    const consentType = await prisma.consentType.create({
      data: {
        title: ct.title,
        description: ct.description,
        status: ct.status || "ACTIVE",
      },
    });
    created.push(consentType);
  }
  return created;
}

/**
 * Create complete HOF entry with all required relationships
 */
export async function createCompleteHofEntry(
  prisma: PrismaClient,
  options: {
    username?: string;
    hofCode?: string;
    yearCode?: string;
    totalPeaks: number;
    peaksInYear: number;
    foreignPeaks?: number;
  }
): Promise<{
  user: any;
  hof: any;
  year: any;
  entry: any;
}> {
  // Create HOF if needed
  const hof = await prisma.hallOfFame.create({
    data: {
      code: options.hofCode || "TEST",
      title: options.hofCode || "TEST",
      isActive: true,
      displayOrder: 1,
      allowManualEntry: true,
    },
  });

  // Create Year
  const year = await prisma.year.create({
    data: {
      code: options.yearCode || "2025",
      title: options.yearCode || "2025",
      isActive: true,
      displayOrder: 1,
    },
  });

  // Create User
  const user = await createTestUser(prisma, {
    username: options.username,
  });

  // Create participations
  await prisma.userHofParticipation.create({
    data: {
      userId: user.id,
      hofId: hof.id,
      enabled: true,
    },
  });

  await prisma.userYearParticipation.create({
    data: {
      userId: user.id,
      yearId: year.id,
      enabled: true,
    },
  });

  // Create entry
  const entry = await prisma.hofEntry.create({
    data: {
      memberId: user.id,
      hofId: hof.id,
      yearId: year.id,
      totalPeaks: options.totalPeaks,
      peaksInYear: options.peaksInYear,
      foreignPeaks: options.foreignPeaks || 0,
    },
  });

  return { user, hof, year, entry };
}

/**
 * Create test document
 */
export async function createTestDocument(
  prisma: PrismaClient,
  options: {
    name: string;
    type?: string;
    status?: string;
    parentId?: string | null;
  }
): Promise<any> {
  return prisma.document.create({
    data: {
      name: options.name,
      filePath: `/test/${options.name}`,
      type: options.type || "OTHER",
      status: options.status || "ACTIVE",
      parentId: options.parentId || null,
      uploadedAt: new Date(),
    },
  });
}

/**
 * Factory for creating test HOF Year Config data with sensible defaults
 */
export function createMockHofYearConfig(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || "config-1",
    hofId: overrides.hofId || "hof-1",
    yearId: overrides.yearId || "year-1",
    hofmeisterId: overrides.hofmeisterId !== undefined ? overrides.hofmeisterId : null,
    minPeaks: overrides.minPeaks !== undefined ? overrides.minPeaks : 50,
    minPeaksEnabled: overrides.minPeaksEnabled !== undefined ? overrides.minPeaksEnabled : true,
    minForeignPeaks: overrides.minForeignPeaks !== undefined ? overrides.minForeignPeaks : 5,
    minForeignPeaksEnabled:
      overrides.minForeignPeaksEnabled !== undefined ? overrides.minForeignPeaksEnabled : true,
    minFpr: overrides.minFpr !== undefined ? overrides.minFpr : 0.1,
    minFprEnabled: overrides.minFprEnabled !== undefined ? overrides.minFprEnabled : true,
    minimumAge: overrides.minimumAge !== undefined ? overrides.minimumAge : 18,
    minimumAgeEnabled:
      overrides.minimumAgeEnabled !== undefined ? overrides.minimumAgeEnabled : true,
    lceEnabled: overrides.lceEnabled !== undefined ? overrides.lceEnabled : false,
    lceMinFpr: overrides.lceMinFpr !== undefined ? overrides.lceMinFpr : null,
    notes: overrides.notes !== undefined ? overrides.notes : null,
    hof: overrides.hof || {
      id: "hof-1",
      code: "BWB",
      title: "BWB Hall of Fame",
    },
    year: overrides.year || { id: "year-1", code: "2023", title: "2023" },
    hofmeister: overrides.hofmeister !== undefined ? overrides.hofmeister : null,
    lceCountries: overrides.lceCountries || [],
    ...overrides,
  };
}

/**
 * Factory for creating test user data with sensible defaults
 */
export function createMockUser(overrides: Partial<any> = {}) {
  const id = overrides.id || "user-1";
  const username = overrides.username || `user${id}`;

  return {
    id,
    username,
    email: overrides.email || `${username}@test.com`,
    password: overrides.password || "hashed_password",
    displayName: overrides.displayName || `User ${id}`,
    givenName: overrides.givenName || "Test",
    familyName: overrides.familyName || "User",
    bwbForumNickname: overrides.bwbForumNickname !== undefined ? overrides.bwbForumNickname : null,
    role: overrides.role || "USER",
    status: overrides.status || "ACTIVE",
    emailVerified: overrides.emailVerified !== undefined ? overrides.emailVerified : new Date(),
    ...overrides,
  };
}

/**
 * Factory for creating test hofmeister user data
 */
export function createMockHofmeister(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || "hofmeister-1",
    displayName: overrides.displayName || "Test Hofmeister",
    username: overrides.username || "hofmeister",
    givenName: overrides.givenName || "Test",
    familyName: overrides.familyName || "Hofmeister",
    bwbForumNickname: overrides.bwbForumNickname !== undefined ? overrides.bwbForumNickname : "THM",
    ...overrides,
  };
}

/**
 * Factory for creating HOF year config with hofmeister relation
 */
export function createMockConfigWithHofmeister(
  configOverrides: Partial<any> = {},
  hofmeisterOverrides: Partial<any> = {}
) {
  const hofmeister = createMockHofmeister(hofmeisterOverrides);

  return createMockHofYearConfig({
    ...configOverrides,
    hofmeisterId: hofmeister.id,
    hofmeister,
  });
}
