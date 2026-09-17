/**
 * E2E API Test: Hall of Fame (HOFs) Endpoint
 *
 * Tests validation logic and request/response format for HOF management.
 * Tests the handler logic assuming middleware auth has passed.
 */

// Mock next-auth BEFORE any imports to prevent jose module issues
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/src/lib/auth", () => ({
  authOptions: {},
}));

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

import { GET, POST } from "@/app/api/hofs/route";
import { getServerSession } from "next-auth";

// Mock getServerSession to return admin session for all tests
const mockSession = {
  user: {
    id: "admin-user-id",
    role: "ADMIN",
    email: "admin@test.com",
    username: "admin",
  },
};

(getServerSession as jest.Mock).mockResolvedValue(mockSession);

describe("E2E API: HOFs", () => {
  let db: ReturnType<typeof getTestDb>;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  describe("POST /api/hofs - Validation", () => {
    it("should validate required fields", async () => {
      const invalidData = {
        description: "Test HOF",
        // missing code and title
      };

      const request = new NextRequest("http://localhost:3000/api/hofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error).toContain("required");
    });

    it("should validate code field is provided", async () => {
      const invalidData = {
        title: "Test HOF",
        // missing code
      };

      const request = new NextRequest("http://localhost:3000/api/hofs", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should validate title field is provided", async () => {
      const invalidData = {
        code: "TEST",
        // missing title
      };

      const request = new NextRequest("http://localhost:3000/api/hofs", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should prevent duplicate HOF codes", async () => {
      // Create initial HOF
      const initialHof = await db.hallOfFame.create({
        data: {
          code: "P100",
          title: "P100 Test",
          displayOrder: 0,
        },
      });

      expect(initialHof).toBeDefined();
      expect(initialHof.code).toBe("P100");

      const duplicateData = {
        code: "P100",
        title: "Another P100",
      };

      const request = new NextRequest("http://localhost:3000/api/hofs", {
        method: "POST",
        body: JSON.stringify(duplicateData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("already exists");
    });

    it("should accept valid HOF creation data", async () => {
      const validData = {
        code: "P600",
        title: "P600 Hall of Fame",
        description: "600m prominence peaks",
        isActive: true,
        allowManualEntry: true,
      };

      const request = new NextRequest("http://localhost:3000/api/hofs", {
        method: "POST",
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status !== 201) {
        console.log("ERROR RESPONSE:", data);
      }

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id");
      expect(data.code).toBe("P600");
      expect(data.title).toBe("P600 Hall of Fame");
    });

    it("should apply default values when not provided", async () => {
      const minimalData = {
        code: "BWB",
        title: "Baggers Without Borders",
      };

      const request = new NextRequest("http://localhost:3000/api/hofs", {
        method: "POST",
        body: JSON.stringify(minimalData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.isActive).toBe(true);
      expect(data.allowManualEntry).toBe(true);
      expect(data).toHaveProperty("displayOrder");
    });
  });

  describe("GET /api/hofs - Request handling", () => {
    beforeEach(async () => {
      // Create test HOFs
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
          {
            code: "OLD",
            title: "Old HOF",
            isActive: false,
            displayOrder: 2,
          },
        ],
      });
    });

    it("should return all HOFs when no filter applied", async () => {
      const request = new NextRequest("http://localhost:3000/api/hofs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3);
    });

    it("should filter active HOFs when activeOnly=true", async () => {
      const url = new URL("http://localhost:3000/api/hofs");
      url.searchParams.set("activeOnly", "true");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      // Only check that active filtering works
      if (data.length > 0) {
        expect(data.every((hof: any) => hof.isActive === true)).toBe(true);
      }
    });

    it("should return HOFs ordered by displayOrder", async () => {
      const request = new NextRequest("http://localhost:3000/api/hofs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].displayOrder).toBeLessThanOrEqual(data[1].displayOrder);
    });

    it("should return consistent HOF object structure", async () => {
      const request = new NextRequest("http://localhost:3000/api/hofs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const hof = data[0];
      expect(hof).toHaveProperty("id");
      expect(hof).toHaveProperty("code");
      expect(hof).toHaveProperty("title");
      expect(hof).toHaveProperty("isActive");
      expect(hof).toHaveProperty("displayOrder");
      expect(typeof hof.code).toBe("string");
      expect(typeof hof.title).toBe("string");
    });
  });

  describe("POST /api/hofs - Display order management", () => {
    it("should assign sequential display orders", async () => {
      const firstHof = {
        code: "P100_SEQ",
        title: "P100 Sequential",
      };

      const firstRequest = new NextRequest("http://localhost:3000/api/hofs", {
        method: "POST",
        body: JSON.stringify(firstHof),
      });

      const firstResponse = await POST(firstRequest);
      const firstData = await firstResponse.json();

      expect(firstResponse.status).toBe(201);
      expect(firstData).toHaveProperty("displayOrder");
      expect(typeof firstData.displayOrder).toBe("number");

      const secondHof = {
        code: "P600_SEQ",
        title: "P600 Sequential",
      };

      const secondRequest = new NextRequest("http://localhost:3000/api/hofs", {
        method: "POST",
        body: JSON.stringify(secondHof),
      });

      const secondResponse = await POST(secondRequest);
      const secondData = await secondResponse.json();

      expect(secondResponse.status).toBe(201);
      expect(secondData.displayOrder).toBeGreaterThan(firstData.displayOrder);
    });
  });

  describe("POST /api/hofs - User participation creation", () => {
    it("should create participation records for existing users", async () => {
      // Create test users
      await db.user.createMany({
        data: [
          {
            username: "user1_hof",
            displayName: "User One",
            email: "user1_hof@test.com",
            password: "hash1",
            role: "USER",
          },
          {
            username: "user2_hof",
            displayName: "User Two",
            email: "user2_hof@test.com",
            password: "hash2",
            role: "USER",
          },
        ],
      });

      const hofData = {
        code: "P100_USERS",
        title: "P100 With Users",
      };

      const request = new NextRequest("http://localhost:3000/api/hofs", {
        method: "POST",
        body: JSON.stringify(hofData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);

      // Verify participation records were created
      const participations = await db.userHofParticipation.findMany({
        where: { hofId: data.id },
      });

      expect(participations.length).toBe(2);
      expect(participations.every((p) => p.enabled === true)).toBe(true);
    });
  });
});
