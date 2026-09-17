/**
 * Integration Test: User Deletion - HoF Meister Protection
 *
 * Tests the protection mechanism that prevents deletion of users
 * who are assigned as HoF Meister in any HoF year configuration.
 */

import { getTestDb, cleanTestDb } from "../utils/test-db-setup";
import { hash } from "bcryptjs";

describe("Integration: User Deletion - HoF Meister Protection", () => {
  let db: ReturnType<typeof getTestDb>;
  let adminUser: any;
  let hofMeisterUser: any;
  let regularUser: any;
  let hof: any;
  let year: any;
  let hofYearConfig: any;

  beforeAll(async () => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();

    // Create admin user for making delete requests
    const hashedPassword = await hash("admin123", 10);
    adminUser = await db.user.create({
      data: {
        username: "admin-test",
        email: "admin@test.com",
        password: hashedPassword,
        displayName: "Admin User",
        role: "ADMIN",
        emailVerified: new Date(),
        status: "ACTIVE",
      },
    });

    // Create HoF Meister user
    hofMeisterUser = await db.user.create({
      data: {
        username: "hofmeister-test",
        email: "hofmeister@test.com",
        password: hashedPassword,
        displayName: "HoF Meister User",
        role: "USER",
        emailVerified: new Date(),
        status: "ACTIVE",
      },
    });

    // Create regular user
    regularUser = await db.user.create({
      data: {
        username: "regular-test",
        email: "regular@test.com",
        password: hashedPassword,
        displayName: "Regular User",
        role: "USER",
        emailVerified: new Date(),
        status: "ACTIVE",
      },
    });

    // Create HoF
    hof = await db.hallOfFame.create({
      data: {
        code: "test-hof",
        title: "Test HoF",
        description: "Test Hall of Fame",
      },
    });

    // Create Year
    year = await db.year.create({
      data: {
        code: "2025",
        title: "2025",
      },
    });

    // Create HofYearConfig with HoF Meister assigned
    hofYearConfig = await db.hofYearConfig.create({
      data: {
        hofId: hof.id,
        yearId: year.id,
        hofmeisterId: hofMeisterUser.id,
        minPeaks: 10,
        minForeignPeaks: 5,
        minFpr: 1.5,
      },
    });
  });

  it("should prevent deletion of user assigned as HoF Meister", async () => {
    // Try to delete the HoF Meister user - should fail due to onDelete: Restrict
    await expect(
      db.user.delete({
        where: { id: hofMeisterUser.id },
      })
    ).rejects.toThrow();

    // Verify user was not deleted
    const userStillExists = await db.user.findUnique({
      where: { id: hofMeisterUser.id },
    });
    expect(userStillExists).not.toBeNull();
  });

  it("should allow deletion of regular user not assigned as HoF Meister", async () => {
    // Delete regular user - should succeed
    await db.user.delete({
      where: { id: regularUser.id },
    });

    // Verify user was deleted
    const userStillExists = await db.user.findUnique({
      where: { id: regularUser.id },
    });
    expect(userStillExists).toBeNull();
  });

  it("should allow deletion after removing HoF Meister assignment", async () => {
    // First, update the config to remove HoF Meister assignment
    await db.hofYearConfig.update({
      where: { id: hofYearConfig.id },
      data: { hofmeisterId: null },
    });

    // Now deletion should succeed
    await db.user.delete({
      where: { id: hofMeisterUser.id },
    });

    // Verify user was deleted
    const userStillExists = await db.user.findUnique({
      where: { id: hofMeisterUser.id },
    });
    expect(userStillExists).toBeNull();
  });

  it("should prevent deletion when assigned to multiple HoF year configs", async () => {
    // Create another HoF and year
    const hof2 = await db.hallOfFame.create({
      data: {
        code: "another-hof",
        title: "Another HoF",
        description: "Another Hall of Fame",
      },
    });

    const year2 = await db.year.create({
      data: {
        code: "2026",
        title: "2026",
      },
    });

    // Assign same user to multiple HoF year configs
    await db.hofYearConfig.create({
      data: {
        hofId: hof2.id,
        yearId: year2.id,
        hofmeisterId: hofMeisterUser.id,
        minPeaks: 10,
        minForeignPeaks: 5,
        minFpr: 1.5,
      },
    });

    // Try to delete - should fail
    await expect(
      db.user.delete({
        where: { id: hofMeisterUser.id },
      })
    ).rejects.toThrow();

    // Verify user was not deleted
    const userStillExists = await db.user.findUnique({
      where: { id: hofMeisterUser.id },
    });
    expect(userStillExists).not.toBeNull();
  });

  it("should check for HoF Meister assignments before attempting deletion", async () => {
    // Check assignments using API logic
    const assignments = await db.hofYearConfig.findMany({
      where: { hofmeisterId: hofMeisterUser.id },
      include: {
        hof: { select: { title: true } },
        year: { select: { title: true } },
      },
    });

    expect(assignments).toHaveLength(1);
    expect(assignments[0].hof.title).toBe("Test HoF");
    expect(assignments[0].year.title).toBe("2025");
  });
});
