/**
 * Integration Test: LCE with Year-Specific Country Override
 *
 * Tests that Large Country Exception (LCE) applies based on the user's residence
 * country for the specific HOF year, not their current/latest residence.
 *
 * Scenario:
 * - User lived in Canada (LCE country) from 2020-2022
 * - User moved to Belgium (non-LCE country) in 2023 (current residence)
 * - HOF Year: 2021
 * - Expected: LCE should apply because user lived in Canada during 2021
 *
 * This test verifies:
 * 1. UserYearParticipation.countryId override takes precedence
 * 2. LCE logic correctly uses year-specific country, not latest residence
 * 3. Members with different residence histories get correct LCE treatment
 */

import { NextRequest } from "next/server";
import { getTestDb, cleanTestDb } from "../utils/test-db-setup";

let testDb: ReturnType<typeof getTestDb>;
jest.mock("@/src/lib/prisma", () => ({
  get prisma() {
    if (!testDb) {
      testDb = getTestDb();
    }
    return testDb;
  },
}));

import { GET as GetHofTables } from "@/app/api/hof-tables/route";

jest.mock("@/src/lib/api-auth", () => ({
  getOptionalSession: jest.fn(() => Promise.resolve(null)),
}));

describe("Integration: LCE with Year-Specific Country Override", () => {
  let db: ReturnType<typeof getTestDb>;
  let canadaId: string;
  let belgiumId: string;
  let usaId: string;
  let hofId: string;
  let year2021Id: string;
  let year2023Id: string;
  let configId: string;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();

    // Create countries
    const canada = await db.country.create({
      data: {
        code: "CA",
        code3: "CAN",
        name: "Canada",
        continent: "North America",
      },
    });
    canadaId = canada.id;

    const belgium = await db.country.create({
      data: {
        code: "BE",
        code3: "BEL",
        name: "Belgium",
        continent: "Europe",
      },
    });
    belgiumId = belgium.id;

    const usa = await db.country.create({
      data: {
        code: "US",
        code3: "USA",
        name: "United States",
        continent: "North America",
      },
    });
    usaId = usa.id;

    // Create HOF
    const hof = await db.hallOfFame.create({
      data: {
        code: "P100",
        title: "P100 Hall of Fame",
        description: "100 peaks",
        isActive: true,
        displayOrder: 1,
        allowManualEntry: true,
      },
    });
    hofId = hof.id;

    // Create years
    const year2021 = await db.year.create({
      data: {
        code: "2021",
        title: "2021",
        isActive: true,
        displayOrder: 1,
      },
    });
    year2021Id = year2021.id;

    const year2023 = await db.year.create({
      data: {
        code: "2023",
        title: "2023",
        isActive: true,
        displayOrder: 2,
      },
    });
    year2023Id = year2023.id;

    // Create HOF-Year config with LCE enabled
    const config = await db.hofYearConfig.create({
      data: {
        hofId: hofId,
        yearId: year2021Id,
        minPeaks: 50,
        minPeaksEnabled: true,
        minForeignPeaks: 0,
        minForeignPeaksEnabled: false,
        minFpr: 10, // Standard threshold: 10%
        minFprEnabled: true,
        minimumAge: 0,
        minimumAgeEnabled: false,
        lceEnabled: true,
        lceMinFpr: 5, // LCE threshold: 5%
      },
    });
    configId = config.id;

    // Add Canada and USA as LCE countries
    await db.countryLceConfig.createMany({
      data: [
        {
          hofYearConfigId: configId,
          countryId: canadaId,
          hasLce: true,
        },
        {
          hofYearConfigId: configId,
          countryId: usaId,
          hasLce: true,
        },
      ],
    });
  });

  it("should apply LCE based on year-specific country override, not current residence", async () => {
    // Create user who moved from Canada to Belgium
    const user = await db.user.create({
      data: {
        username: "moveduser",
        displayName: "User Who Moved",
        email: "moved@test.com",
        password: "hash",
        status: "ACTIVE",
        residenceCountryId: belgiumId, // Current residence: Belgium (non-LCE)
        birthYear: 1980,
      },
    });

    // Set year-specific country override: User lived in Canada during 2021
    await db.userYearParticipation.create({
      data: {
        userId: user.id,
        yearId: year2021Id,
        enabled: true,
        dataNotProvided: false,
        countryId: canadaId, // Lived in Canada in 2021 (LCE country)
      },
    });

    // Create HOF entries for 2021
    // User has: 100 total peaks, 7 foreign peaks
    // FPR = 7% (below standard 10%, but above LCE 5%)
    await db.hofEntry.create({
      data: {
        memberId: user.id,
        hofId: hofId,
        yearId: year2021Id,
        totalPeaks: 100,
        peaksInYear: 100,
        foreignPeaks: 7,
        foreignPeaksInYear: 7,
      },
    });

    // Fetch HOF table for 2021
    const url = new URL(
      `http://localhost/api/hof-tables?yearId=${year2021Id}&hofId=${hofId}`
    );
    const req = new NextRequest(url);
    const response = await GetHofTables(req);
    const data = await response.json();

    // Verify user is included and has LCE badge
    expect(data.members).toHaveLength(1);
    const memberStats = data.members[0];
    expect(memberStats.member.username).toBe("moveduser");
    expect(memberStats.fpr).toBeCloseTo(7, 1);
    expect(memberStats.hasLce).toBe(true);
    expect(memberStats.lceCountryId).toBe(canadaId);
  });

  it("should NOT apply LCE when year-specific country is not an LCE country", async () => {
    // Create user who moved from Belgium to Canada
    const user = await db.user.create({
      data: {
        username: "movedtocanada",
        displayName: "User Who Moved to Canada",
        email: "movedtocanada@test.com",
        password: "hash",
        status: "ACTIVE",
        residenceCountryId: canadaId, // Current residence: Canada (LCE)
        birthYear: 1980,
      },
    });

    // Set year-specific country override: User lived in Belgium during 2021
    await db.userYearParticipation.create({
      data: {
        userId: user.id,
        yearId: year2021Id,
        enabled: true,
        dataNotProvided: false,
        countryId: belgiumId, // Lived in Belgium in 2021 (NOT LCE country)
      },
    });

    // Create HOF entries for 2021
    // User has: 100 total peaks, 7 foreign peaks
    // FPR = 7% (below standard 10%)
    await db.hofEntry.create({
      data: {
        memberId: user.id,
        hofId: hofId,
        yearId: year2021Id,
        totalPeaks: 100,
        peaksInYear: 100,
        foreignPeaks: 7,
        foreignPeaksInYear: 7,
      },
    });

    // Fetch HOF table for 2021
    const url = new URL(
      `http://localhost/api/hof-tables?yearId=${year2021Id}&hofId=${hofId}`
    );
    const req = new NextRequest(url);
    const response = await GetHofTables(req);
    const data = await response.json();

    // Verify user is NOT included (doesn't meet standard 10% threshold)
    // AND doesn't get LCE (Belgium is not an LCE country in 2021)
    expect(data.members).toHaveLength(0);
  });

  it("should fall back to current residence when no year-specific override exists", async () => {
    // Create user without year-specific override
    const user = await db.user.create({
      data: {
        username: "noyearoverride",
        displayName: "User Without Year Override",
        email: "noyearoverride@test.com",
        password: "hash",
        status: "ACTIVE",
        residenceCountryId: canadaId, // Current residence: Canada (LCE)
        birthYear: 1980,
      },
    });

    // Enable participation but NO country override
    await db.userYearParticipation.create({
      data: {
        userId: user.id,
        yearId: year2021Id,
        enabled: true,
        dataNotProvided: false,
        countryId: null, // No override - should use current residence
      },
    });

    // Create HOF entries for 2021
    // User has: 100 total peaks, 7 foreign peaks
    // FPR = 7% (below standard 10%, but above LCE 5%)
    await db.hofEntry.create({
      data: {
        memberId: user.id,
        hofId: hofId,
        yearId: year2021Id,
        totalPeaks: 100,
        peaksInYear: 100,
        foreignPeaks: 7,
        foreignPeaksInYear: 7,
      },
    });

    // Fetch HOF table for 2021
    const url = new URL(
      `http://localhost/api/hof-tables?yearId=${year2021Id}&hofId=${hofId}`
    );
    const req = new NextRequest(url);
    const response = await GetHofTables(req);
    const data = await response.json();

    // Verify user is included with LCE (falls back to Canada residence)
    expect(data.members).toHaveLength(1);
    const memberStats = data.members[0];
    expect(memberStats.member.username).toBe("noyearoverride");
    expect(memberStats.hasLce).toBe(true);
    expect(memberStats.lceCountryId).toBe(canadaId);
  });

  it("should handle multiple users with different residence histories correctly", async () => {
    // User 1: Lives in Belgium now, lived in Canada in 2021
    const user1 = await db.user.create({
      data: {
        username: "user1",
        displayName: "User 1 (Canada -> Belgium)",
        email: "user1@test.com",
        password: "hash",
        status: "ACTIVE",
        residenceCountryId: belgiumId,
        birthYear: 1980,
      },
    });

    await db.userYearParticipation.create({
      data: {
        userId: user1.id,
        yearId: year2021Id,
        enabled: true,
        countryId: canadaId, // Canada in 2021
      },
    });

    await db.hofEntry.create({
      data: {
        memberId: user1.id,
        hofId: hofId,
        yearId: year2021Id,
        totalPeaks: 100,
        peaksInYear: 100,
        foreignPeaks: 6, // 6% FPR
        foreignPeaksInYear: 6,
      },
    });

    // User 2: Lives in Canada now, lived in Belgium in 2021
    const user2 = await db.user.create({
      data: {
        username: "user2",
        displayName: "User 2 (Belgium -> Canada)",
        email: "user2@test.com",
        password: "hash",
        status: "ACTIVE",
        residenceCountryId: canadaId,
        birthYear: 1980,
      },
    });

    await db.userYearParticipation.create({
      data: {
        userId: user2.id,
        yearId: year2021Id,
        enabled: true,
        countryId: belgiumId, // Belgium in 2021
      },
    });

    await db.hofEntry.create({
      data: {
        memberId: user2.id,
        hofId: hofId,
        yearId: year2021Id,
        totalPeaks: 100,
        peaksInYear: 100,
        foreignPeaks: 6, // 6% FPR
        foreignPeaksInYear: 6,
      },
    });

    // User 3: Always lived in USA (LCE country)
    const user3 = await db.user.create({
      data: {
        username: "user3",
        displayName: "User 3 (Always USA)",
        email: "user3@test.com",
        password: "hash",
        status: "ACTIVE",
        residenceCountryId: usaId,
        birthYear: 1980,
      },
    });

    await db.userYearParticipation.create({
      data: {
        userId: user3.id,
        yearId: year2021Id,
        enabled: true,
        // No countryId override - uses current USA residence
      },
    });

    await db.hofEntry.create({
      data: {
        memberId: user3.id,
        hofId: hofId,
        yearId: year2021Id,
        totalPeaks: 100,
        peaksInYear: 100,
        foreignPeaks: 6, // 6% FPR
        foreignPeaksInYear: 6,
      },
    });

    // Fetch HOF table for 2021
    const url = new URL(
      `http://localhost/api/hof-tables?yearId=${year2021Id}&hofId=${hofId}`
    );
    const req = new NextRequest(url);
    const response = await GetHofTables(req);
    const data = await response.json();

    // Verify results:
    // - User 1: Included (lived in Canada in 2021, gets LCE)
    // - User 2: Excluded (lived in Belgium in 2021, no LCE, below 10%)
    // - User 3: Included (lives in USA, gets LCE)
    expect(data.members).toHaveLength(2);

    const usernames = data.members.map((m: any) => m.member.username).sort();
    expect(usernames).toEqual(["user1", "user3"]);

    // Both should have LCE applied
    data.members.forEach((memberStats: any) => {
      expect(memberStats.hasLce).toBe(true);
      expect(memberStats.fpr).toBeCloseTo(6, 1);
      expect([canadaId, usaId]).toContain(memberStats.lceCountryId);
    });
  });
});
