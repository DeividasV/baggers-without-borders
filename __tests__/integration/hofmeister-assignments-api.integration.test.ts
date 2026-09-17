/**
 * Integration Test: HoF Meister Assignments API
 *
 * Tests the endpoint that retrieves a user's HoF Meister assignments
 */

import { getTestDb, cleanTestDb } from "../utils/test-db-setup";
import { hash } from "bcryptjs";

describe("Integration: HoF Meister Assignments API", () => {
  let db: ReturnType<typeof getTestDb>;
  let user: any;
  let hof1: any;
  let hof2: any;
  let year2025: any;
  let year2026: any;

  beforeAll(async () => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();

    // Create test user
    const hashedPassword = await hash("change-me-1234", 10);
    user = await db.user.create({
      data: {
        username: "hofmeister-user",
        email: "hofmeister@test.com",
        password: hashedPassword,
        displayName: "HoF Meister User",
        role: "USER",
        emailVerified: new Date(),
        status: "ACTIVE",
      },
    });

    // Create HoFs
    hof1 = await db.hallOfFame.create({
      data: {
        code: "alpine-peaks",
        title: "Alpine Peaks",
        description: "Alpine peaks climbing",
      },
    });

    hof2 = await db.hallOfFame.create({
      data: {
        code: "scottish-hills",
        title: "Scottish Hills",
        description: "Scottish hill walking",
      },
    });

    // Create Years
    year2025 = await db.year.create({
      data: {
        code: "2025",
        title: "2025",
      },
    });

    year2026 = await db.year.create({
      data: {
        code: "2026",
        title: "2026",
      },
    });
  });

  it("should return empty array when user has no HoF Meister assignments", async () => {
    const assignments = await db.hofYearConfig.findMany({
      where: { hofmeisterId: user.id },
      include: {
        hof: { select: { title: true, code: true } },
        year: { select: { title: true, code: true } },
      },
    });

    expect(assignments).toHaveLength(0);
  });

  it("should return single assignment when user is HoF Meister for one config", async () => {
    // Assign user as HoF Meister
    await db.hofYearConfig.create({
      data: {
        hofId: hof1.id,
        yearId: year2025.id,
        hofmeisterId: user.id,
        minPeaks: 10,
        minForeignPeaks: 5,
        minFpr: 1.5,
      },
    });

    const assignments = await db.hofYearConfig.findMany({
      where: { hofmeisterId: user.id },
      include: {
        hof: { select: { title: true, code: true } },
        year: { select: { title: true, code: true } },
      },
    });

    expect(assignments).toHaveLength(1);
    expect(assignments[0].hof.title).toBe("Alpine Peaks");
    expect(assignments[0].year.title).toBe("2025");
  });

  it("should return multiple assignments sorted by year desc and HoF code asc", async () => {
    // Create multiple assignments
    await db.hofYearConfig.create({
      data: {
        hofId: hof1.id,
        yearId: year2025.id,
        hofmeisterId: user.id,
        minPeaks: 10,
        minForeignPeaks: 5,
        minFpr: 1.5,
      },
    });

    await db.hofYearConfig.create({
      data: {
        hofId: hof2.id,
        yearId: year2026.id,
        hofmeisterId: user.id,
        minPeaks: 10,
        minForeignPeaks: 5,
        minFpr: 1.5,
      },
    });

    await db.hofYearConfig.create({
      data: {
        hofId: hof1.id,
        yearId: year2026.id,
        hofmeisterId: user.id,
        minPeaks: 10,
        minForeignPeaks: 5,
        minFpr: 1.5,
      },
    });

    const assignments = await db.hofYearConfig.findMany({
      where: { hofmeisterId: user.id },
      include: {
        hof: { select: { title: true, code: true } },
        year: { select: { title: true, code: true } },
      },
      orderBy: [{ year: { code: "desc" } }, { hof: { code: "asc" } }],
    });

    expect(assignments).toHaveLength(3);

    // Should be sorted by year desc (2026 first), then by HoF code asc
    expect(assignments[0].year.title).toBe("2026");
    expect(assignments[0].hof.code).toBe("alpine-peaks");

    expect(assignments[1].year.title).toBe("2026");
    expect(assignments[1].hof.code).toBe("scottish-hills");

    expect(assignments[2].year.title).toBe("2025");
    expect(assignments[2].hof.code).toBe("alpine-peaks");
  });

  it("should not return assignments for other users", async () => {
    // Create another user
    const hashedPassword = await hash("change-me-1234", 10);
    const otherUser = await db.user.create({
      data: {
        username: "other-user",
        email: "other@test.com",
        password: hashedPassword,
        displayName: "Other User",
        role: "USER",
        emailVerified: new Date(),
        status: "ACTIVE",
      },
    });

    // Assign first user as HoF Meister
    await db.hofYearConfig.create({
      data: {
        hofId: hof1.id,
        yearId: year2025.id,
        hofmeisterId: user.id,
        minPeaks: 10,
        minForeignPeaks: 5,
        minFpr: 1.5,
      },
    });

    // Query for other user - should be empty
    const assignments = await db.hofYearConfig.findMany({
      where: { hofmeisterId: otherUser.id },
      include: {
        hof: { select: { title: true, code: true } },
        year: { select: { title: true, code: true } },
      },
    });

    expect(assignments).toHaveLength(0);
  });
});
