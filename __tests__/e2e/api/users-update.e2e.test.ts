/**
 * E2E API Test: User Update (PATCH /api/users/[id])
 *
 * Comprehensive tests for user profile updates including:
 * - Basic profile fields (name, email, gender, birth year)
 * - Country/region associations
 * - Consent fields
 * - Admin-only fields (role, status, retired/deceased years)
 * - Interests management
 * - Permission validation
 */

import { NextRequest } from "next/server";
import { getTestDb, cleanTestDb } from "../../utils/test-db-setup";

// Mock the shared prisma instance to use test database
let testDb: ReturnType<typeof getTestDb>;
jest.mock("@/src/lib/prisma", () => ({
  get prisma() {
    if (!testDb) {
      testDb = getTestDb();
    }
    return testDb;
  },
}));

import { GET, PATCH, DELETE } from "@/app/api/users/[id]/route";

// Mock sessions for different user types
const mockAdminSession = {
  user: {
    id: "admin-user-id",
    role: "ADMIN",
  },
};

const mockUserSession = {
  user: {
    id: "regular-user-id",
    role: "USER",
  },
};

const mockOtherUserSession = {
  user: {
    id: "other-user-id",
    role: "USER",
  },
};

// We'll mock getSession dynamically in each test
let currentMockSession: any = mockAdminSession;

jest.mock("@/src/lib/api-auth", () => ({
  getSession: jest.fn(() => Promise.resolve(currentMockSession)),
}));

describe("E2E API: User Update (PATCH /api/users/[id])", () => {
  let db: ReturnType<typeof getTestDb>;
  let testUserId: string;
  let adminUserId: string;
  let otherUserId: string;
  let testCountryId: string;
  let testRegionId: string;
  let testInterestId1: string;
  let testInterestId2: string;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
    currentMockSession = mockAdminSession;

    // Create test countries
    const country = await db.country.create({
      data: {
        code: "GB",
        code3: "GBR",
        name: "United Kingdom",
        continent: "Europe",
      },
    });
    testCountryId = country.id;

    // Create test region
    const region = await db.region.create({
      data: {
        code: "SCT",
        name: "Scotland",
        type: "Region",
        countryId: testCountryId,
      },
    });
    testRegionId = region.id;

    // Create test interests
    const interest1 = await db.interest.create({
      data: { name: "Hiking" },
    });
    testInterestId1 = interest1.id;

    const interest2 = await db.interest.create({
      data: { name: "Climbing" },
    });
    testInterestId2 = interest2.id;

    // Create test users
    const regularUser = await db.user.create({
      data: {
        id: "regular-user-id",
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "hashed_password",
        role: "USER",
        status: "ACTIVE",
      },
    });
    testUserId = regularUser.id;

    const adminUser = await db.user.create({
      data: {
        id: "admin-user-id",
        username: "admin",
        displayName: "Admin User",
        email: "admin@test.com",
        password: "hashed_password",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    adminUserId = adminUser.id;

    const otherUser = await db.user.create({
      data: {
        id: "other-user-id",
        username: "otheruser",
        displayName: "Other User",
        email: "otheruser@test.com",
        password: "hashed_password",
        role: "USER",
        status: "ACTIVE",
      },
    });
    otherUserId = otherUser.id;
  });

  describe("Permission validation", () => {
    it("should allow admin to update any user", async () => {
      currentMockSession = mockAdminSession;

      const updateData = {
        givenName: "Updated",
        familyName: "Name",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.givenName).toBe("Updated");
      expect(data.familyName).toBe("Name");
    });

    it("should allow user to update their own profile", async () => {
      currentMockSession = mockUserSession;

      const updateData = {
        givenName: "Self",
        familyName: "Updated",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.givenName).toBe("Self");
      expect(data.familyName).toBe("Updated");
    });

    it("should forbid user from updating another user's profile", async () => {
      currentMockSession = mockOtherUserSession;

      const updateData = {
        givenName: "Unauthorized",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Forbidden");
    });

    it("should forbid non-admin from changing role", async () => {
      currentMockSession = mockUserSession;

      const updateData = {
        role: "ADMIN",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("role");
    });

    it("should forbid non-admin from changing status", async () => {
      currentMockSession = mockUserSession;

      const updateData = {
        status: "INACTIVE",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("status");
    });
  });

  describe("Basic field updates", () => {
    beforeEach(() => {
      currentMockSession = mockAdminSession;
    });

    it("should update given name and family name", async () => {
      const updateData = {
        givenName: "John",
        familyName: "Smith",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.givenName).toBe("John");
      expect(data.familyName).toBe("Smith");

      // Verify in database
      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user?.givenName).toBe("John");
      expect(user?.familyName).toBe("Smith");
    });

    it("should update email with valid format", async () => {
      const updateData = {
        email: "test@example.com",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe("test@example.com");
    });

    it("should reject invalid email format", async () => {
      const updateData = {
        email: "invalid-email",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("email");
    });

    it("should update gender with valid values", async () => {
      const validGenders = ["M", "F", "O", "N"];

      for (const gender of validGenders) {
        const updateData = { gender };

        const request = new NextRequest(
          `http://localhost:3000/api/users/${testUserId}`,
          {
            method: "PATCH",
            body: JSON.stringify(updateData),
          }
        );

        const response = await PATCH(request, {
          params: Promise.resolve({ id: testUserId }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.gender).toBe(gender);
      }
    });

    it("should reject invalid gender value", async () => {
      const updateData = {
        gender: "X",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("gender");
    });

    it("should update birth year with valid value", async () => {
      const updateData = {
        birthYear: 1990,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.birthYear).toBe(1990);
    });

    it("should reject birth year before 1900", async () => {
      const updateData = {
        birthYear: 1899,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("birth year");
    });

    it("should reject birth year in the future", async () => {
      const currentYear = new Date().getFullYear();
      const updateData = {
        birthYear: currentYear + 1,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("birth year");
    });

    it("should clear optional fields with null or empty string", async () => {
      // First set values
      await db.user.update({
        where: { id: testUserId },
        data: {
          givenName: "John",
          birthYear: 1990,
        },
      });

      // Then clear them
      const updateData = {
        givenName: null,
        birthYear: null,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.givenName).toBeNull();
      expect(data.birthYear).toBeNull();
    });
  });

  describe("Country and region updates", () => {
    beforeEach(() => {
      currentMockSession = mockAdminSession;
    });

    it("should update residence country", async () => {
      const updateData = {
        residenceCountry: testCountryId,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.residenceCountry).toBeDefined();
      expect(data.residenceCountry.id).toBe(testCountryId);
      expect(data.residenceCountry.code).toBe("GB");
    });

    it("should update residence region", async () => {
      const updateData = {
        residenceRegion: testRegionId,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.residenceRegion).toBeDefined();
      expect(data.residenceRegion.id).toBe(testRegionId);
      expect(data.residenceRegion.code).toBe("SCT");
    });

    it("should update birth country", async () => {
      const updateData = {
        birthCountry: testCountryId,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.birthCountry).toBeDefined();
      expect(data.birthCountry.id).toBe(testCountryId);
    });

    it("should disconnect country by setting to null", async () => {
      // First set a country
      await db.user.update({
        where: { id: testUserId },
        data: {
          residenceCountry: { connect: { id: testCountryId } },
        },
      });

      // Then disconnect it
      const updateData = {
        residenceCountry: null,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.residenceCountry).toBeNull();
    });

    it("should update multiple location fields together", async () => {
      const updateData = {
        residenceCountry: testCountryId,
        residenceRegion: testRegionId,
        birthCountry: testCountryId,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.residenceCountry.id).toBe(testCountryId);
      expect(data.residenceRegion.id).toBe(testRegionId);
      expect(data.birthCountry.id).toBe(testCountryId);
    });
  });

  describe("Interests management", () => {
    beforeEach(() => {
      currentMockSession = mockAdminSession;
    });

    it("should add interests to user", async () => {
      const updateData = {
        interests: [testInterestId1, testInterestId2],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify interests were created in database
      const userInterests = await db.userInterest.findMany({
        where: { userId: testUserId },
        include: { interest: true },
      });

      expect(userInterests).toHaveLength(2);
      expect(userInterests.map((ui) => ui.interestId)).toContain(
        testInterestId1
      );
      expect(userInterests.map((ui) => ui.interestId)).toContain(
        testInterestId2
      );
    });

    it("should replace existing interests", async () => {
      // First add one interest
      await db.userInterest.create({
        data: {
          userId: testUserId,
          interestId: testInterestId1,
        },
      });

      // Then replace with different interest
      const updateData = {
        interests: [testInterestId2],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });

      expect(response.status).toBe(200);

      // Verify only new interest exists
      const userInterests = await db.userInterest.findMany({
        where: { userId: testUserId },
      });

      expect(userInterests).toHaveLength(1);
      expect(userInterests[0].interestId).toBe(testInterestId2);
    });

    it("should clear all interests with empty array", async () => {
      // First add interests
      await db.userInterest.createMany({
        data: [
          { userId: testUserId, interestId: testInterestId1 },
          { userId: testUserId, interestId: testInterestId2 },
        ],
      });

      // Then clear them
      const updateData = {
        interests: [],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });

      expect(response.status).toBe(200);

      // Verify all interests removed
      const userInterests = await db.userInterest.findMany({
        where: { userId: testUserId },
      });

      expect(userInterests).toHaveLength(0);
    });
  });

  describe("Admin-only fields", () => {
    it("should allow admin to update role", async () => {
      currentMockSession = mockAdminSession;

      const updateData = {
        role: "ADMIN",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.role).toBe("ADMIN");
    });

    it("should validate role enum values", async () => {
      currentMockSession = mockAdminSession;

      const updateData = {
        role: "INVALID",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("role");
    });

    it("should allow admin to update status", async () => {
      currentMockSession = mockAdminSession;

      const validStatuses = [
        "NEW",
        "ACTIVE",
        "INACTIVE",
        "DECEASED",
        "ARCHIVED",
      ];

      for (const status of validStatuses) {
        const updateData = { status };

        const request = new NextRequest(
          `http://localhost:3000/api/users/${testUserId}`,
          {
            method: "PATCH",
            body: JSON.stringify(updateData),
          }
        );

        const response = await PATCH(request, {
          params: Promise.resolve({ id: testUserId }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe(status);
      }
    });

    it("should validate status enum values", async () => {
      currentMockSession = mockAdminSession;

      const updateData = {
        status: "INVALID",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("status");
    });

    it("should allow admin to set retired year", async () => {
      currentMockSession = mockAdminSession;

      const updateData = {
        retiredYear: 2020,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      // Note: Response might not include retiredYear, verify in DB
      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user?.retiredYear).toBe(2020);
    });

    it("should allow admin to set deceased year", async () => {
      currentMockSession = mockAdminSession;

      const updateData = {
        deceasedYear: 2021,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });

      expect(response.status).toBe(200);

      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user?.deceasedYear).toBe(2021);
    });

    it("should allow admin to set allowManualEntry flag", async () => {
      currentMockSession = mockAdminSession;

      const updateData = {
        allowManualEntry: true,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });

      expect(response.status).toBe(200);

      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user?.allowManualEntry).toBe(true);
    });
  });

  describe("Consent fields", () => {
    beforeEach(() => {
      currentMockSession = mockUserSession;
    });

    it("should update consent date fields", async () => {
      const consentDate = new Date("2024-01-01T00:00:00Z");

      const updateData = {
        prHallConsent: consentDate.toISOString(),
        pIndexConsent: consentDate.toISOString(),
        infoRetentionConsent: consentDate.toISOString(),
        publishTotalsConsent: consentDate.toISOString(),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });

      expect(response.status).toBe(200);

      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user?.prHallConsent).toEqual(consentDate);
      expect(user?.pIndexConsent).toEqual(consentDate);
      expect(user?.infoRetentionConsent).toEqual(consentDate);
      expect(user?.publishTotalsConsent).toEqual(consentDate);
    });

    it("should clear consent fields with null", async () => {
      // First set consent dates
      await db.user.update({
        where: { id: testUserId },
        data: {
          prHallConsent: new Date(),
          pIndexConsent: new Date(),
        },
      });

      // Then clear them
      const updateData = {
        prHallConsent: null,
        pIndexConsent: null,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });

      expect(response.status).toBe(200);

      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user?.prHallConsent).toBeNull();
      expect(user?.pIndexConsent).toBeNull();
    });
  });

  describe("Additional profile fields", () => {
    beforeEach(() => {
      currentMockSession = mockUserSession;
    });

    it("should update external service IDs", async () => {
      const updateData = {
        peakbaggerId: "12345",
        hillBaggingId: "hb-67890",
        bwbForumNickname: "mountaineer",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.peakbaggerId).toBe("12345");
      expect(data.hillBaggingId).toBe("hb-67890");
      expect(data.bwbForumNickname).toBe("mountaineer");
    });

    it("should update peakbagger all ascents flag", async () => {
      const updateData = {
        peakbaggerAllAscents: true,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });

      expect(response.status).toBe(200);

      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user?.peakbaggerAllAscents).toBe(true);
    });

    it("should update forum join date", async () => {
      const joinDate = new Date("2020-06-15T00:00:00Z");

      const updateData = {
        forumJoinDate: joinDate.toISOString(),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });

      expect(response.status).toBe(200);

      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user?.forumJoinDate).toEqual(joinDate);
    });

    it("should update notes field with valid content", async () => {
      const updateData = {
        notes: "This is a test note about the user.",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });

      expect(response.status).toBe(200);

      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user?.notes).toBe("This is a test note about the user.");
    });

    it("should reject notes exceeding 5000 characters", async () => {
      const updateData = {
        notes: "a".repeat(5001),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("5000");
    });
  });

  describe("Complex update scenarios", () => {
    beforeEach(() => {
      currentMockSession = mockAdminSession;
    });

    it("should handle comprehensive profile update", async () => {
      const updateData = {
        givenName: "John",
        familyName: "Doe",
        email: "john.doe@example.com",
        gender: "M",
        birthYear: 1985,
        residenceCountry: testCountryId,
        residenceRegion: testRegionId,
        birthCountry: testCountryId,
        interests: [testInterestId1, testInterestId2],
        peakbaggerId: "pb-123",
        bwbForumNickname: "johnd",
        notes: "Experienced climber",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.givenName).toBe("John");
      expect(data.familyName).toBe("Doe");
      expect(data.email).toBe("john.doe@example.com");
      expect(data.gender).toBe("M");
      expect(data.birthYear).toBe(1985);
      expect(data.residenceCountry.id).toBe(testCountryId);
      expect(data.residenceRegion.id).toBe(testRegionId);
      expect(data.birthCountry.id).toBe(testCountryId);
      expect(data.peakbaggerId).toBe("pb-123");
      expect(data.bwbForumNickname).toBe("johnd");
      expect(data.notes).toBe("Experienced climber");
    });

    it("should not expose password in response", async () => {
      const updateData = {
        givenName: "Test",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).not.toHaveProperty("password");
    });
  });

  describe("GET /api/users/[id]", () => {
    beforeEach(async () => {
      // Set up user with full profile
      await db.user.update({
        where: { id: testUserId },
        data: {
          givenName: "Test",
          familyName: "User",
          email: "test@example.com",
          birthYear: 1990,
          residenceCountry: { connect: { id: testCountryId } },
          residenceRegion: { connect: { id: testRegionId } },
        },
      });

      await db.userInterest.create({
        data: {
          userId: testUserId,
          interestId: testInterestId1,
        },
      });
    });

    it("should allow admin to view any user profile", async () => {
      currentMockSession = mockAdminSession;

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testUserId);
      expect(data.givenName).toBe("Test");
      expect(data.familyName).toBe("User");
      expect(data).toHaveProperty("residenceCountry");
      expect(data).toHaveProperty("residenceRegion");
      expect(data).toHaveProperty("userInterests");
      expect(data).not.toHaveProperty("password");
    });

    it("should allow user to view their own profile", async () => {
      currentMockSession = mockUserSession;

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testUserId);
    });

    it("should forbid user from viewing another user's profile", async () => {
      currentMockSession = mockOtherUserSession;

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Forbidden");
    });

    it("should return 404 for non-existent user", async () => {
      currentMockSession = mockAdminSession;

      const request = new NextRequest(
        `http://localhost:3000/api/users/non-existent-id`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });
  });

  describe("DELETE /api/users/[id]", () => {
    it("should allow admin to delete user", async () => {
      currentMockSession = mockAdminSession;

      const request = new NextRequest(
        `http://localhost:3000/api/users/${testUserId}`,
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: testUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify user is deleted
      const user = await db.user.findUnique({ where: { id: testUserId } });
      expect(user).toBeNull();
    });

    it("should prevent admin from deleting themselves", async () => {
      currentMockSession = mockAdminSession;

      const request = new NextRequest(
        `http://localhost:3000/api/users/${adminUserId}`,
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: adminUserId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Cannot delete your own account");
    });
  });
});
