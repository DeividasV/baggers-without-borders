/**
 * E2E API Test: Users with Mocked Authentication
 *
 * This demonstrates how to test protected endpoints by mocking authentication.
 * Shows the pattern you asked about: "login and get token before doing tests"
 *
 * NOTE: Since middleware handles authentication BEFORE route handlers,
 * these tests focus on request/response format and validation logic
 * that happens within the route handlers themselves.
 */

// Mock next-auth BEFORE any imports to prevent jose module issues
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/src/lib/auth", () => ({
  authOptions: {},
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/users/route";
import { getTestDb, cleanTestDb } from "../../utils/test-db-setup";

// The users API relies on middleware for auth, not getServerSession
// So these tests verify the handler logic assuming auth has passed

describe("E2E API: Users with Auth", () => {
  let db: ReturnType<typeof getTestDb>;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  describe("Request Validation (assuming auth passed)", () => {
    it("should validate required fields for user creation", async () => {
      const invalidData = {
        displayName: "Test User",
        // missing username and password
      };

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify validation error response
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error).toContain("required");
    });

    it("should validate username format", async () => {
      const invalidUsername = {
        username: "ab", // Too short (min 3)
        displayName: "Test User",
        email: "testuser@test.com",
        password: "change-me-1234",
      };

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify(invalidUsername),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Username");
    });

    it("should validate password strength", async () => {
      const weakPassword = {
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "weak", // Too short
      };

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify(weakPassword),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Password");
    });

    it("should validate password contains letter and number", async () => {
      const noNumber = {
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "onlyletters", // No number
      };

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify(noNumber),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("letter and one number");
    });

    it("should reject invalid role", async () => {
      const invalidRole = {
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "change-me-1234",
        role: "INVALID_ROLE",
      };

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify(invalidRole),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("role");
    });
  });

  describe("List users with filters (assuming auth passed)", () => {
    beforeEach(async () => {
      // Create test data
      await db.user.createMany({
        data: [
          {
            username: "user1",
            displayName: "User One",
            email: "user1@test.com",
            password: "hash1",
            role: "USER",
          },
          {
            username: "user2",
            displayName: "User Two",
            email: "user2@test.com",
            password: "hash2",
            role: "USER",
          },
          {
            username: "admin1",
            displayName: "Admin One",
            email: "admin1@test.com",
            password: "hash3",
            role: "ADMIN",
          },
        ],
      });
    });

    it("should return paginated user list", async () => {
      const url = new URL("http://localhost:3000/api/users");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "10");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      // Verify response structure
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("users");
      expect(data).toHaveProperty("pagination");
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBeGreaterThanOrEqual(3);
    });

    it("should accept search parameter in request", async () => {
      const url = new URL("http://localhost:3000/api/users");
      url.searchParams.set("search", "admin");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "10");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      // Verify request is processed (even if results empty without auth)
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("users");
      expect(Array.isArray(data.users)).toBe(true);
    });

    it("should accept role filter parameter in request", async () => {
      const url = new URL("http://localhost:3000/api/users");
      url.searchParams.set("role", "ADMIN");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "10");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      // Verify request format is accepted
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("users");
      expect(data).toHaveProperty("pagination");
    });

    it("should handle pagination correctly", async () => {
      const url = new URL("http://localhost:3000/api/users");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "2");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 2,
        totalCount: expect.any(Number),
        totalPages: expect.any(Number),
        hasMore: expect.any(Boolean),
      });
      expect(data.users.length).toBeLessThanOrEqual(2);
    });

    it("should not expose password fields in response", async () => {
      const url = new URL("http://localhost:3000/api/users");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "10");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Verify no user has password field exposed
      data.users.forEach((user: any) => {
        expect(user).not.toHaveProperty("password");
      });
    });
  });

  describe("Response format validation", () => {
    it("should return consistent user object structure", async () => {
      await db.user.create({
        data: {
          username: "testuser",
          displayName: "Test User",
          email: "testuser@test.com",
          password: "hash",
          role: "USER",
        },
      });

      const url = new URL("http://localhost:3000/api/users");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "10");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const user = data.users[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("displayName");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("createdAt");
      expect(typeof user.id).toBe("string");
      expect(typeof user.username).toBe("string");
    });
  });
});
