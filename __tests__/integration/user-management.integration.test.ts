/**
 * Integration Test: User Management Workflows
 *
 * Tests complete user management scenarios including:
 * - User creation and profile updates
 * - Participation management
 * - Data integrity across relationships
 */

import { getTestDb, cleanTestDb } from "../utils/test-db-setup";
import {
  createBaseTestData,
  createTestUser,
  createTestAdmin,
  createCompleteUser,
  createUserHofParticipations,
  createUserYearParticipations,
  TestDataContext,
} from "../utils/test-data-factory";
import bcrypt from "bcryptjs";

describe("Integration: User Management", () => {
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

  describe("User Creation and Profile Management", () => {
    it("should create a new user with basic profile information", async () => {
      const user = await createTestUser(db, {
        username: "newclimber",
        displayName: "New Climber",
        email: "newclimber@example.com",
        residenceCountryId: testData.countries.uk.id,
        birthCountryId: testData.countries.uk.id,
      });

      expect(user.id).toBeDefined();
      expect(user.username).toBe("newclimber");
      expect(user.email).toBe("newclimber@example.com");
      expect(user.status).toBe("ACTIVE");
      expect(user.role).toBe("USER");

      // Verify password is hashed
      expect(user.password).not.toBe("change-me-1234");
      const isPasswordValid = await bcrypt.compare("change-me-1234", user.password);
      expect(isPasswordValid).toBe(true);
    });

    it("should create an admin user with elevated privileges", async () => {
      const admin = await createTestAdmin(db, {
        username: "testadmin",
        displayName: "Test Administrator",
      });

      expect(admin.role).toBe("ADMIN");
      expect(admin.status).toBe("ACTIVE");
    });

    it("should update user profile information", async () => {
      const user = await createTestUser(db);

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          displayName: "Updated Name",
          givenName: "John",
          familyName: "Doe",
          birthYear: 1990,
          gender: "M",
        },
      });

      expect(updatedUser.displayName).toBe("Updated Name");
      expect(updatedUser.givenName).toBe("John");
      expect(updatedUser.familyName).toBe("Doe");
      expect(updatedUser.birthYear).toBe(1990);
    });

    it("should update user country and region", async () => {
      const user = await createTestUser(db);

      // Create region for UK
      const region = await db.region.create({
        data: {
          countryId: testData.countries.uk.id,
          code: "SCT",
          name: "Scotland",
          type: "region",
        },
      });

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          residenceCountryId: testData.countries.uk.id,
          residenceRegionId: region.id,
        },
      });

      // Verify with relations
      const userWithRelations = await db.user.findUnique({
        where: { id: updatedUser.id },
        include: {
          residenceCountry: true,
          residenceRegion: true,
        },
      });

      expect(userWithRelations?.residenceCountry?.name).toBe("United Kingdom");
      expect(userWithRelations?.residenceRegion?.name).toBe("Scotland");
    });

    it("should prevent duplicate usernames", async () => {
      await createTestUser(db, { username: "uniqueuser" });

      await expect(createTestUser(db, { username: "uniqueuser" })).rejects.toThrow();
    });

    it("should prevent duplicate emails", async () => {
      await createTestUser(db, { email: "unique@example.com" });

      await expect(createTestUser(db, { email: "unique@example.com" })).rejects.toThrow();
    });
  });

  describe("User Participation Management", () => {
    it("should create HOF participations for a user", async () => {
      const user = await createTestUser(db);

      await createUserHofParticipations(db, user.id, [
        testData.hofs.bwbHof.id,
        testData.hofs.p600Hof.id,
      ]);

      const participations = await db.userHofParticipation.findMany({
        where: { userId: user.id },
        include: { hof: true },
      });

      expect(participations).toHaveLength(2);
      expect(participations.map((p) => p.hof.code)).toContain("BWB");
      expect(participations.map((p) => p.hof.code)).toContain("P600");
      expect(participations.every((p) => p.enabled)).toBe(true);
    });

    it("should create year participations for a user", async () => {
      const user = await createTestUser(db);

      await createUserYearParticipations(db, user.id, [
        testData.years.year2023.id,
        testData.years.year2024.id,
        testData.years.year2025.id,
      ]);

      const participations = await db.userYearParticipation.findMany({
        where: { userId: user.id },
        include: { year: true },
      });

      expect(participations).toHaveLength(3);
      expect(participations.map((p) => p.year.code)).toContain("2023");
      expect(participations.map((p) => p.year.code)).toContain("2024");
      expect(participations.map((p) => p.year.code)).toContain("2025");
    });

    it("should toggle HOF participation on and off", async () => {
      const user = await createTestUser(db);
      await createUserHofParticipations(db, user.id, [testData.hofs.bwbHof.id]);

      // Disable participation
      await db.userHofParticipation.update({
        where: {
          userId_hofId: {
            userId: user.id,
            hofId: testData.hofs.bwbHof.id,
          },
        },
        data: { enabled: false },
      });

      let participation = await db.userHofParticipation.findUnique({
        where: {
          userId_hofId: {
            userId: user.id,
            hofId: testData.hofs.bwbHof.id,
          },
        },
      });
      expect(participation?.enabled).toBe(false);

      // Re-enable participation
      await db.userHofParticipation.update({
        where: {
          userId_hofId: {
            userId: user.id,
            hofId: testData.hofs.bwbHof.id,
          },
        },
        data: { enabled: true },
      });

      participation = await db.userHofParticipation.findUnique({
        where: {
          userId_hofId: {
            userId: user.id,
            hofId: testData.hofs.bwbHof.id,
          },
        },
      });
      expect(participation?.enabled).toBe(true);
    });

    it("should set dataNotProvided flag for year participation", async () => {
      const user = await createTestUser(db);
      await createUserYearParticipations(db, user.id, [testData.years.year2023.id]);

      await db.userYearParticipation.update({
        where: {
          userId_yearId: {
            userId: user.id,
            yearId: testData.years.year2023.id,
          },
        },
        data: { dataNotProvided: true },
      });

      const participation = await db.userYearParticipation.findUnique({
        where: {
          userId_yearId: {
            userId: user.id,
            yearId: testData.years.year2023.id,
          },
        },
      });

      expect(participation?.dataNotProvided).toBe(true);
    });

    it("should override country for specific year participation", async () => {
      const user = await createTestUser(db, {
        residenceCountryId: testData.countries.uk.id,
      });
      await createUserYearParticipations(db, user.id, [testData.years.year2023.id]);

      // User moved to USA in 2023
      await db.userYearParticipation.update({
        where: {
          userId_yearId: {
            userId: user.id,
            yearId: testData.years.year2023.id,
          },
        },
        data: { countryId: testData.countries.usa.id },
      });

      const participation = await db.userYearParticipation.findUnique({
        where: {
          userId_yearId: {
            userId: user.id,
            yearId: testData.years.year2023.id,
          },
        },
        include: { country: true },
      });

      expect(participation?.country?.name).toBe("United States");
    });
  });

  describe("Complete User Setup", () => {
    it("should create a complete user with all participations", async () => {
      const user = await createCompleteUser(db, testData, {
        username: "fulluser",
      });

      // Verify user was created
      expect(user.id).toBeDefined();

      // Verify HOF participations
      const hofParticipations = await db.userHofParticipation.findMany({
        where: { userId: user.id },
      });
      expect(hofParticipations).toHaveLength(2);

      // Verify year participations
      const yearParticipations = await db.userYearParticipation.findMany({
        where: { userId: user.id },
      });
      expect(yearParticipations).toHaveLength(3);
    });

    it("should cascade delete user participations when user is deleted", async () => {
      const user = await createCompleteUser(db, testData);

      // Verify participations exist
      let hofParticipations = await db.userHofParticipation.findMany({
        where: { userId: user.id },
      });
      let yearParticipations = await db.userYearParticipation.findMany({
        where: { userId: user.id },
      });

      expect(hofParticipations.length).toBeGreaterThan(0);
      expect(yearParticipations.length).toBeGreaterThan(0);

      // Delete user
      await db.user.delete({ where: { id: user.id } });

      // Verify participations were cascade deleted
      hofParticipations = await db.userHofParticipation.findMany({
        where: { userId: user.id },
      });
      yearParticipations = await db.userYearParticipation.findMany({
        where: { userId: user.id },
      });

      expect(hofParticipations).toHaveLength(0);
      expect(yearParticipations).toHaveLength(0);
    });
  });

  describe("User Query Performance", () => {
    it("should efficiently query user with all relations", async () => {
      const user = await createCompleteUser(db, testData);

      const startTime = Date.now();
      const fullUser = await db.user.findUnique({
        where: { id: user.id },
        include: {
          residenceCountry: true,
          birthCountry: true,
          hofParticipations: {
            include: { hof: true },
          },
          yearParticipations: {
            include: { year: true },
          },
        },
      });
      const queryTime = Date.now() - startTime;

      expect(fullUser).toBeDefined();
      expect(fullUser?.hofParticipations).toHaveLength(2);
      expect(fullUser?.yearParticipations).toHaveLength(3);
      expect(queryTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it("should efficiently query multiple users with participations", async () => {
      // Create 10 users
      const users = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          createCompleteUser(db, testData, { username: `bulkuser${i}` })
        )
      );

      const startTime = Date.now();
      const allUsers = await db.user.findMany({
        where: {
          id: { in: users.map((u) => u.id) },
        },
        include: {
          hofParticipations: { include: { hof: true } },
          yearParticipations: { include: { year: true } },
        },
      });
      const queryTime = Date.now() - startTime;

      expect(allUsers).toHaveLength(10);
      expect(queryTime).toBeLessThan(200); // Should complete in under 200ms
    });
  });
});
