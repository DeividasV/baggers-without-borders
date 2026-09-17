/**
 * E2E API Test: Change Requests Endpoint
 *
 * Tests validation logic and request/response format for change request management.
 * Tests the handler logic assuming middleware auth has passed.
 */

import { NextRequest } from "next/server";
import { getTestDb, cleanTestDb } from "../../utils/test-db-setup";

// Mock the shared prisma instance to use test database
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

import { GET, POST } from "@/app/api/change-requests/route";
import { PUT as UPDATE } from "@/app/api/change-requests/[id]/route";

// Mock the getSession function to return a consistent user
const mockUser = {
  id: "test-user-id-change-requests",
  role: "ADMIN",
};

jest.mock("@/src/lib/api-auth", () => ({
  getSession: jest.fn(() =>
    Promise.resolve({
      user: mockUser,
    })
  ),
}));

describe("E2E API: Change Requests", () => {
  let db: ReturnType<typeof getTestDb>;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();

    // Create test user for change requests with matching ID from mock
    await db.user.create({
      data: {
        id: "test-user-id-change-requests",
        username: "testadmin",
        displayName: "Test Admin",
        email: "testadmin@test.com",
        password: "hash",
        role: "ADMIN",
      },
    });
  });

  describe("POST /api/change-requests - Validation", () => {
    it("should reject non-admin users", async () => {
      const { getSession } = jest.requireMock("@/src/lib/api-auth") as {
        getSession: jest.Mock;
      };
      getSession.mockResolvedValueOnce({
        user: {
          id: "test-user-id-change-requests",
          role: "USER",
        },
      });

      const request = new NextRequest("http://localhost:3000/api/change-requests", {
        method: "POST",
        body: JSON.stringify({
          title: "Blocked change",
          description: "Should be rejected",
          type: "FEATURE",
          priority: "MEDIUM",
          impact: "LOW",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });

    it("should validate required fields", async () => {
      const invalidData = {
        plannedTime: 2.5,
        // missing title, description, type, priority, impact
      };

      const request = new NextRequest("http://localhost:3000/api/change-requests", {
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

    it("should validate type enum values", async () => {
      const invalidData = {
        title: "Test Change",
        description: "Test description",
        type: "INVALID_TYPE",
        priority: "HIGH",
        impact: "MEDIUM",
      };

      const request = new NextRequest("http://localhost:3000/api/change-requests", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Select a valid change type.");
    });

    it("should validate priority enum values", async () => {
      const invalidData = {
        title: "Test Change",
        description: "Test description",
        type: "FEATURE",
        priority: "INVALID_PRIORITY",
        impact: "MEDIUM",
      };

      const request = new NextRequest("http://localhost:3000/api/change-requests", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Select a valid priority.");
    });

    it("should validate impact enum values", async () => {
      const invalidData = {
        title: "Test Change",
        description: "Test description",
        type: "FEATURE",
        priority: "HIGH",
        impact: "INVALID_IMPACT",
      };

      const request = new NextRequest("http://localhost:3000/api/change-requests", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Select a valid impact.");
    });

    it("should accept all valid type values", async () => {
      const validTypes = ["FEATURE", "BUG", "ENHANCEMENT", "DOCUMENTATION", "OTHER"];

      for (const type of validTypes) {
        const validData = {
          title: `Test ${type}`,
          description: "Test description",
          type,
          priority: "HIGH",
          impact: "MEDIUM",
        };

        const request = new NextRequest("http://localhost:3000/api/change-requests", {
          method: "POST",
          body: JSON.stringify(validData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.type).toBe(type);
      }
    });

    it("should accept all valid priority values", async () => {
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

      for (const priority of validPriorities) {
        const validData = {
          title: `Test ${priority}`,
          description: "Test description",
          type: "FEATURE",
          priority,
          impact: "MEDIUM",
        };

        const request = new NextRequest("http://localhost:3000/api/change-requests", {
          method: "POST",
          body: JSON.stringify(validData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.priority).toBe(priority);
      }
    });

    it("should accept all valid impact values", async () => {
      const validImpacts = ["LOW", "MEDIUM", "HIGH"];

      for (const impact of validImpacts) {
        const validData = {
          title: `Test ${impact}`,
          description: "Test description",
          type: "FEATURE",
          priority: "MEDIUM",
          impact,
        };

        const request = new NextRequest("http://localhost:3000/api/change-requests", {
          method: "POST",
          body: JSON.stringify(validData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.impact).toBe(impact);
      }
    });

    it("should accept valid change request creation data", async () => {
      const validData = {
        title: "Add dark mode",
        description: "Implement dark mode theme for the application",
        type: "FEATURE",
        priority: "MEDIUM",
        impact: "HIGH",
        plannedTime: 8.0,
        actualTime: 10.5,
      };

      const request = new NextRequest("http://localhost:3000/api/change-requests", {
        method: "POST",
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id");
      expect(data.title).toBe("Add dark mode");
      expect(data.type).toBe("FEATURE");
      expect(data.priority).toBe("MEDIUM");
      expect(data.impact).toBe("HIGH");
      expect(data.plannedTime).toBe(8.0);
      expect(data.actualTime).toBe(10.5);
    });

    it("should persist BwB context fields on create", async () => {
      const validData = {
        title: "Improve member search",
        description: "Add better filtering options",
        type: "ENHANCEMENT",
        priority: "MEDIUM",
        impact: "MEDIUM",
        businessValue: "Helps admins find member records faster.",
        affectedAreas: JSON.stringify(["administration", "ui"]),
        technicalDetails: "Add indexed filters for member search fields.",
      };

      const request = new NextRequest("http://localhost:3000/api/change-requests", {
        method: "POST",
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.businessValue).toBe(validData.businessValue);
      expect(data.affectedAreas).toBe(validData.affectedAreas);
      expect(data.technicalDetails).toBe(validData.technicalDetails);
    });

    it("should handle null time values", async () => {
      const validData = {
        title: "Fix login bug",
        description: "Users can't log in with special characters",
        type: "BUG",
        priority: "CRITICAL",
        impact: "HIGH",
      };

      const request = new NextRequest("http://localhost:3000/api/change-requests", {
        method: "POST",
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.plannedTime).toBeNull();
      expect(data.actualTime).toBeNull();
    });

    it("should associate change request with current user", async () => {
      const validData = {
        title: "Update documentation",
        description: "Update API documentation",
        type: "DOCUMENTATION",
        priority: "LOW",
        impact: "LOW",
      };

      const request = new NextRequest("http://localhost:3000/api/change-requests", {
        method: "POST",
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("createdBy");
      expect(data.createdBy.id).toBe("test-user-id-change-requests");
      expect(data.createdBy).toHaveProperty("username");
      expect(data.createdBy).toHaveProperty("displayName");
    });
  });

  describe("GET /api/change-requests - Request handling", () => {
    beforeEach(async () => {
      // Create test change requests
      await db.changeRequest.createMany({
        data: [
          {
            title: "Feature Request 1",
            description: "Add new feature",
            type: "FEATURE",
            priority: "HIGH",
            impact: "HIGH",
            createdById: "test-user-id-change-requests",
          },
          {
            title: "Bug Fix 1",
            description: "Fix critical bug",
            type: "BUG",
            priority: "CRITICAL",
            impact: "HIGH",
            createdById: "test-user-id-change-requests",
          },
          {
            title: "Enhancement 1",
            description: "Improve UI",
            type: "ENHANCEMENT",
            priority: "MEDIUM",
            impact: "MEDIUM",
            createdById: "test-user-id-change-requests",
          },
        ],
      });
    });

    it("should return all change requests", async () => {
      const request = new NextRequest("http://localhost:3000/api/change-requests");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(3);
      expect(body.total).toBe(3);
    });

    it("should reject non-admin users when listing change requests", async () => {
      const { getSession } = jest.requireMock("@/src/lib/api-auth") as {
        getSession: jest.Mock;
      };
      getSession.mockResolvedValueOnce({
        user: {
          id: "test-user-id-change-requests",
          role: "USER",
        },
      });

      const request = new NextRequest("http://localhost:3000/api/change-requests");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Forbidden - Admin access required");
    });

    it("should return change requests ordered by createdAt desc", async () => {
      const request = new NextRequest("http://localhost:3000/api/change-requests");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      const dates = body.data.map((cr: any) => new Date(cr.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it("should include creator information in response", async () => {
      const request = new NextRequest("http://localhost:3000/api/change-requests");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      const changeRequest = body.data[0];
      expect(changeRequest).toHaveProperty("createdBy");
      expect(changeRequest.createdBy).toHaveProperty("id");
      expect(changeRequest.createdBy).toHaveProperty("username");
      expect(changeRequest.createdBy).toHaveProperty("displayName");
    });

    it("should include attachments and counts in response", async () => {
      const request = new NextRequest("http://localhost:3000/api/change-requests");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      const changeRequest = body.data[0];
      expect(changeRequest).toHaveProperty("attachments");
      expect(changeRequest).toHaveProperty("_count");
      expect(changeRequest._count).toHaveProperty("attachments");
    });

    it("should return consistent change request object structure", async () => {
      const request = new NextRequest("http://localhost:3000/api/change-requests");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      const changeRequest = body.data[0];
      expect(changeRequest).toHaveProperty("id");
      expect(changeRequest).toHaveProperty("title");
      expect(changeRequest).toHaveProperty("description");
      expect(changeRequest).toHaveProperty("type");
      expect(changeRequest).toHaveProperty("priority");
      expect(changeRequest).toHaveProperty("impact");
      expect(changeRequest).toHaveProperty("createdAt");
      expect(typeof changeRequest.title).toBe("string");
      expect(typeof changeRequest.type).toBe("string");
    });
  });

  describe("PUT /api/change-requests/[id] - Persistence", () => {
    let changeRequestId: string;

    beforeEach(async () => {
      const created = await db.changeRequest.create({
        data: {
          title: "Existing Request",
          description: "Existing description",
          type: "FEATURE",
          priority: "MEDIUM",
          impact: "MEDIUM",
          createdById: "test-user-id-change-requests",
        },
      });

      changeRequestId = created.id;
    });

    it("should persist BwB context fields on update", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/change-requests/${changeRequestId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessValue: "Reduces admin friction during support work.",
            affectedAreas: JSON.stringify(["administration"]),
            technicalDetails: "Populate context fields from the edit form.",
          }),
        }
      );

      const response = await UPDATE(request, {
        params: Promise.resolve({ id: changeRequestId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.businessValue).toBe("Reduces admin friction during support work.");
      expect(data.affectedAreas).toBe(JSON.stringify(["administration"]));
      expect(data.technicalDetails).toBe("Populate context fields from the edit form.");
    });
  });
});
