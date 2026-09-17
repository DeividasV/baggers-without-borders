/**
 * Integration Test: HOF Configuration Workflows
 *
 * Tests complete HOF configuration scenarios including:
 * - HOF year config creation with validation
 * - Award tier management
 * - LCE configuration and country mappings
 * - Config updates and cascading effects
 */

import { getTestDb, cleanTestDb } from "../utils/test-db-setup";
import {
  createBaseTestData,
  createHofYearConfig,
  TestDataContext,
} from "../utils/test-data-factory";

describe("Integration: HOF Configuration Management", () => {
  let db: ReturnType<typeof getTestDb>;
  let testData: TestDataContext;

  beforeAll(async () => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
    testData = await createBaseTestData(db);
  });

  describe("HOF Year Config Creation and Validation", () => {
    it("should create config with all qualification rules", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id,
        {
          minPeaks: 50,
          minForeignPeaks: 5,
          minFpr: 0.1,
          minimumAge: 18,
          notes: "Test qualification rules",
        }
      );

      expect(config.minPeaks).toBe(50);
      expect(config.minForeignPeaks).toBe(5);
      expect(config.minFpr).toBe(0.1);
      expect(config.minimumAge).toBe(18);
      expect(config.notes).toBe("Test qualification rules");
    });

    it("should prevent duplicate HOF-Year config combinations", async () => {
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

    it("should allow same HOF across different years", async () => {
      const config2023 = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id,
        { minPeaks: 50 }
      );

      const config2024 = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id,
        { minPeaks: 60 }
      );

      expect(config2023.hofId).toBe(config2024.hofId);
      expect(config2023.yearId).not.toBe(config2024.yearId);
      expect(config2023.minPeaks).toBe(50);
      expect(config2024.minPeaks).toBe(60);
    });

    it("should allow same year across different HOFs", async () => {
      const bwbConfig = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id,
        { minPeaks: 50 }
      );

      const p600Config = await createHofYearConfig(
        db,
        testData.hofs.p600Hof.id,
        testData.years.year2023.id,
        { minPeaks: 30 }
      );

      expect(bwbConfig.yearId).toBe(p600Config.yearId);
      expect(bwbConfig.hofId).not.toBe(p600Config.hofId);
      expect(bwbConfig.minPeaks).toBe(50);
      expect(p600Config.minPeaks).toBe(30);
    });

    it("should create config with default values when optional fields omitted", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id
      );

      expect(config.minPeaks).toBe(0);
      expect(config.minForeignPeaks).toBe(0);
      expect(config.minFpr).toBe(0);
      expect(config.minimumAge).toBe(0);
      expect(config.lceEnabled).toBe(false);
      expect(config.lceMinFpr).toBeNull();
    });

    it("should update config qualification rules", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id,
        { minPeaks: 50 }
      );

      const updated = await db.hofYearConfig.update({
        where: { id: config.id },
        data: {
          minPeaks: 75,
          minForeignPeaks: 10,
          minFpr: 0.15,
        },
      });

      expect(updated.minPeaks).toBe(75);
      expect(updated.minForeignPeaks).toBe(10);
      expect(updated.minFpr).toBe(0.15);
    });
  });

  describe("Award Tier Management", () => {
    it("should create multiple award tiers with correct ordering", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id,
        { minPeaks: 50 },
        [
          { name: "Bronze", minPeaks: 50, maxPeaks: 99, displayOrder: 1 },
          { name: "Silver", minPeaks: 100, maxPeaks: 199, displayOrder: 2 },
          { name: "Gold", minPeaks: 200, maxPeaks: 299, displayOrder: 3 },
          { name: "Platinum", minPeaks: 300, maxPeaks: null, displayOrder: 4 },
        ]
      );

      const tiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
        orderBy: { displayOrder: "asc" },
      });

      expect(tiers).toHaveLength(4);
      expect(tiers[0].name).toBe("Bronze");
      expect(tiers[1].name).toBe("Silver");
      expect(tiers[2].name).toBe("Gold");
      expect(tiers[3].name).toBe("Platinum");
      expect(tiers[3].maxPeaks).toBeNull();
    });

    it("should validate tier peak ranges do not overlap", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id,
        { minPeaks: 50 },
        [
          { name: "Bronze", minPeaks: 50, maxPeaks: 99, displayOrder: 1 },
          { name: "Silver", minPeaks: 100, maxPeaks: 199, displayOrder: 2 },
        ]
      );

      const tiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
        orderBy: { minPeaks: "asc" },
      });

      // Verify no gaps or overlaps
      for (let i = 0; i < tiers.length - 1; i++) {
        const currentMax = tiers[i].maxPeaks;
        const nextMin = tiers[i + 1].minPeaks;

        if (currentMax !== null) {
          expect(nextMin).toBe(currentMax + 1);
        }
      }
    });

    it("should add award tier to existing config", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id,
        { minPeaks: 50 },
        [
          { name: "Bronze", minPeaks: 50, maxPeaks: 99, displayOrder: 1 },
          { name: "Silver", minPeaks: 100, maxPeaks: 199, displayOrder: 2 },
        ]
      );

      // Add Gold tier
      await db.awardTier.create({
        data: {
          hofYearConfigId: config.id,
          name: "Gold",
          minPeaks: 200,
          maxPeaks: null,
          displayOrder: 3,
        },
      });

      const tiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
        orderBy: { displayOrder: "asc" },
      });

      expect(tiers).toHaveLength(3);
      expect(tiers[2].name).toBe("Gold");
    });

    it("should update award tier properties", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id,
        { minPeaks: 50 },
        [{ name: "Bronze", minPeaks: 50, maxPeaks: 99, displayOrder: 1 }]
      );

      const tier = await db.awardTier.findFirst({
        where: { hofYearConfigId: config.id },
      });

      const updated = await db.awardTier.update({
        where: { id: tier!.id },
        data: {
          name: "Entry Level",
          minPeaks: 40,
          maxPeaks: 79,
        },
      });

      expect(updated.name).toBe("Entry Level");
      expect(updated.minPeaks).toBe(40);
      expect(updated.maxPeaks).toBe(79);
    });

    it("should delete award tier", async () => {
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

      const silverTier = await db.awardTier.findFirst({
        where: { hofYearConfigId: config.id, name: "Silver" },
      });

      await db.awardTier.delete({
        where: { id: silverTier!.id },
      });

      const remainingTiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
      });

      expect(remainingTiers).toHaveLength(2);
      expect(remainingTiers.find((t) => t.name === "Silver")).toBeUndefined();
    });

    it("should cascade delete award tiers when config is deleted", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id,
        { minPeaks: 50 },
        [
          { name: "Bronze", minPeaks: 50, maxPeaks: 99, displayOrder: 1 },
          { name: "Silver", minPeaks: 100, maxPeaks: 199, displayOrder: 2 },
        ]
      );

      let tiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
      });
      expect(tiers).toHaveLength(2);

      await db.hofYearConfig.delete({ where: { id: config.id } });

      tiers = await db.awardTier.findMany({
        where: { hofYearConfigId: config.id },
      });
      expect(tiers).toHaveLength(0);
    });
  });

  describe("LCE Configuration", () => {
    it("should enable LCE with minimum FPR requirement", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id,
        {
          lceEnabled: true,
          lceMinFpr: 0.2,
        }
      );

      expect(config.lceEnabled).toBe(true);
      expect(config.lceMinFpr).toBe(0.2);
    });

    it("should create LCE country mappings", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2025.id,
        { lceEnabled: true, lceMinFpr: 0.15 }
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

      const ukLce = lceConfigs.find((c) => c.country.code === "GB");
      const franceLce = lceConfigs.find((c) => c.country.code === "FR");
      const usaLce = lceConfigs.find((c) => c.country.code === "US");

      expect(ukLce?.hasLce).toBe(true);
      expect(franceLce?.hasLce).toBe(true);
      expect(usaLce?.hasLce).toBe(false);
    });

    it("should update LCE country status", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2025.id,
        { lceEnabled: true, lceMinFpr: 0.15 }
      );

      const lceConfig = await db.countryLceConfig.create({
        data: {
          hofYearConfigId: config.id,
          countryId: testData.countries.uk.id,
          hasLce: false,
        },
      });

      // Update to enable LCE
      const updated = await db.countryLceConfig.update({
        where: { id: lceConfig.id },
        data: { hasLce: true },
      });

      expect(updated.hasLce).toBe(true);
    });

    it("should prevent duplicate country LCE configs", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2025.id,
        { lceEnabled: true }
      );

      await db.countryLceConfig.create({
        data: {
          hofYearConfigId: config.id,
          countryId: testData.countries.uk.id,
          hasLce: true,
        },
      });

      await expect(
        db.countryLceConfig.create({
          data: {
            hofYearConfigId: config.id,
            countryId: testData.countries.uk.id,
            hasLce: false,
          },
        })
      ).rejects.toThrow();
    });

    it("should cascade delete LCE configs when HOF year config is deleted", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2025.id,
        { lceEnabled: true }
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
        ],
      });

      let lceConfigs = await db.countryLceConfig.findMany({
        where: { hofYearConfigId: config.id },
      });
      expect(lceConfigs).toHaveLength(2);

      await db.hofYearConfig.delete({ where: { id: config.id } });

      lceConfigs = await db.countryLceConfig.findMany({
        where: { hofYearConfigId: config.id },
      });
      expect(lceConfigs).toHaveLength(0);
    });

    it("should toggle LCE enabled status", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2025.id,
        { lceEnabled: false }
      );

      expect(config.lceEnabled).toBe(false);

      const updated = await db.hofYearConfig.update({
        where: { id: config.id },
        data: { lceEnabled: true, lceMinFpr: 0.15 },
      });

      expect(updated.lceEnabled).toBe(true);
      expect(updated.lceMinFpr).toBe(0.15);
    });
  });

  describe("Complex Configuration Scenarios", () => {
    it("should create complete config with all features", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id,
        {
          minPeaks: 50,
          minForeignPeaks: 5,
          minFpr: 0.1,
          minimumAge: 18,
          lceEnabled: true,
          lceMinFpr: 0.2,
          notes: "Complete configuration test",
        },
        [
          { name: "Bronze", minPeaks: 50, maxPeaks: 99, displayOrder: 1 },
          { name: "Silver", minPeaks: 100, maxPeaks: 199, displayOrder: 2 },
          { name: "Gold", minPeaks: 200, maxPeaks: null, displayOrder: 3 },
        ]
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
        ],
      });

      // Retrieve complete config with all relations
      const fullConfig = await db.hofYearConfig.findUnique({
        where: { id: config.id },
        include: {
          hof: true,
          year: true,
          awardTiers: { orderBy: { displayOrder: "asc" } },
          lceCountries: { include: { country: true } },
        },
      });

      expect(fullConfig?.minPeaks).toBe(50);
      expect(fullConfig?.lceEnabled).toBe(true);
      expect(fullConfig?.awardTiers).toHaveLength(3);
      expect(fullConfig?.lceCountries).toHaveLength(2);
    });

    it("should retrieve configs filtered by HOF", async () => {
      await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id
      );
      await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id
      );
      await createHofYearConfig(
        db,
        testData.hofs.p600Hof.id,
        testData.years.year2023.id
      );

      const bwbConfigs = await db.hofYearConfig.findMany({
        where: { hofId: testData.hofs.bwbHof.id },
      });

      expect(bwbConfigs).toHaveLength(2);
      expect(bwbConfigs.every((c) => c.hofId === testData.hofs.bwbHof.id)).toBe(
        true
      );
    });

    it("should retrieve configs filtered by year", async () => {
      await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2023.id
      );
      await createHofYearConfig(
        db,
        testData.hofs.p600Hof.id,
        testData.years.year2023.id
      );
      await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id
      );

      const year2023Configs = await db.hofYearConfig.findMany({
        where: { yearId: testData.years.year2023.id },
      });

      expect(year2023Configs).toHaveLength(2);
      expect(
        year2023Configs.every((c) => c.yearId === testData.years.year2023.id)
      ).toBe(true);
    });

    it("should handle config deletion with all cascading relationships", async () => {
      const config = await createHofYearConfig(
        db,
        testData.hofs.bwbHof.id,
        testData.years.year2024.id,
        { lceEnabled: true },
        [
          { name: "Bronze", minPeaks: 50, maxPeaks: 99, displayOrder: 1 },
          { name: "Silver", minPeaks: 100, maxPeaks: 199, displayOrder: 2 },
        ]
      );

      await db.countryLceConfig.create({
        data: {
          hofYearConfigId: config.id,
          countryId: testData.countries.uk.id,
          hasLce: true,
        },
      });

      // Verify all relationships exist
      const tierCount = await db.awardTier.count({
        where: { hofYearConfigId: config.id },
      });
      const lceCount = await db.countryLceConfig.count({
        where: { hofYearConfigId: config.id },
      });

      expect(tierCount).toBe(2);
      expect(lceCount).toBe(1);

      // Delete config
      await db.hofYearConfig.delete({ where: { id: config.id } });

      // Verify cascade deletion
      const tierCountAfter = await db.awardTier.count({
        where: { hofYearConfigId: config.id },
      });
      const lceCountAfter = await db.countryLceConfig.count({
        where: { hofYearConfigId: config.id },
      });

      expect(tierCountAfter).toBe(0);
      expect(lceCountAfter).toBe(0);
    });
  });

  describe("Hofmeister Assignment Workflow", () => {
    it("should assign hofmeister to config and reflect in all queries", async () => {
      // Create a verified user to be hofmeister
      const hofmeister = await db.user.create({
        data: {
          username: "hofmeister1",
          email: "hofmeister@test.com",
          password: "hashed_password",
          displayName: "Test Hofmeister",
          givenName: "Test",
          familyName: "Hofmeister",
          role: "USER",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });

      // Create config with hofmeister
      const config = await db.hofYearConfig.create({
        data: {
          hofId: testData.hofs.bwbHof.id,
          yearId: testData.years.year2023.id,
          hofmeisterId: hofmeister.id,
          minPeaks: 50,
          minPeaksEnabled: true,
          minForeignPeaks: 5,
          minForeignPeaksEnabled: true,
          minFpr: 0.1,
          minFprEnabled: true,
          minimumAge: 18,
          minimumAgeEnabled: true,
          lceEnabled: false,
        },
      });

      // Verify assignment
      expect(config.hofmeisterId).toBe(hofmeister.id);

      // Query with relation
      const configWithRelation = await db.hofYearConfig.findUnique({
        where: { id: config.id },
        include: {
          hofmeister: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
        },
      });

      expect(configWithRelation?.hofmeister?.id).toBe(hofmeister.id);
      expect(configWithRelation?.hofmeister?.displayName).toBe(
        "Test Hofmeister"
      );
      expect(configWithRelation?.hofmeister?.username).toBe("hofmeister1");

      // Verify user can see their managed configs
      const userWithConfigs = await db.user.findUnique({
        where: { id: hofmeister.id },
        include: {
          managedYearConfigs: true,
        },
      });

      expect(userWithConfigs?.managedYearConfigs).toHaveLength(1);
      expect(userWithConfigs?.managedYearConfigs[0].id).toBe(config.id);
    });

    it("should update hofmeister assignment", async () => {
      const hofmeister1 = await db.user.create({
        data: {
          username: "hofmeister1",
          email: "hofmeister1@test.com",
          password: "hashed_password",
          displayName: "First Hofmeister",
          role: "USER",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });

      const hofmeister2 = await db.user.create({
        data: {
          username: "hofmeister2",
          email: "hofmeister2@test.com",
          password: "hashed_password",
          displayName: "Second Hofmeister",
          role: "USER",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });

      // Create config with first hofmeister
      const config = await db.hofYearConfig.create({
        data: {
          hofId: testData.hofs.bwbHof.id,
          yearId: testData.years.year2023.id,
          hofmeisterId: hofmeister1.id,
          minPeaks: 50,
          minPeaksEnabled: true,
          minForeignPeaks: 5,
          minForeignPeaksEnabled: true,
          minFpr: 0.1,
          minFprEnabled: true,
          minimumAge: 18,
          minimumAgeEnabled: true,
          lceEnabled: false,
        },
      });

      expect(config.hofmeisterId).toBe(hofmeister1.id);

      // Update to second hofmeister
      const updated = await db.hofYearConfig.update({
        where: { id: config.id },
        data: {
          hofmeisterId: hofmeister2.id,
        },
        include: {
          hofmeister: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      expect(updated.hofmeisterId).toBe(hofmeister2.id);
      expect(updated.hofmeister?.displayName).toBe("Second Hofmeister");

      // Verify first user no longer has config
      const user1Configs = await db.user.findUnique({
        where: { id: hofmeister1.id },
        include: { managedYearConfigs: true },
      });
      expect(user1Configs?.managedYearConfigs).toHaveLength(0);

      // Verify second user now has config
      const user2Configs = await db.user.findUnique({
        where: { id: hofmeister2.id },
        include: { managedYearConfigs: true },
      });
      expect(user2Configs?.managedYearConfigs).toHaveLength(1);
    });

    it("should remove hofmeister assignment", async () => {
      const hofmeister = await db.user.create({
        data: {
          username: "hofmeister1",
          email: "hofmeister1@test.com",
          password: "hashed_password",
          displayName: "Test Hofmeister",
          role: "USER",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });

      const config = await db.hofYearConfig.create({
        data: {
          hofId: testData.hofs.bwbHof.id,
          yearId: testData.years.year2023.id,
          hofmeisterId: hofmeister.id,
          minPeaks: 50,
          minPeaksEnabled: true,
          minForeignPeaks: 5,
          minForeignPeaksEnabled: true,
          minFpr: 0.1,
          minFprEnabled: true,
          minimumAge: 18,
          minimumAgeEnabled: true,
          lceEnabled: false,
        },
      });

      // Remove hofmeister
      const updated = await db.hofYearConfig.update({
        where: { id: config.id },
        data: {
          hofmeisterId: null,
        },
      });

      expect(updated.hofmeisterId).toBeNull();

      // Verify user no longer has config
      const userConfigs = await db.user.findUnique({
        where: { id: hofmeister.id },
        include: { managedYearConfigs: true },
      });
      expect(userConfigs?.managedYearConfigs).toHaveLength(0);
    });

    it("should prevent deletion of user assigned as hofmeister", async () => {
      const hofmeister = await db.user.create({
        data: {
          username: "hofmeister1",
          email: "hofmeister1@test.com",
          password: "hashed_password",
          displayName: "Test Hofmeister",
          role: "USER",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });

      await db.hofYearConfig.create({
        data: {
          hofId: testData.hofs.bwbHof.id,
          yearId: testData.years.year2023.id,
          hofmeisterId: hofmeister.id,
          minPeaks: 50,
          minPeaksEnabled: true,
          minForeignPeaks: 5,
          minForeignPeaksEnabled: true,
          minFpr: 0.1,
          minFprEnabled: true,
          minimumAge: 18,
          minimumAgeEnabled: true,
          lceEnabled: false,
        },
      });

      // Attempt to delete user should fail due to onDelete: Restrict
      await expect(
        db.user.delete({
          where: { id: hofmeister.id },
        })
      ).rejects.toThrow();
    });

    it("should allow config without hofmeister (optional field)", async () => {
      const config = await db.hofYearConfig.create({
        data: {
          hofId: testData.hofs.bwbHof.id,
          yearId: testData.years.year2023.id,
          hofmeisterId: null,
          minPeaks: 50,
          minPeaksEnabled: true,
          minForeignPeaks: 5,
          minForeignPeaksEnabled: true,
          minFpr: 0.1,
          minFprEnabled: true,
          minimumAge: 18,
          minimumAgeEnabled: true,
          lceEnabled: false,
        },
      });

      expect(config.hofmeisterId).toBeNull();

      const configWithRelation = await db.hofYearConfig.findUnique({
        where: { id: config.id },
        include: { hofmeister: true },
      });

      expect(configWithRelation?.hofmeister).toBeNull();
    });

    it("should handle multiple configs for one hofmeister", async () => {
      const hofmeister = await db.user.create({
        data: {
          username: "hofmeister1",
          email: "hofmeister1@test.com",
          password: "hashed_password",
          displayName: "Multi-Config Hofmeister",
          role: "USER",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });

      // Create multiple configs for same hofmeister
      const config1 = await db.hofYearConfig.create({
        data: {
          hofId: testData.hofs.bwbHof.id,
          yearId: testData.years.year2023.id,
          hofmeisterId: hofmeister.id,
          minPeaks: 50,
          minPeaksEnabled: true,
          minForeignPeaks: 5,
          minForeignPeaksEnabled: true,
          minFpr: 0.1,
          minFprEnabled: true,
          minimumAge: 18,
          minimumAgeEnabled: true,
          lceEnabled: false,
        },
      });

      const config2 = await db.hofYearConfig.create({
        data: {
          hofId: testData.hofs.p600Hof.id,
          yearId: testData.years.year2023.id,
          hofmeisterId: hofmeister.id,
          minPeaks: 30,
          minPeaksEnabled: true,
          minForeignPeaks: 3,
          minForeignPeaksEnabled: true,
          minFpr: 0.05,
          minFprEnabled: true,
          minimumAge: 18,
          minimumAgeEnabled: true,
          lceEnabled: false,
        },
      });

      // Verify user manages both configs
      const userWithConfigs = await db.user.findUnique({
        where: { id: hofmeister.id },
        include: {
          managedYearConfigs: {
            include: {
              hof: { select: { code: true } },
              year: { select: { code: true } },
            },
          },
        },
      });

      expect(userWithConfigs?.managedYearConfigs).toHaveLength(2);
      const configIds = userWithConfigs?.managedYearConfigs.map((c) => c.id);
      expect(configIds).toContain(config1.id);
      expect(configIds).toContain(config2.id);
    });
  });
});
