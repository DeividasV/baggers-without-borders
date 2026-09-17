/* eslint-disable */
/**
 * Users API Tests
 * Tests for /api/users endpoints including CRUD operations, filtering, and pagination
 */

// Mock next-auth BEFORE any imports to prevent jose module issues
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/src/lib/auth", () => ({
  authOptions: {},
}));

import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "@/app/api/users/route";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

jest.mock("@/src/lib/tokens", () => ({
  generateVerificationToken: jest.fn(() => ({
    token: "test-verification-token",
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  })),
}));

jest.mock("@/src/lib/email", () => ({
  sendEmail: jest.fn(() => Promise.resolve({ success: true, emailLogId: "test-email-log" })),
}));

jest.mock("@/src/lib/email-templates", () => ({
  getAdminCreatedUserEmail: jest.fn(() => ({
    subject: "Verify your email",
    htmlContent: "<p>Verify</p>",
    textContent: "Verify",
  })),
}));

// Mock prisma
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    hallOfFame: {
      findMany: jest.fn(),
    },
    year: {
      findMany: jest.fn(),
    },
    userHofParticipation: {
      createMany: jest.fn(),
    },
    userYearParticipation: {
      createMany: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock("bcryptjs");

import { getServerSession } from "next-auth";

// Mock getServerSession to return admin session
const mockSession = {
  user: {
    id: "admin-user-id",
    role: "ADMIN",
    email: "admin@test.com",
    username: "admin",
  },
};

(getServerSession as jest.Mock).mockResolvedValue(mockSession);

describe("Users API - GET /api/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch users with pagination", async () => {
    const mockUsers = [
      {
        id: "user-1",
        username: "testuser1",
        displayName: "Test User 1",
        // password excluded via select in actual query
        role: "USER",
        status: "ACTIVE",
        email: null,
        birthCountry: null,
        residenceCountry: null,
        residenceRegion: null,
      },
      {
        id: "user-2",
        username: "testuser2",
        displayName: "Test User 2",
        // password excluded via select in actual query
        role: "USER",
        status: "ACTIVE",
        email: null,
        birthCountry: null,
        residenceCountry: null,
        residenceRegion: null,
      },
    ];

    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(25) // totalCount
      .mockResolvedValueOnce(20) // activeCount
      .mockResolvedValueOnce(3); // adminCount

    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const request = new NextRequest("http://localhost:3000/api/users?page=1&limit=20");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(2);
    // Password excluded via select in query
    expect(data.users[0].password).toBeUndefined();
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      totalCount: 25,
      totalPages: 2,
      hasMore: true,
    });
    expect(data.stats).toEqual({
      activeCount: 20,
      adminCount: 3,
    });
  });

  it("should filter users by search term", async () => {
    const mockUsers = [
      {
        id: "user-1",
        username: "johndoe",
        displayName: "John Doe",
        password: "hashed",
        role: "USER",
        status: "ACTIVE",
        email: "john@example.com",
        birthCountry: null,
        residenceCountry: null,
        residenceRegion: null,
      },
    ];

    (prisma.user.count as jest.Mock).mockResolvedValue(1);
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const request = new NextRequest("http://localhost:3000/api/users?search=john&page=1&limit=20");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].username).toBe("johndoe");

    // Verify search was applied in the where clause
    const whereClause = (prisma.user.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereClause.AND).toBeDefined();
    expect(whereClause.AND[0].OR).toBeDefined();
  });

  it("should filter users by role", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(3);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/users?role=ADMIN&page=1&limit=20");

    await GET(request);

    const whereClause = (prisma.user.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereClause.AND).toContainEqual({ role: "ADMIN" });
  });

  it("should filter users by birth country", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(5);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/users?birthCountry=US&birthCountry=GB&page=1&limit=20"
    );

    await GET(request);

    const whereClause = (prisma.user.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereClause.AND).toContainEqual({
      birthCountry: { code: { in: ["US", "GB"] } },
    });
  });

  it("should filter users by birth year range", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(10);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/users?birthYearMin=1980&birthYearMax=1990&page=1&limit=20"
    );

    await GET(request);

    const whereClause = (prisma.user.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereClause.AND).toContainEqual({ birthYear: { gte: 1980 } });
    expect(whereClause.AND).toContainEqual({ birthYear: { lte: 1990 } });
  });

  it("should sort users correctly", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(2);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/users?sortBy=givenName&sortOrder=asc&page=1&limit=20"
    );

    await GET(request);

    const orderBy = (prisma.user.findMany as jest.Mock).mock.calls[0][0].orderBy;
    expect(orderBy[0]).toEqual({ givenName: "asc" });
    expect(orderBy[1]).toEqual({ familyName: "asc" });
  });

  it("should handle errors gracefully", async () => {
    (prisma.user.count as jest.Mock).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/users?page=1&limit=20");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch users");
  });
});

describe("Users API - POST /api/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new user with valid data", async () => {
    const mockUser = {
      id: "new-user-1",
      username: "newuser",
      displayName: "New User",
      email: "newuser@test.com",
      role: "USER",
      emailVerified: null, // Legacy form doesn't auto-verify
      createdAt: new Date(),
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
    (prisma.hallOfFame.findMany as jest.Mock).mockResolvedValue([{ id: "hof-1" }, { id: "hof-2" }]);
    (prisma.year.findMany as jest.Mock).mockResolvedValue([{ id: "year-1" }, { id: "year-2" }]);

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "newuser",
        displayName: "New User",
        email: "newuser@test.com",
        password: "change-me-1234",
        role: "USER",
      }),
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201); // Created
    expect(responseData.data).toBeDefined();
    expect(responseData.data.username).toBe("newuser");
    expect(responseData.data.displayName).toBe("New User");
    // Legacy form doesn't auto-verify (only minimal form does)
    expect(responseData.data.emailVerified).toBeNull();
    expect(prisma.userHofParticipation.createMany).toHaveBeenCalled();
    expect(prisma.userYearParticipation.createMany).toHaveBeenCalled();
  });

  it("should create user with minimal form (givenName, familyName, email)", async () => {
    const mockUser = {
      id: "minimal-user",
      username: "john.smith",
      displayName: "John Smith",
      email: "john@example.com",
      password: "hashed_password",
      role: "USER",
      status: "ACTIVE",
      emailVerified: new Date(),
      createdAt: new Date(),
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
    (prisma.hallOfFame.findMany as jest.Mock).mockResolvedValue([{ id: "hof-1" }]);
    (prisma.year.findMany as jest.Mock).mockResolvedValue([{ id: "year-1" }]);

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "John",
        lastName: "Smith",
        email: "john@example.com",
        username: "john.smith", // Minimal form still needs username
      }),
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.data).toBeDefined();
    expect(responseData.data.emailVerified).toBeDefined(); // Auto-verified for admin-created
    expect(responseData.generatedPassword).toBeDefined(); // Password returned for minimal form
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          emailVerified: expect.any(Date), // Should be auto-verified
        }),
      })
    );
  });

  it("should reject user creation with missing fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "newuser",
        // Missing displayName and password
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("should reject invalid username format", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "ab", // Too short
        displayName: "Test User",
        email: "testuser@test.com",
        password: "change-me-1234",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Username must be 3-30 characters");
  });

  it("should reject username with special characters", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "user@name!",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "change-me-1234",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Username must be 3-30 characters");
  });

  it("should reject weak password (too short)", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "pass12", // Too short
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Password must be at least 8 characters long");
  });

  it("should reject weak password (no letters)", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "12345678", // No letters
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Password must contain at least one letter and one number");
  });

  it("should reject weak password (no numbers)", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "password", // No numbers
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Password must contain at least one letter and one number");
  });

  it("should reject invalid role", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "change-me-1234",
        role: "SUPERUSER", // Invalid role
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid role");
  });

  it("should reject duplicate username", async () => {
    // First check is for email (no match), second check is for username (match)
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "existing-user",
      username: "existinguser",
    });

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "existinguser",
        displayName: "Test User",
        email: "new-email@test.com",
        password: "change-me-1234",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Username already exists");
  });

  it("should hash password before saving", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "new-user",
      username: "testuser",
      displayName: "Test User",
      role: "USER",
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password_123");
    (prisma.hallOfFame.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.year.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "plainchange-me-1234",
      }),
    });

    await POST(request);

    expect(bcrypt.hash).toHaveBeenCalledWith("plainchange-me-1234", 12);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: "hashed_password_123",
        }),
      })
    );
  });

  it("should create participation records for all active HOFs", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "new-user",
      username: "testuser",
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
    (prisma.hallOfFame.findMany as jest.Mock).mockResolvedValue([
      { id: "hof-1" },
      { id: "hof-2" },
      { id: "hof-3" },
    ]);
    (prisma.year.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "change-me-1234",
      }),
    });

    await POST(request);

    expect(prisma.userHofParticipation.createMany).toHaveBeenCalledWith({
      data: [
        { userId: "new-user", hofId: "hof-1", enabled: true },
        { userId: "new-user", hofId: "hof-2", enabled: true },
        { userId: "new-user", hofId: "hof-3", enabled: true },
      ],
    });
  });

  it("should create participation records for all active years", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "new-user",
      username: "testuser",
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
    (prisma.hallOfFame.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.year.findMany as jest.Mock).mockResolvedValue([{ id: "year-1" }, { id: "year-2" }]);

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "change-me-1234",
      }),
    });

    await POST(request);

    expect(prisma.userYearParticipation.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "new-user",
          yearId: "year-1",
          enabled: true,
          countryId: null,
        },
        {
          userId: "new-user",
          yearId: "year-2",
          enabled: true,
          countryId: null,
        },
      ],
    });
  });

  it("should handle errors gracefully", async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser",
        displayName: "Test User",
        email: "testuser@test.com",
        password: "change-me-1234",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create user");
  });
});
