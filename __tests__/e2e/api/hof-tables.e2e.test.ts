/**
 * E2E API Test: HOF Tables Endpoint
 *
 * Tests the public HOF tables endpoint that displays qualified members.
 * This endpoint is publicly accessible (uses getOptionalSession).
 */

import { NextRequest } from "next/server";
import { getTestDb, cleanTestDb } from "../../utils/test-db-setup";

// Mock the production prisma instance to use test database
// Use a getter to avoid initialization timing issues
let testDb: ReturnType<typeof getTestDb>;
jest.mock("@/src/lib/prisma", () => ({
  get prisma() {
    if (!testDb) {
      testDb = getTestDb();
    }
    return testDb;
  },
}));

import { GET } from "@/app/api/hof-tables/route";

// Mock the getOptionalSession function
jest.mock("@/src/lib/api-auth", () => ({
  getOptionalSession: jest.fn(() => Promise.resolve(null)),
}));

describe("E2E API: HOF Tables", () => {
  let db: ReturnType<typeof getTestDb>;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  describe("GET /api/hof-tables - Public endpoint", () => {
    it("should return empty data when no HOFs or years exist", async () => {
      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toEqual([]);
      expect(data.years).toEqual([]);
      expect(data.hofs).toEqual([]);
      expect(data.selectedYearId).toBeNull();
      expect(data.selectedHofId).toBeNull();
      // Early return doesn't include all fields
    });

    it("should return HOFs and years when they exist", async () => {
      // Create test data
      await db.hallOfFame.createMany({
        data: [
          {
            code: "P100",
            title: "P100",
            isActive: true,
            displayOrder: 0,
          },
          {
            code: "P600",
            title: "P600",
            isActive: true,
            displayOrder: 1,
          },
        ],
      });

      await db.year.createMany({
        data: [
          {
            code: "2024",
            title: "2024",
            isActive: true,
            displayOrder: 0,
          },
          {
            code: "2025",
            title: "2025",
            isActive: true,
            displayOrder: 1,
          },
        ],
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hofs).toHaveLength(2);
      expect(data.years).toHaveLength(2);
      expect(data.selectedYearId).toBeDefined();
      expect(data.selectedHofId).toBeDefined();
    });

    it("should select default HOF and year when not specified", async () => {
      // Create test data
      const p100 = await db.hallOfFame.create({
        data: {
          code: "P100",
          title: "P100",
          isActive: true,
          displayOrder: 0,
        },
      });

      const year2025 = await db.year.create({
        data: {
          code: "2025",
          title: "2025",
          isActive: true,
          displayOrder: 0,
        },
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.selectedHofId).toBe(p100.id);
      expect(data.selectedYearId).toBe(year2025.id);
    });

    it("should prefer configured app setting defaults when query params are missing", async () => {
      const p100 = await db.hallOfFame.create({
        data: {
          code: "P100_DEFAULTS",
          title: "P100 Defaults",
          isActive: true,
          displayOrder: 0,
        },
      });

      const p600 = await db.hallOfFame.create({
        data: {
          code: "P600_DEFAULTS",
          title: "P600 Defaults",
          isActive: true,
          displayOrder: 1,
        },
      });

      const year2024 = await db.year.create({
        data: {
          code: "2024_DEFAULTS",
          title: "2024 Defaults",
          isActive: true,
          displayOrder: 0,
        },
      });

      const year2025 = await db.year.create({
        data: {
          code: "2025_DEFAULTS",
          title: "2025 Defaults",
          isActive: true,
          displayOrder: 1,
        },
      });

      await db.appSetting.createMany({
        data: [
          {
            key: "default_year_id",
            value: year2024.id,
            description: "Default year for HoF tables",
            category: "hof",
          },
          {
            key: "default_hof_id",
            value: p600.id,
            description: "Default HOF for HoF tables",
            category: "hof",
          },
        ],
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.selectedYearId).toBe(year2024.id);
      expect(data.selectedHofId).toBe(p600.id);
      expect(data.selectedYearId).not.toBe(year2025.id);
      expect(data.selectedHofId).not.toBe(p100.id);
    });

    it("should accept yearId and hofId query parameters", async () => {
      // Create test data
      const p600 = await db.hallOfFame.create({
        data: {
          code: "P600",
          title: "P600",
          isActive: true,
          displayOrder: 0,
        },
      });

      const year2024 = await db.year.create({
        data: {
          code: "2024",
          title: "2024",
          isActive: true,
          displayOrder: 0,
        },
      });

      const url = new URL("http://localhost:3000/api/hof-tables");
      url.searchParams.set("yearId", year2024.id);
      url.searchParams.set("hofId", p600.id);

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.selectedYearId).toBe(year2024.id);
      expect(data.selectedHofId).toBe(p600.id);
    });

    it("should return members with HOF entries", async () => {
      // Create test data
      const hof = await db.hallOfFame.create({
        data: {
          code: "P100_ENTRIES",
          title: "P100 Entries",
          isActive: true,
          displayOrder: 0,
        },
      });

      const year = await db.year.create({
        data: {
          code: "2025_ENTRIES",
          title: "2025 Entries",
          isActive: true,
          displayOrder: 0,
        },
      });

      const user = await db.user.create({
        data: {
          username: "climber1_entries",
          displayName: "Test Climber Entries",
          email: "climber1_entries@test.com",
          password: "hash",
          role: "USER",
          status: "ACTIVE",
        },
      });

      // Create participation records
      await db.userHofParticipation.create({
        data: {
          userId: user.id,
          hofId: hof.id,
          enabled: true,
        },
      });

      await db.userYearParticipation.create({
        data: {
          userId: user.id,
          yearId: year.id,
          enabled: true,
        },
      });

      await db.hofEntry.create({
        data: {
          memberId: user.id,
          hofId: hof.id,
          yearId: year.id,
          totalPeaks: 100,
          peaksInYear: 10,
          foreignPeaks: 20,
        },
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members.length).toBeGreaterThan(0);
      expect(data.members[0]).toHaveProperty("member");
      expect(data.members[0]).toHaveProperty("totalPeaks");
      expect(data.members[0]).toHaveProperty("foreignPeaks");
      expect(data.members[0]).toHaveProperty("fpr");
    });

    it("should calculate FPR correctly", async () => {
      // Create test data
      const hof = await db.hallOfFame.create({
        data: {
          code: "P100_FPR",
          title: "P100 FPR",
          isActive: true,
          displayOrder: 0,
        },
      });

      const year = await db.year.create({
        data: {
          code: "2025_FPR",
          title: "2025 FPR",
          isActive: true,
          displayOrder: 0,
        },
      });

      const user = await db.user.create({
        data: {
          username: "climber1_fpr",
          displayName: "Test Climber FPR",
          email: "climber1_fpr@test.com",
          password: "hash",
          role: "USER",
          status: "ACTIVE",
        },
      });

      // Create participation records
      await db.userHofParticipation.create({
        data: {
          userId: user.id,
          hofId: hof.id,
          enabled: true,
        },
      });

      await db.userYearParticipation.create({
        data: {
          userId: user.id,
          yearId: year.id,
          enabled: true,
        },
      });

      await db.hofEntry.create({
        data: {
          memberId: user.id,
          hofId: hof.id,
          yearId: year.id,
          totalPeaks: 200,
          peaksInYear: 20,
          foreignPeaks: 50, // 50/200 = 25%
        },
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members.length).toBeGreaterThan(0);
      expect(data.members[0].fpr).toBeCloseTo(25, 1);
    });

    it("should only include ACTIVE and DECEASED members", async () => {
      // Create test data
      const hof = await db.hallOfFame.create({
        data: {
          code: "P100",
          title: "P100",
          isActive: true,
          displayOrder: 0,
        },
      });

      const year = await db.year.create({
        data: {
          code: "2025",
          title: "2025",
          isActive: true,
          displayOrder: 0,
        },
      });

      const activeUser = await db.user.create({
        data: {
          username: "active",
          displayName: "Active User",
          email: "active@test.com",
          password: "hash",
          role: "USER",
          status: "ACTIVE",
        },
      });

      const inactiveUser = await db.user.create({
        data: {
          username: "inactive",
          displayName: "Inactive User",
          email: "inactive@test.com",
          password: "hash",
          role: "USER",
          status: "INACTIVE",
        },
      });

      // Create participation records for both users
      await db.userHofParticipation.createMany({
        data: [
          { userId: activeUser.id, hofId: hof.id, enabled: true },
          { userId: inactiveUser.id, hofId: hof.id, enabled: true },
        ],
      });

      await db.userYearParticipation.createMany({
        data: [
          { userId: activeUser.id, yearId: year.id, enabled: true },
          { userId: inactiveUser.id, yearId: year.id, enabled: true },
        ],
      });

      await db.hofEntry.createMany({
        data: [
          {
            memberId: activeUser.id,
            hofId: hof.id,
            yearId: year.id,
            totalPeaks: 100,
            peaksInYear: 10,
            foreignPeaks: 20,
          },
          {
            memberId: inactiveUser.id,
            hofId: hof.id,
            yearId: year.id,
            totalPeaks: 100,
            peaksInYear: 10,
            foreignPeaks: 20,
          },
        ],
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members.length).toBe(1);
      expect(data.members[0].member.status).toBe("ACTIVE");
    });

    it("should return consistent response structure", async () => {
      // Create minimal data to get full response
      await db.hallOfFame.create({
        data: {
          code: "P100",
          title: "P100",
          isActive: true,
          displayOrder: 0,
        },
      });

      await db.year.create({
        data: {
          code: "2025",
          title: "2025",
          isActive: true,
          displayOrder: 0,
        },
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("members");
      expect(data).toHaveProperty("progressRegisterMembers");
      expect(data).toHaveProperty("years");
      expect(data).toHaveProperty("hofs");
      expect(data).toHaveProperty("selectedYearId");
      expect(data).toHaveProperty("selectedHofId");
      expect(data).toHaveProperty("totalActiveMembers");
      expect(Array.isArray(data.members)).toBe(true);
      expect(Array.isArray(data.years)).toBe(true);
      expect(Array.isArray(data.hofs)).toBe(true);
    });

    it("should include yearValue in response", async () => {
      // Create test data to get full response
      await db.hallOfFame.create({
        data: {
          code: "P100",
          title: "P100",
          isActive: true,
          displayOrder: 0,
        },
      });

      await db.year.create({
        data: {
          code: "2025",
          title: "2025",
          isActive: true,
          displayOrder: 0,
        },
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("yearValue");
      expect(typeof data.yearValue).toBe("number");
      expect(data.yearValue).toBe(2025);
    });

    it("should include member badges information", async () => {
      // Create test data
      const hof = await db.hallOfFame.create({
        data: {
          code: "P100",
          title: "P100",
          isActive: true,
          displayOrder: 0,
        },
      });

      const year = await db.year.create({
        data: {
          code: "2025",
          title: "2025",
          isActive: true,
          displayOrder: 0,
        },
      });

      const user = await db.user.create({
        data: {
          username: "climber1",
          displayName: "Test Climber",
          email: "climber1@test.com",
          password: "hash",
          role: "USER",
          status: "ACTIVE",
        },
      });

      await db.hofEntry.create({
        data: {
          memberId: user.id,
          hofId: hof.id,
          yearId: year.id,
          totalPeaks: 100,
          peaksInYear: 10,
          foreignPeaks: 20,
        },
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (data.members.length > 0) {
        const member = data.members[0];
        expect(member).toHaveProperty("isNewEntrant");
        expect(member).toHaveProperty("isFirstTimeAward");
        expect(member).toHaveProperty("awardTierName");
        expect(member).toHaveProperty("isParticipating");
        expect(member).toHaveProperty("dataNotProvided");
        expect(member).toHaveProperty("hasLce");
      }
    });
  });

  describe("GET /api/hof-tables - Filtering by participation", () => {
    it("should filter members by HOF participation", async () => {
      // Create test data
      const hof = await db.hallOfFame.create({
        data: {
          code: "P100",
          title: "P100",
          isActive: true,
          displayOrder: 0,
        },
      });

      const year = await db.year.create({
        data: {
          code: "2025",
          title: "2025",
          isActive: true,
          displayOrder: 0,
        },
      });

      const participatingUser = await db.user.create({
        data: {
          username: "participant",
          displayName: "Participating User",
          email: "participant@test.com",
          password: "hash",
          role: "USER",
          status: "ACTIVE",
        },
      });

      const nonParticipatingUser = await db.user.create({
        data: {
          username: "nonparticipant",
          displayName: "Non-Participating User",
          email: "nonparticipant@test.com",
          password: "hash",
          role: "USER",
          status: "ACTIVE",
        },
      });

      // Create HOF participations
      await db.userHofParticipation.createMany({
        data: [
          {
            userId: participatingUser.id,
            hofId: hof.id,
            enabled: true,
          },
          {
            userId: nonParticipatingUser.id,
            hofId: hof.id,
            enabled: false,
          },
        ],
      });

      // Create Year participations (required for HOF entries)
      await db.userYearParticipation.createMany({
        data: [
          {
            userId: participatingUser.id,
            yearId: year.id,
            enabled: true,
          },
          {
            userId: nonParticipatingUser.id,
            yearId: year.id,
            enabled: true,
          },
        ],
      });

      // Create HOF entries
      await db.hofEntry.createMany({
        data: [
          {
            memberId: participatingUser.id,
            hofId: hof.id,
            yearId: year.id,
            totalPeaks: 100,
            peaksInYear: 10,
            foreignPeaks: 20,
          },
          {
            memberId: nonParticipatingUser.id,
            hofId: hof.id,
            yearId: year.id,
            totalPeaks: 100,
            peaksInYear: 10,
            foreignPeaks: 20,
          },
        ],
      });

      const request = new NextRequest("http://localhost:3000/api/hof-tables");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members.length).toBe(1);
      expect(data.members[0].member.username).toBe("participant");
    });
  });
});
