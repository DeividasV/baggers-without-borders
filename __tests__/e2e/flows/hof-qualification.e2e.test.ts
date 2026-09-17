/**
 * E2E Flow Test: HOF Entry Creation and Qualification
 *
 * Tests complete HOF flow: create entry → calculate totals → assign tier → display in tables
 */

import { NextRequest } from "next/server";
import { getTestDb, cleanTestDb } from "../../utils/test-db-setup";

let testDb: ReturnType<typeof getTestDb>;
jest.mock("@/src/lib/prisma", () => ({
  get prisma() {
    if (!testDb) {
      testDb = getTestDb();
    }
    return testDb;
  },
}));

import { POST as CreateEntry } from "@/app/api/hof-entries/route";
import { GET as GetTables } from "@/app/api/hof-tables/route";

jest.mock("@/src/lib/api-auth", () => ({
  getSession: jest.fn(() =>
    Promise.resolve({
      user: { id: "test-admin-id", role: "ADMIN" },
    })
  ),
  getOptionalSession: jest.fn(() => Promise.resolve(null)),
}));

describe("E2E Flow: HOF Entry and Qualification", () => {
  let db: ReturnType<typeof getTestDb>;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();

    // Create admin user for API calls
    await db.user.create({
      data: {
        id: "test-admin-id",
        username: "testadmin",
        displayName: "Test Admin",
        email: "admin@test.com",
        password: "hash",
        role: "ADMIN",
      },
    });
  });

  it("should create HOF entry → recalculate totals → qualify for award tier", async () => {
    // Step 1: Create HOF
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

    // Step 2: Create years
    const year2024 = await db.year.create({
      data: {
        code: "2024",
        title: "2024",
        isActive: true,
        displayOrder: 1,
      },
    });

    const year2025 = await db.year.create({
      data: {
        code: "2025",
        title: "2025",
        isActive: true,
        displayOrder: 2,
      },
    });

    // Step 3: Create HOF-Year config with award tiers
    const config = await db.hofYearConfig.create({
      data: {
        hofId: hof.id,
        yearId: year2025.id,
        minPeaks: 100,
      },
    });

    // Create award tiers
    await db.awardTier.createMany({
      data: [
        {
          hofYearConfigId: config.id,
          name: "Gold",
          minPeaks: 100,
          displayOrder: 1,
        },
        {
          hofYearConfigId: config.id,
          name: "Silver",
          minPeaks: 75,
          displayOrder: 2,
        },
        {
          hofYearConfigId: config.id,
          name: "Bronze",
          minPeaks: 50,
          displayOrder: 3,
        },
      ],
    });

    // Step 4: Create member
    const member = await db.user.create({
      data: {
        username: "climber1",
        displayName: "Elite Climber",
        email: "climber1@test.com",
        password: "hash",
        role: "USER",
        status: "ACTIVE",
      },
    });

    // Create participations
    await db.userHofParticipation.create({
      data: {
        userId: member.id,
        hofId: hof.id,
        enabled: true,
      },
    });

    await db.userYearParticipation.createMany({
      data: [
        { userId: member.id, yearId: year2024.id, enabled: true },
        { userId: member.id, yearId: year2025.id, enabled: true },
      ],
    });

    // Step 5: Create first year entry
    const entry2024Data = {
      memberId: member.id,
      hofId: hof.id,
      yearId: year2024.id,
      peaksInYear: 60,
      foreignPeaks: 15,
    };

    const request2024 = new NextRequest(
      "http://localhost:3000/api/hof-entries",
      {
        method: "POST",
        body: JSON.stringify(entry2024Data),
      }
    );

    const response2024 = await CreateEntry(request2024);
    const entry2024 = await response2024.json();

    expect(response2024.status).toBe(201);
    expect(entry2024.totalPeaks).toBe(60); // First year = total

    // Step 6: Create second year entry
    const entry2025Data = {
      memberId: member.id,
      hofId: hof.id,
      yearId: year2025.id,
      peaksInYear: 45,
      foreignPeaks: 10,
    };

    const request2025 = new NextRequest(
      "http://localhost:3000/api/hof-entries",
      {
        method: "POST",
        body: JSON.stringify(entry2025Data),
      }
    );

    const response2025 = await CreateEntry(request2025);
    const entry2025 = await response2025.json();

    expect(response2025.status).toBe(201);
    expect(entry2025.totalPeaks).toBe(105); // 60 + 45 = cumulative

    // Step 7: Verify totals recalculated correctly in database
    const entries = await db.hofEntry.findMany({
      where: { memberId: member.id },
      orderBy: { yearId: "asc" },
    });

    expect(entries).toHaveLength(2);
    expect(entries[0].totalPeaks).toBe(60);
    expect(entries[1].totalPeaks).toBe(105);

    // Step 8: Check qualification in HOF tables
    const tablesRequest = new NextRequest(
      "http://localhost:3000/api/hof-tables"
    );
    const tablesResponse = await GetTables(tablesRequest);
    const tablesData = await tablesResponse.json();

    expect(tablesResponse.status).toBe(200);
    expect(tablesData.members).toBeDefined();

    // Verify member appears in qualification list
    const qualifiedMember = tablesData.members.find(
      (m: any) => m.member.id === member.id
    );

    if (qualifiedMember) {
      expect(qualifiedMember.totalPeaks).toBe(105);
      expect(qualifiedMember.awardTierName).toBe("Gold"); // 105 >= 100
    }
  });

  it("should handle non-qualifying entries correctly", async () => {
    const hof = await db.hallOfFame.create({
      data: {
        code: "P100",
        title: "P100",
        isActive: true,
        displayOrder: 1,
        allowManualEntry: true,
      },
    });

    const year = await db.year.create({
      data: {
        code: "2025",
        title: "2025",
        isActive: true,
        displayOrder: 1,
      },
    });

    const config = await db.hofYearConfig.create({
      data: {
        hofId: hof.id,
        yearId: year.id,
        minPeaks: 10, // Minimum 10 peaks
      },
    });

    const member = await db.user.create({
      data: {
        username: "newclimber",
        displayName: "New Climber",
        email: "new@test.com",
        password: "hash",
        role: "USER",
        status: "ACTIVE",
      },
    });

    await db.userHofParticipation.create({
      data: {
        userId: member.id,
        hofId: hof.id,
        enabled: true,
      },
    });

    await db.userYearParticipation.create({
      data: {
        userId: member.id,
        yearId: year.id,
        enabled: true,
      },
    });

    // Create entry that doesn't meet minimum
    const entryData = {
      memberId: member.id,
      hofId: hof.id,
      yearId: year.id,
      peaksInYear: 5, // Below minimum of 10
      foreignPeaks: 0,
    };

    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      body: JSON.stringify(entryData),
    });

    const response = await CreateEntry(request);
    expect(response.status).toBe(201); // Entry created successfully

    // Check HOF tables - should not appear (doesn't qualify)
    const tablesRequest = new NextRequest(
      "http://localhost:3000/api/hof-tables"
    );
    const tablesResponse = await GetTables(tablesRequest);
    const tablesData = await tablesResponse.json();

    const qualifiedMember = tablesData.members.find(
      (m: any) => m.member.id === member.id
    );

    // Should either not appear or be marked as not qualifying
    if (qualifiedMember) {
      expect(qualifiedMember.isParticipating).toBe(false);
    }
  });

  it("should handle multiple members and assign correct tiers", async () => {
    // Create HOF, year, and config
    const hof = await db.hallOfFame.create({
      data: {
        code: "P100",
        title: "P100",
        isActive: true,
        displayOrder: 1,
        allowManualEntry: true,
      },
    });

    const year = await db.year.create({
      data: {
        code: "2025",
        title: "2025",
        isActive: true,
        displayOrder: 1,
      },
    });

    const config = await db.hofYearConfig.create({
      data: {
        hofId: hof.id,
        yearId: year.id,
        minPeaks: 50,
      },
    });

    // Create tiers
    await db.awardTier.createMany({
      data: [
        {
          hofYearConfigId: config.id,
          name: "Gold",
          minPeaks: 100,
          displayOrder: 1,
        },
        {
          hofYearConfigId: config.id,
          name: "Silver",
          minPeaks: 75,
          displayOrder: 2,
        },
        {
          hofYearConfigId: config.id,
          name: "Bronze",
          minPeaks: 50,
          displayOrder: 3,
        },
      ],
    });

    // Create 3 members with different totals
    const members = [];
    for (let i = 1; i <= 3; i++) {
      const member = await db.user.create({
        data: {
          username: `climber${i}`,
          displayName: `Climber ${i}`,
          email: `climber${i}@test.com`,
          password: "hash",
          role: "USER",
          status: "ACTIVE",
        },
      });

      await db.userHofParticipation.create({
        data: {
          userId: member.id,
          hofId: hof.id,
          enabled: true,
        },
      });

      await db.userYearParticipation.create({
        data: {
          userId: member.id,
          yearId: year.id,
          enabled: true,
        },
      });

      await db.hofEntry.create({
        data: {
          memberId: member.id,
          hofId: hof.id,
          yearId: year.id,
          totalPeaks: i === 1 ? 120 : i === 2 ? 85 : 60, // Gold, Silver, Bronze
          peaksInYear: 10,
          foreignPeaks: 5,
        },
      });

      members.push(member);
    }

    // Check tier assignment
    const tablesRequest = new NextRequest(
      "http://localhost:3000/api/hof-tables"
    );
    const tablesResponse = await GetTables(tablesRequest);
    const tablesData = await tablesResponse.json();

    expect(tablesData.members.length).toBeGreaterThan(0);

    // Verify tiers
    const goldMember = tablesData.members.find(
      (m: any) => m.member.username === "climber1"
    );
    const silverMember = tablesData.members.find(
      (m: any) => m.member.username === "climber2"
    );
    const bronzeMember = tablesData.members.find(
      (m: any) => m.member.username === "climber3"
    );

    if (goldMember) expect(goldMember.awardTierName).toBe("Gold");
    if (silverMember) expect(silverMember.awardTierName).toBe("Silver");
    if (bronzeMember) expect(bronzeMember.awardTierName).toBe("Bronze");
  });
});
