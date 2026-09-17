/**
 * Integration Test: HOF Entry Workflows
 *
 * Tests complete HOF entry scenarios including:
 * - Entry creation and updates
 * - Total recalculation
 * - Configuration and award tiers
 */

import { getTestDb, cleanTestDb } from "../utils/test-db-setup";
import {
  createBaseTestData,
  createCompleteUser,
  createHofEntries,
  createHofYearConfig,
  TestDataContext,
} from "../utils/test-data-factory";
import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";

describe("Integration: HOF Entries and Calculations", () => {
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

  describe("HOF Entry Creation", () => {
    it("should create HOF entries for multiple years", async () => {
      const user = await createCompleteUser(db, testData);

      const entries = await createHofEntries(
        db,
        user.id,
        testData.hofs.bwbHof.id,
        [
          {
            yearId: testData.years.year2023.id,
            peaksInYear: 50,
            foreignPeaks: 10,
          },
          {
            yearId: testData.years.year2024.id,
            peaksInYear: 60,
            foreignPeaks: 15,
          },
          {
            yearId: testData.years.year2025.id,
            peaksInYear: 40,
            foreignPeaks: 5,
          },
        ]
      );

      expect(entries).toHaveLength(3);
      expect(entries[0].peaksInYear).toBe(50);
      expect(entries[1].peaksInYear).toBe(60);
      expect(entries[2].peaksInYear).toBe(40);
    });

    it("should prevent duplicate entries for same user/hof/year", async () => {
      const user = await createCompleteUser(db, testData);

      await createHofEntries(db, user.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2023.id,
          peaksInYear: 50,
          foreignPeaks: 10,
        },
      ]);

      // Try to create duplicate
      await expect(
        db.hofEntry.create({
          data: {
            memberId: user.id,
            hofId: testData.hofs.bwbHof.id,
            yearId: testData.years.year2023.id,
            totalPeaks: 0,
            peaksInYear: 100,
            foreignPeaks: 20,
          },
        })
      ).rejects.toThrow();
    });

    it("should allow entries for same user in different HOFs", async () => {
      const user = await createCompleteUser(db, testData);

      await createHofEntries(db, user.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2023.id,
          peaksInYear: 50,
          foreignPeaks: 10,
        },
      ]);

      await createHofEntries(db, user.id, testData.hofs.p600Hof.id, [
        {
          yearId: testData.years.year2023.id,
          peaksInYear: 30,
          foreignPeaks: 5,
        },
      ]);

      const bwbEntries = await db.hofEntry.findMany({
        where: { memberId: user.id, hofId: testData.hofs.bwbHof.id },
      });
      const p600Entries = await db.hofEntry.findMany({
        where: { memberId: user.id, hofId: testData.hofs.p600Hof.id },
      });

      expect(bwbEntries).toHaveLength(1);
      expect(p600Entries).toHaveLength(1);
    });
  });

  describe("Total Recalculation", () => {
    it("should calculate cumulative totals correctly", async () => {
      const user = await createCompleteUser(db, testData);

      await createHofEntries(db, user.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2023.id,
          peaksInYear: 50,
          foreignPeaks: 10,
        },
        {
          yearId: testData.years.year2024.id,
          peaksInYear: 40,
          foreignPeaks: 5,
        },
        {
          yearId: testData.years.year2025.id,
          peaksInYear: 30,
          foreignPeaks: 0,
        },
      ]);

      await recalculateTotalsForUserAndHof(
        user.id,
        testData.hofs.bwbHof.id,
        db
      );

      const entries = await db.hofEntry.findMany({
        where: { memberId: user.id, hofId: testData.hofs.bwbHof.id },
        orderBy: { year: { displayOrder: "asc" } },
      });

      expect(entries[0].totalPeaks).toBe(50); // cumulative domestic
      expect(entries[0].foreignPeaks).toBe(10); // cumulative foreign
      expect(entries[1].totalPeaks).toBe(90); // 50 + 40
      expect(entries[1].foreignPeaks).toBe(15); // 10 + 5
      expect(entries[2].totalPeaks).toBe(120); // 90 + 30
      expect(entries[2].foreignPeaks).toBe(15); // 15 + 0
    });

    it("should recalculate when entry is updated", async () => {
      const user = await createCompleteUser(db, testData);

      const entries = await createHofEntries(
        db,
        user.id,
        testData.hofs.bwbHof.id,
        [
          {
            yearId: testData.years.year2023.id,
            peaksInYear: 50,
            foreignPeaks: 10,
          },
          {
            yearId: testData.years.year2024.id,
            peaksInYear: 40,
            foreignPeaks: 5,
          },
        ]
      );

      await recalculateTotalsForUserAndHof(
        user.id,
        testData.hofs.bwbHof.id,
        db
      );

      // Update first entry
      await db.hofEntry.update({
        where: { id: entries[0].id },
        data: { peaksInYear: 100, foreignPeaksInYear: 20 }, // Changed from 50+10
      });

      await recalculateTotalsForUserAndHof(
        user.id,
        testData.hofs.bwbHof.id,
        db
      );

      const updatedEntries = await db.hofEntry.findMany({
        where: { memberId: user.id, hofId: testData.hofs.bwbHof.id },
        orderBy: { year: { displayOrder: "asc" } },
      });

      expect(updatedEntries[0].totalPeaks).toBe(100); // cumulative domestic
      expect(updatedEntries[0].foreignPeaks).toBe(20); // cumulative foreign
      expect(updatedEntries[1].totalPeaks).toBe(140); // 100 + 40
      expect(updatedEntries[1].foreignPeaks).toBe(25); // 20 + 5
    });

    it("should recalculate when entry is deleted", async () => {
      const user = await createCompleteUser(db, testData);

      const entries = await createHofEntries(
        db,
        user.id,
        testData.hofs.bwbHof.id,
        [
          {
            yearId: testData.years.year2023.id,
            peaksInYear: 50,
            foreignPeaks: 10,
          },
          {
            yearId: testData.years.year2024.id,
            peaksInYear: 40,
            foreignPeaks: 5,
          },
          {
            yearId: testData.years.year2025.id,
            peaksInYear: 30,
            foreignPeaks: 0,
          },
        ]
      );

      await recalculateTotalsForUserAndHof(
        user.id,
        testData.hofs.bwbHof.id,
        db
      );

      // Delete middle entry
      await db.hofEntry.delete({ where: { id: entries[1].id } });

      await recalculateTotalsForUserAndHof(
        user.id,
        testData.hofs.bwbHof.id,
        db
      );

      const remainingEntries = await db.hofEntry.findMany({
        where: { memberId: user.id, hofId: testData.hofs.bwbHof.id },
        orderBy: { year: { displayOrder: "asc" } },
      });

      expect(remainingEntries).toHaveLength(2);
      expect(remainingEntries[0].totalPeaks).toBe(50); // cumulative domestic
      expect(remainingEntries[0].foreignPeaks).toBe(10); // cumulative foreign
      expect(remainingEntries[1].totalPeaks).toBe(80); // 50 + 30
      expect(remainingEntries[1].foreignPeaks).toBe(10); // 10 + 0
    });

    it("should handle entries with zero values", async () => {
      const user = await createCompleteUser(db, testData);

      await createHofEntries(db, user.id, testData.hofs.bwbHof.id, [
        { yearId: testData.years.year2023.id, peaksInYear: 0, foreignPeaks: 0 },
        {
          yearId: testData.years.year2024.id,
          peaksInYear: 50,
          foreignPeaks: 10,
        },
      ]);

      await recalculateTotalsForUserAndHof(
        user.id,
        testData.hofs.bwbHof.id,
        db
      );

      const entries = await db.hofEntry.findMany({
        where: { memberId: user.id, hofId: testData.hofs.bwbHof.id },
        orderBy: { year: { displayOrder: "asc" } },
      });

      expect(entries[0].totalPeaks).toBe(0);
      expect(entries[1].totalPeaks).toBe(50); // cumulative domestic only
    });

    it("should handle multiple users independently", async () => {
      const user1 = await createCompleteUser(db, testData, {
        username: "user1",
      });
      const user2 = await createCompleteUser(db, testData, {
        username: "user2",
      });

      await createHofEntries(db, user1.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2023.id,
          peaksInYear: 50,
          foreignPeaks: 10,
        },
      ]);

      await createHofEntries(db, user2.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2023.id,
          peaksInYear: 100,
          foreignPeaks: 20,
        },
      ]);

      await recalculateTotalsForUserAndHof(
        user1.id,
        testData.hofs.bwbHof.id,
        db
      );
      await recalculateTotalsForUserAndHof(
        user2.id,
        testData.hofs.bwbHof.id,
        db
      );

      const user1Entries = await db.hofEntry.findMany({
        where: { memberId: user1.id, hofId: testData.hofs.bwbHof.id },
      });
      const user2Entries = await db.hofEntry.findMany({
        where: { memberId: user2.id, hofId: testData.hofs.bwbHof.id },
      });

      expect(user1Entries[0].totalPeaks).toBe(50); // cumulative domestic only
      expect(user1Entries[0].foreignPeaks).toBe(10); // cumulative foreign
      expect(user2Entries[0].totalPeaks).toBe(100); // cumulative domestic only
      expect(user2Entries[0].foreignPeaks).toBe(20); // cumulative foreign
    });
  });

  describe("HOF Year Configuration", () => {
    it("should create HOF year config with basic settings", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id,
        {
          minPeaks: 50,
          minForeignPeaks: 5,
          minFpr: 0.1,
          minimumAge: 18,
          lceEnabled: true,
          lceMinFpr: 0.15,
        }
      );

      expect(config.minPeaks).toBe(50);
      expect(config.minForeignPeaks).toBe(5);
      expect(config.lceEnabled).toBe(true);
    });

    it("should create HOF year config with award tiers", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.p600Hof.id,
        testData.years.year2024.id,
        { minPeaks: 30 },
        [
          { name: "Bronze", minPeaks: 30, maxPeaks: 99, displayOrder: 1 },
          { name: "Silver", minPeaks: 100, maxPeaks: 199, displayOrder: 2 },
          { name: "Gold", minPeaks: 200, maxPeaks: null, displayOrder: 3 },
        ]
      );

      const tiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
        orderBy: { displayOrder: "asc" },
      });

      expect(tiers).toHaveLength(3);
      expect(tiers[0].name).toBe("Bronze");
      expect(tiers[1].name).toBe("Silver");
      expect(tiers[2].name).toBe("Gold");
      expect(tiers[2].maxPeaks).toBeNull();
    });

    it("should create LCE country configurations", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2025.id,
        { lceEnabled: true, lceMinFpr: 0.2 }
      );

      await db.countryLceConfig.createMany({
        data: [
          {
            hofYearConfigId: config.id,
            countryId: testData.countries.uk.id,
            hasLce: true,
          },
          {
            hofYearConfigId: config.id,
            countryId: testData.countries.france.id,
            hasLce: true,
          },
          {
            hofYearConfigId: config.id,
            countryId: testData.countries.usa.id,
            hasLce: false,
          },
        ],
      });

      const lceConfigs = await db.countryLceConfig.findMany({
        where: { hofYearConfigId: config.id },
        include: { country: true },
      });

      expect(lceConfigs).toHaveLength(3);
      const ukConfig = lceConfigs.find((c) => c.country.code === "GB");
      const usaConfig = lceConfigs.find((c) => c.country.code === "US");

      expect(ukConfig?.hasLce).toBe(true);
      expect(usaConfig?.hasLce).toBe(false);
    });

    it("should prevent duplicate HOF year config", async () => {
      await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id
      );

      await expect(
        createHofYearConfig(
          db,
          testData.hofs.bwbHof.id,
          testData.years.year2023.id
        )
      ).rejects.toThrow();
    });

    it("should cascade delete award tiers when config is deleted", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.p600Hof.id,
        testData.years.year2023.id,
        {},
        [
          { name: "Bronze", minPeaks: 30, maxPeaks: 99, displayOrder: 1 },
          { name: "Silver", minPeaks: 100, maxPeaks: 199, displayOrder: 2 },
        ]
      );

      let tiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
      });
      expect(tiers).toHaveLength(2);

      // Delete config
      await db.hofYearConfig.delete({ where: { id: config.id } });

      // Verify tiers were cascade deleted
      tiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
      });
      expect(tiers).toHaveLength(0);
    });
  });

  describe("Entry Qualification Logic", () => {
    it("should identify users who qualify based on min peaks", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id,
        { minPeaks: 50 }
      );

      const user1 = await createCompleteUser(db, testData, {
        username: "qualifies",
      });
      const user2 = await createCompleteUser(db, testData, {
        username: "doesnotqualify",
      });

      await createHofEntries(db, user1.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2023.id,
          peaksInYear: 60,
          foreignPeaks: 10,
        },
      ]);

      await createHofEntries(db, user2.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2023.id,
          peaksInYear: 30,
          foreignPeaks: 5,
        },
      ]);

      await recalculateTotalsForUserAndHof(
        user1.id,
        testData.hofs.bwbHof.id,
        db
      );
      await recalculateTotalsForUserAndHof(
        user2.id,
        testData.hofs.bwbHof.id,
        db
      );

      const qualifyingEntries = await db.hofEntry.findMany({
        where: {
          hofId: testData.hofs.bwbHof.id,
          yearId: testData.years.year2023.id,
          totalPeaks: { gte: config.minPeaks },
        },
        include: { member: true },
      });

      expect(qualifyingEntries).toHaveLength(1);
      expect(qualifyingEntries[0].member.username).toBe("qualifies");
    });

    it("should determine award tier based on total peaks", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id,
        { minPeaks: 50 },
        [
          { name: "Bronze", minPeaks: 50, maxPeaks: 99, displayOrder: 1 },
          { name: "Silver", minPeaks: 100, maxPeaks: 199, displayOrder: 2 },
          { name: "Gold", minPeaks: 200, maxPeaks: null, displayOrder: 3 },
        ]
      );

      const bronzeUser = await createCompleteUser(db, testData, {
        username: "bronze",
      });
      const silverUser = await createCompleteUser(db, testData, {
        username: "silver",
      });
      const goldUser = await createCompleteUser(db, testData, {
        username: "gold",
      });

      await createHofEntries(db, bronzeUser.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2024.id,
          peaksInYear: 70,
          foreignPeaks: 10,
        },
      ]);
      await createHofEntries(db, silverUser.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2024.id,
          peaksInYear: 140,
          foreignPeaks: 20,
        },
      ]);
      await createHofEntries(db, goldUser.id, testData.hofs.bwbHof.id, [
        {
          yearId: testData.years.year2024.id,
          peaksInYear: 220,
          foreignPeaks: 30,
        },
      ]);

      await recalculateTotalsForUserAndHof(
        bronzeUser.id,
        testData.hofs.bwbHof.id,
        db
      );
      await recalculateTotalsForUserAndHof(
        silverUser.id,
        testData.hofs.bwbHof.id,
        db
      );
      await recalculateTotalsForUserAndHof(
        goldUser.id,
        testData.hofs.bwbHof.id,
        db
      );

      const tiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
        orderBy: { displayOrder: "asc" },
      });

      const bronzeEntry = await db.hofEntry.findFirst({
        where: { memberId: bronzeUser.id, yearId: testData.years.year2024.id },
      });
      const silverEntry = await db.hofEntry.findFirst({
        where: { memberId: silverUser.id, yearId: testData.years.year2024.id },
      });
      const goldEntry = await db.hofEntry.findFirst({
        where: { memberId: goldUser.id, yearId: testData.years.year2024.id },
      });

      // Determine tiers
      const bronzeTier = tiers.find(
        (t) =>
          bronzeEntry!.totalPeaks >= t.minPeaks &&
          (t.maxPeaks === null || bronzeEntry!.totalPeaks <= t.maxPeaks)
      );
      const silverTier = tiers.find(
        (t) =>
          silverEntry!.totalPeaks >= t.minPeaks &&
          (t.maxPeaks === null || silverEntry!.totalPeaks <= t.maxPeaks)
      );
      const goldTier = tiers.find(
        (t) =>
          goldEntry!.totalPeaks >= t.minPeaks &&
          (t.maxPeaks === null || goldEntry!.totalPeaks <= t.maxPeaks)
      );

      expect(bronzeTier?.name).toBe("Bronze");
      expect(silverTier?.name).toBe("Silver");
      expect(goldTier?.name).toBe("Gold");
    });
  });
});
