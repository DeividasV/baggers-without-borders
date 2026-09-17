/* eslint-disable */
/**
 * HOF Entries API Tests
 * Tests for /api/hof-entries endpoints including CRUD operations and total recalculation
 */

// Mock next-auth BEFORE any imports to prevent jose module issues
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/src/lib/auth", () => ({
  authOptions: {},
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/hof-entries/route";
import { prisma } from "@/src/lib/prisma";
import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";

// Mock prisma
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    hofEntry: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    hallOfFame: {
      findUnique: jest.fn(),
    },
    year: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  },
}));

// Mock recalculate function
jest.mock("@/src/lib/recalculate-totals", () => ({
  recalculateTotalsForUserAndHof: jest.fn(),
}));

import { getServerSession } from "next-auth";

// Mock getServerSession to return admin session
const mockSession = {
  user: {
    id: "test-user-id",
    role: "ADMIN",
    email: "test@test.com",
    username: "testuser",
  },
};

(getServerSession as jest.Mock).mockResolvedValue(mockSession);

describe("HOF Entries API - GET /api/hof-entries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch HOF entries with pagination", async () => {
    const mockEntries = [
      {
        id: "entry-1",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
        totalPeaks: 150,
        peaksInYear: 50,
        foreignPeaks: 10,
        member: { id: "user-1", username: "user1", displayName: "User One" },
        hof: { id: "hof-1", code: "BWB", title: "BWB Hall of Fame" },
        year: { id: "year-1", code: "2023", title: "2023" },
      },
      {
        id: "entry-2",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-2",
        totalPeaks: 200,
        peaksInYear: 50,
        foreignPeaks: 0,
        member: { id: "user-1", username: "user1", displayName: "User One" },
        hof: { id: "hof-1", code: "BWB", title: "BWB Hall of Fame" },
        year: { id: "year-2", code: "2024", title: "2024" },
      },
    ];

    (prisma.hofEntry.count as jest.Mock).mockResolvedValue(25);
    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-entries?page=1&limit=20"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.entries).toHaveLength(2);
    expect(data.entries[0].totalPeaks).toBe(150);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      totalCount: 25,
      totalPages: 2,
      hasMore: true,
    });
  });

  it("should filter entries by member ID", async () => {
    (prisma.hofEntry.count as jest.Mock).mockResolvedValue(5);
    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-entries?memberId=user-123&page=1&limit=20"
    );

    await GET(request);

    const findManyCall = (prisma.hofEntry.findMany as jest.Mock).mock
      .calls[0][0];
    expect(findManyCall.where.memberId).toBe("user-123");
  });

  it("should filter entries by HOF ID", async () => {
    (prisma.hofEntry.count as jest.Mock).mockResolvedValue(10);
    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-entries?hofId=hof-456&page=1&limit=20"
    );

    await GET(request);

    const findManyCall = (prisma.hofEntry.findMany as jest.Mock).mock
      .calls[0][0];
    expect(findManyCall.where.hofId).toBe("hof-456");
  });

  it("should filter entries by year ID", async () => {
    (prisma.hofEntry.count as jest.Mock).mockResolvedValue(15);
    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-entries?yearId=year-789&page=1&limit=20"
    );

    await GET(request);

    const findManyCall = (prisma.hofEntry.findMany as jest.Mock).mock
      .calls[0][0];
    expect(findManyCall.where.yearId).toBe("year-789");
  });

  it("should not filter when filter value is ALL", async () => {
    (prisma.hofEntry.count as jest.Mock).mockResolvedValue(100);
    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-entries?memberId=ALL&hofId=ALL&yearId=ALL&page=1&limit=20"
    );

    await GET(request);

    const findManyCall = (prisma.hofEntry.findMany as jest.Mock).mock
      .calls[0][0];
    expect(findManyCall.where).toEqual({});
  });

  it("should handle errors gracefully", async () => {
    (prisma.hofEntry.count as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/hof-entries?page=1&limit=20"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch HOF entries");
  });
});

describe("HOF Entries API - POST /api/hof-entries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new HOF entry with valid data", async () => {
    const mockEntry = {
      id: "new-entry-1",
      memberId: "user-1",
      hofId: "hof-1",
      yearId: "year-1",
      totalPeaks: 50,
      peaksInYear: 50,
      foreignPeaks: 10,
      foreignPeaksInYear: 10,
      member: { id: "user-1", username: "user1", displayName: "User One" },
      hof: { id: "hof-1", code: "BWB", title: "BWB Hall of Fame" },
      year: { id: "year-1", code: "2023", title: "2023" },
    };

    (prisma.hallOfFame.findUnique as jest.Mock).mockResolvedValue({
      id: "hof-1",
      isActive: true,
    });
    (prisma.year.findUnique as jest.Mock).mockResolvedValue({
      id: "year-1",
      isActive: true,
    });
    (prisma.hofEntry.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.hofEntry.create as jest.Mock).mockResolvedValue(mockEntry);
    (prisma.hofEntry.findUnique as jest.Mock)
      .mockResolvedValueOnce(null) // For checking existing
      .mockResolvedValueOnce(mockEntry); // For fetching updated entry
    (recalculateTotalsForUserAndHof as jest.Mock).mockResolvedValue(1);

    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
        totalPeaks: 50,
        peaksInYear: 50,
        foreignPeaks: 10,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.totalPeaks).toBe(50);
    expect(recalculateTotalsForUserAndHof).toHaveBeenCalledWith(
      "user-1",
      "hof-1"
    );
  });

  it("should reject entry creation with missing required fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: "user-1",
        // Missing hofId and yearId
        totalPeaks: 50,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Member, HOF, and Year are required");
  });

  it("should reject entry for non-existent HOF", async () => {
    (prisma.hallOfFame.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: "user-1",
        hofId: "non-existent-hof",
        yearId: "year-1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Hall of Fame not found");
  });

  it("should reject entry for inactive HOF", async () => {
    (prisma.hallOfFame.findUnique as jest.Mock).mockResolvedValue({
      id: "hof-1",
      isActive: false,
    });

    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Cannot create entries for inactive Hall of Fame");
  });

  it("should reject entry for non-existent year", async () => {
    (prisma.hallOfFame.findUnique as jest.Mock).mockResolvedValue({
      id: "hof-1",
      isActive: true,
    });
    (prisma.year.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "non-existent-year",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Year not found");
  });

  it("should reject entry for inactive year", async () => {
    (prisma.hallOfFame.findUnique as jest.Mock).mockResolvedValue({
      id: "hof-1",
      isActive: true,
    });
    (prisma.year.findUnique as jest.Mock).mockResolvedValue({
      id: "year-1",
      isActive: false,
    });

    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Cannot create entries for inactive Year");
  });

  it("should reject duplicate entry", async () => {
    (prisma.hallOfFame.findUnique as jest.Mock).mockResolvedValue({
      id: "hof-1",
      isActive: true,
    });
    (prisma.year.findUnique as jest.Mock).mockResolvedValue({
      id: "year-1",
      isActive: true,
    });
    (prisma.hofEntry.findUnique as jest.Mock).mockResolvedValue({
      id: "existing-entry",
      memberId: "user-1",
      hofId: "hof-1",
      yearId: "year-1",
    });

    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("already exists");
  });

  it("should default peaks to 0 when not provided", async () => {
    (prisma.hallOfFame.findUnique as jest.Mock).mockResolvedValue({
      isActive: true,
    });
    (prisma.year.findUnique as jest.Mock).mockResolvedValue({
      isActive: true,
    });
    (prisma.hofEntry.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "entry-1",
        totalPeaks: 0,
        peaksInYear: 0,
        foreignPeaks: 0,
      });
    (prisma.hofEntry.create as jest.Mock).mockResolvedValue({
      id: "entry-1",
    });
    (recalculateTotalsForUserAndHof as jest.Mock).mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
        // No peaks provided
      }),
    });

    await POST(request);

    expect(prisma.hofEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalPeaks: 0,
          peaksInYear: 0,
          foreignPeaks: 0,
        }),
      })
    );
  });

  it("should handle errors gracefully", async () => {
    (prisma.hallOfFame.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const request = new NextRequest("http://localhost:3000/api/hof-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create HOF entry");
  });
});

describe("Total Recalculation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should recalculate totals correctly for multiple years", async () => {
    const mockEntries = [
      {
        id: "entry-1",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
        totalPeaks: 0, // Will be recalculated
        peaksInYear: 50,
        foreignPeaksInYear: 10,
        year: { id: "year-1", code: "2023", displayOrder: 1 },
      },
      {
        id: "entry-2",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-2",
        totalPeaks: 0, // Will be recalculated
        peaksInYear: 40,
        foreignPeaksInYear: 5,
        year: { id: "year-2", code: "2024", displayOrder: 2 },
      },
      {
        id: "entry-3",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-3",
        totalPeaks: 0, // Will be recalculated
        peaksInYear: 30,
        foreignPeaksInYear: 0,
        year: { id: "year-3", code: "2025", displayOrder: 3 },
      },
    ];

    // Unmock for this specific test
    jest.unmock("@/src/lib/recalculate-totals");

    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
    (prisma.hofEntry.update as jest.Mock).mockImplementation((args) =>
      Promise.resolve({ ...args.data })
    );

    const { recalculateTotalsForUserAndHof: realRecalc } = jest.requireActual(
      "@/src/lib/recalculate-totals"
    );

    const updatedCount = await realRecalc("user-1", "hof-1");

    expect(updatedCount).toBe(3);
    expect(prisma.hofEntry.update).toHaveBeenCalledTimes(3);

    // Year 1: totalPeaks = 50, foreignPeaks = 10
    expect(prisma.hofEntry.update).toHaveBeenCalledWith({
      where: { id: "entry-1" },
      data: { totalPeaks: 50, foreignPeaks: 10 },
    });

    // Year 2: totalPeaks = 90, foreignPeaks = 15
    expect(prisma.hofEntry.update).toHaveBeenCalledWith({
      where: { id: "entry-2" },
      data: { totalPeaks: 90, foreignPeaks: 15 },
    });

    // Year 3: totalPeaks = 120, foreignPeaks = 15
    expect(prisma.hofEntry.update).toHaveBeenCalledWith({
      where: { id: "entry-3" },
      data: { totalPeaks: 120, foreignPeaks: 15 },
    });
  });
});
