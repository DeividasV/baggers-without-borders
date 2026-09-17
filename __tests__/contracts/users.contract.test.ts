/**
 * API Contract Test: Users Endpoint
 *
 * Validates API response schemas, required fields, and error handling
 */

import { NextRequest } from "next/server";
import { getTestDb, cleanTestDb } from "../utils/test-db-setup";

let testDb: ReturnType<typeof getTestDb>;
jest.mock("@/src/lib/prisma", () => ({
  get prisma() {
    if (!testDb) {
      testDb = getTestDb();
    }
    return testDb;
  },
}));

import { GET, POST } from "@/app/api/users/route";

// Mock session for auth
jest.mock("@/src/lib/api-auth", () => ({
  getSession: jest.fn(() =>
    Promise.resolve({
      user: { id: "test-admin-id", role: "ADMIN" },
    })
  ),
}));

// Mock email sending
jest.mock("@/src/lib/email", () => ({
  sendEmail: jest.fn(() => Promise.resolve()),
}));

describe("API Contract: /api/users", () => {
  let db: ReturnType<typeof getTestDb>;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();

    // Create test admin user
    await db.user.create({
      data: {
        id: "test-admin-id",
        username: "testadmin",
        displayName: "Test Admin",
        email: "admin@test.com",
        password: "hash",
        role: "ADMIN",
      },
    });
  });

  describe("GET /api/users - Success Response Contract", () => {
    it("should return standard paginated response structure", async () => {
      // Create test user
      await db.user.create({
        data: {
          username: "testuser",
          displayName: "Test User",
          email: "user@test.com",
          password: "hash",
          role: "USER",
        },
      });

      const url = new URL("http://localhost:3000/api/users");
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      // Verify response structure
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("users");
      expect(data).toHaveProperty("pagination");
      expect(data).toHaveProperty("stats");

      // Verify pagination structure
      expect(data.pagination).toHaveProperty("page");
      expect(data.pagination).toHaveProperty("limit");
      expect(data.pagination).toHaveProperty("totalCount");
      expect(data.pagination).toHaveProperty("totalPages");
      expect(data.pagination).toHaveProperty("hasMore");

      // Verify types
      expect(typeof data.pagination.page).toBe("number");
      expect(typeof data.pagination.totalCount).toBe("number");
      expect(Array.isArray(data.users)).toBe(true);
    });

    it("should return user objects with required fields", async () => {
      await db.user.create({
        data: {
          username: "testuser",
          displayName: "Test User",
          email: "user@test.com",
          password: "hash",
          role: "USER",
        },
      });

      const url = new URL("http://localhost:3000/api/users");
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(data.users.length).toBeGreaterThan(0);

      const user = data.users.find((u: any) => u.username === "testuser");
      expect(user).toBeDefined();

      // Required fields
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("displayName");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("status");
      expect(user).toHaveProperty("createdAt");

      // Field types
      expect(typeof user.id).toBe("string");
      expect(typeof user.username).toBe("string");
      expect(typeof user.role).toBe("string");
    });

    it("should never expose password field", async () => {
      await db.user.create({
        data: {
          username: "testuser",
          displayName: "Test User",
          email: "user@test.com",
          password: "secrethash",
          role: "USER",
        },
      });

      const url = new URL("http://localhost:3000/api/users");
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      data.users.forEach((user: any) => {
        expect(user).not.toHaveProperty("password");
        expect(user).not.toHaveProperty("passwordHash");
      });
    });
  });

  describe("POST /api/users - Success Response Contract", () => {
    it("should return created user with standard fields", async () => {
      const userData = {
        username: "newuser",
        displayName: "New User",
        email: "new@test.com",
        password: "Password123",
        role: "USER",
      };

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      const response = await POST(request);
      const data = await response.json();

      // Debug: log response if not 201
      if (response.status !== 201) {
        console.log("Response status:", response.status);
        console.log("Response data:", data);
      }

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("username");
      expect(data).toHaveProperty("displayName");
      expect(data).toHaveProperty("email");
      expect(data).toHaveProperty("role");
      expect(data).not.toHaveProperty("password");

      expect(data.username).toBe(userData.username);
      expect(data.email).toBe(userData.email);
    });
  });

  describe("POST /api/users - Error Response Contract", () => {
    it("should return standard error format for missing fields", async () => {
      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(typeof data.error).toBe("string");
      expect(data.error).toContain("required");
    });

    it("should return standard error format for duplicate username", async () => {
      await db.user.create({
        data: {
          username: "existing",
          displayName: "Existing User",
          email: "existing@test.com",
          password: "hash",
          role: "USER",
        },
      });

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          username: "existing",
          displayName: "Another User",
          email: "another@test.com",
          password: "Password123",
          role: "USER",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(typeof data.error).toBe("string");
    });

    it("should return standard error for invalid data types", async () => {
      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          username: "test",
          displayName: "Test",
          email: "test@test.com",
          password: "short", // Too short
          role: "USER",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
    });
  });

  describe("Query Parameter Handling", () => {
    it("should handle pagination parameters", async () => {
      const url = new URL("http://localhost:3000/api/users");
      url.searchParams.set("page", "2");
      url.searchParams.set("limit", "5");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);
    });

    it("should handle search parameter", async () => {
      const url = new URL("http://localhost:3000/api/users");
      url.searchParams.set("search", "test");

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should handle filter parameters", async () => {
      const url = new URL("http://localhost:3000/api/users");
      url.searchParams.set("role", "ADMIN");
      url.searchParams.set("status", "ACTIVE");

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
