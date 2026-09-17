/**
 * Integration Tests - Critical User Workflows
 * Tests complete user journeys through the system
 */

import { getTestDb, cleanTestDb } from "../utils/test-db-setup";
import {
  createBaseTestData,
  createCompleteUser,
  createHofEntries,
  createTestUser,
  TestDataContext,
} from "../utils/test-data-factory";
import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";

describe("Integration: Complete User Registration and Participation Flow", () => {
  let db: ReturnType<typeof getTestDb>;
  let testData: TestDataContext;

  beforeAll(async () => {
    db = getTestDb();
  });

  beforeEach(async () => {
    // Clean and recreate base data for each test
    await cleanTestDb();
    testData = await createBaseTestData(db);
  });

  it("should complete full user registration and participation setup", async () => {
    const user = await createCompleteUser(db, testData, {
      username: "testclimber",
    });

    expect(user.id).toBeDefined();
    expect(user.username).toBe("testclimber");

    const hofParticipations = await db.userHofParticipation.findMany({
      where: { userId: user.id },
    });

    expect(hofParticipations).toHaveLength(2);
    expect(hofParticipations.every((p) => p.enabled)).toBe(true);

    const yearParticipations = await db.userYearParticipation.findMany({
      where: { userId: user.id },
    });

    expect(yearParticipations).toHaveLength(3);

    // Verify user can be retrieved with all relationships
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        hofParticipations: true,
        yearParticipations: true,
        residenceCountry: true,
        birthCountry: true,
      },
    });

    expect(fullUser?.hofParticipations).toHaveLength(2);
    expect(fullUser?.yearParticipations).toHaveLength(3);
    expect(fullUser?.residenceCountry?.name).toBe("United Kingdom");
  });

  it("should handle user disabling participation in specific HOF", async () => {
    const user = await createTestUser(db);

    // Create participations
    await db.userHofParticipation.createMany({
      data: [
        { userId: user.id, hofId: testData.hofs.bwbHof.id, enabled: true },
        { userId: user.id, hofId: testData.hofs.p600Hof.id, enabled: true },
      ],
    });

    // Disable P600 participation
    await db.userHofParticipation.update({
      where: {
        userId_hofId: {
          userId: user.id,
          hofId: testData.hofs.p600Hof.id,
        },
      },
      data: { enabled: false },
    });

    const participations = await db.userHofParticipation.findMany({
      where: { userId: user.id },
      include: { hof: true },
    });

    const bwbParticipation = participations.find(
      (p) => p.hofId === testData.hofs.bwbHof.id
    );
    const p600Participation = participations.find(
      (p) => p.hofId === testData.hofs.p600Hof.id
    );

    expect(bwbParticipation?.enabled).toBe(true);
    expect(p600Participation?.enabled).toBe(false);
  });
});

describe("Integration: HOF Entry Creation and Total Recalculation Flow", () => {
  let db: ReturnType<typeof getTestDb>;
  let testData: TestDataContext;
  let testUser: any;

  beforeAll(async () => {
    db = getTestDb();
  });

  beforeEach(async () => {
    // Clean and recreate base data for each test
    await cleanTestDb();
    testData = await createBaseTestData(db);
    testUser = await createCompleteUser(db, testData);
  });

  it("should create entries and correctly calculate cumulative totals", async () => {
    await createHofEntries(db, testUser.id, testData.hofs.bwbHof.id, [
      { yearId: testData.years.year2023.id, peaksInYear: 50, foreignPeaks: 10 },
      { yearId: testData.years.year2024.id, peaksInYear: 40, foreignPeaks: 5 },
      { yearId: testData.years.year2025.id, peaksInYear: 30, foreignPeaks: 0 },
    ]);

    await recalculateTotalsForUserAndHof(
      testUser.id,
      testData.hofs.bwbHof.id,
      db,
      db
    );

    const entries = await db.hofEntry.findMany({
      where: {
        memberId: testUser.id,
        hofId: testData.hofs.bwbHof.id,
      },
      orderBy: {
        year: {
          displayOrder: "asc",
        },
      },
    });

    expect(entries).toHaveLength(3);
    expect(entries[0].totalPeaks).toBe(50); // cumulative domestic
    expect(entries[0].foreignPeaks).toBe(10); // cumulative foreign
    expect(entries[1].totalPeaks).toBe(90); // 50 + 40
    expect(entries[1].foreignPeaks).toBe(15); // 10 + 5
    expect(entries[2].totalPeaks).toBe(120); // 90 + 30
    expect(entries[2].foreignPeaks).toBe(15); // 15 + 0
  });

  it("should handle entry updates and recalculate totals correctly", async () => {
    const entries = await createHofEntries(
      db,
      testUser.id,
      testData.hofs.p600Hof.id,
      [
        {
          yearId: testData.years.year2023.id,
          peaksInYear: 100,
          foreignPeaks: 20,
        },
        {
          yearId: testData.years.year2024.id,
          peaksInYear: 80,
          foreignPeaks: 15,
        },
      ]
    );

    await recalculateTotalsForUserAndHof(
      testUser.id,
      testData.hofs.p600Hof.id,
      db
    );

    let updatedEntries = await db.hofEntry.findMany({
      where: { memberId: testUser.id, hofId: testData.hofs.p600Hof.id },
      orderBy: { year: { displayOrder: "asc" } },
    });

    expect(updatedEntries[0].totalPeaks).toBe(100); // cumulative domestic
    expect(updatedEntries[0].foreignPeaks).toBe(20); // cumulative foreign
    expect(updatedEntries[1].totalPeaks).toBe(180); // 100 + 80
    expect(updatedEntries[1].foreignPeaks).toBe(35); // 20 + 15

    // Update 2023 entry
    await db.hofEntry.update({
      where: { id: entries[0].id },
      data: { peaksInYear: 110, foreignPeaksInYear: 25 },
    });

    await recalculateTotalsForUserAndHof(
      testUser.id,
      testData.hofs.p600Hof.id,
      db
    );

    updatedEntries = await db.hofEntry.findMany({
      where: { memberId: testUser.id, hofId: testData.hofs.p600Hof.id },
      orderBy: { year: { displayOrder: "asc" } },
    });

    expect(updatedEntries[0].totalPeaks).toBe(110); // cumulative domestic
    expect(updatedEntries[0].foreignPeaks).toBe(25); // cumulative foreign
    expect(updatedEntries[1].totalPeaks).toBe(190); // 110 + 80
    expect(updatedEntries[1].foreignPeaks).toBe(40); // 25 + 15
  });

  it("should handle multiple users and HOFs independently", async () => {
    const user1 = await createCompleteUser(db, testData, {
      username: "climber1",
    });
    const user2 = await createCompleteUser(db, testData, {
      username: "climber2",
    });

    await createHofEntries(db, user1.id, testData.hofs.bwbHof.id, [
      { yearId: testData.years.year2023.id, peaksInYear: 50, foreignPeaks: 5 },
      { yearId: testData.years.year2024.id, peaksInYear: 60, foreignPeaks: 10 },
    ]);

    await createHofEntries(db, user1.id, testData.hofs.p600Hof.id, [
      { yearId: testData.years.year2023.id, peaksInYear: 30, foreignPeaks: 2 },
    ]);

    await createHofEntries(db, user2.id, testData.hofs.bwbHof.id, [
      {
        yearId: testData.years.year2023.id,
        peaksInYear: 100,
        foreignPeaks: 20,
      },
    ]);

    await recalculateTotalsForUserAndHof(user1.id, testData.hofs.bwbHof.id, db);
    await recalculateTotalsForUserAndHof(
      user1.id,
      testData.hofs.p600Hof.id,
      db
    );
    await recalculateTotalsForUserAndHof(user2.id, testData.hofs.bwbHof.id, db);

    const user1BwbEntries = await db.hofEntry.findMany({
      where: { memberId: user1.id, hofId: testData.hofs.bwbHof.id },
      orderBy: { year: { displayOrder: "asc" } },
    });
    expect(user1BwbEntries[0].totalPeaks).toBe(50); // cumulative domestic
    expect(user1BwbEntries[0].foreignPeaks).toBe(5); // cumulative foreign
    expect(user1BwbEntries[1].totalPeaks).toBe(110); // 50 + 60
    expect(user1BwbEntries[1].foreignPeaks).toBe(15); // 5 + 10

    const user1P600Entries = await db.hofEntry.findMany({
      where: { memberId: user1.id, hofId: testData.hofs.p600Hof.id },
    });
    expect(user1P600Entries[0].totalPeaks).toBe(30); // cumulative domestic
    expect(user1P600Entries[0].foreignPeaks).toBe(2); // cumulative foreign

    const user2BwbEntries = await db.hofEntry.findMany({
      where: { memberId: user2.id, hofId: testData.hofs.bwbHof.id },
    });
    expect(user2BwbEntries[0].totalPeaks).toBe(100); // cumulative domestic
    expect(user2BwbEntries[0].foreignPeaks).toBe(20); // cumulative foreign
  });
});
