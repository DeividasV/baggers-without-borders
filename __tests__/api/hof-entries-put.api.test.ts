/* eslint-disable */
/**
 * HOF Entries PUT API Tests
 * Tests for PUT /api/hof-entries/[id] endpoint (inline editing functionality)
 */

// Mock next-auth BEFORE any imports to prevent jose module issues
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/src/lib/auth", () => ({
  authOptions: {},
}));

import { NextRequest } from "next/server";
import { PUT, GET } from "@/app/api/hof-entries/[id]/route";
import { prisma } from "@/src/lib/prisma";
import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";

// Mock prisma
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    hofEntry: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  },
}));

// Mock recalculate function
jest.mock("@/src/lib/recalculate-totals", () => ({
  recalculateTotalsForUserAndHof: jest.fn(),
}));

// Mock audit logging
jest.mock("@/src/lib/auditLog", () => ({
  logAdminAction: jest.fn(),
}));

import { getServerSession } from "next-auth";

// Mock getServerSession to return admin session
const mockSession = {
  user: {
    id: "test-admin-id",
    role: "ADMIN",
    email: "admin@test.com",
    username: "adminuser",
  },
};

(getServerSession as jest.Mock).mockResolvedValue(mockSession);

describe("HOF Entries API - PUT /api/hof-entries/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Success Cases", () => {
    it("should update entry with new year statistics", async () => {
      const mockExisting = {
        id: "entry-1",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
        totalPeaks: 100,
        peaksInYear: 20,
        foreignPeaks: 30,
        foreignPeaksInYear: 5,
      };

      const mockUpdated = {
        ...mockExisting,
        totalPeaks: 120,
        peaksInYear: 25,
        foreignPeaks: 35, // Recalculated
        foreignPeaksInYear: 8,
        member: {
          id: "user-1",
          username: "user1",
          displayName: "User One",
        },
        hof: {
          id: "hof-1",
          code: "BWB",
          title: "BWB Hall of Fame",
        },
        year: {
          id: "year-1",
          code: "2024",
          title: "2024",
        },
      };

      (prisma.hofEntry.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockExisting) // First call: check if entry exists
        .mockResolvedValueOnce(mockUpdated); // Second call: fetch updated entry after recalculation
      (prisma.hofEntry.update as jest.Mock).mockResolvedValueOnce(mockUpdated);
      (recalculateTotalsForUserAndHof as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "PUT",
        body: JSON.stringify({
          memberId: "user-1",
          hofId: "hof-1",
          yearId: "year-1",
          totalPeaks: 120,
          peaksInYear: 25,
          foreignPeaksInYear: 8,
        }),
      });

      const response = await PUT(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.totalPeaks).toBe(120);
      expect(data.peaksInYear).toBe(25);
      expect(data.foreignPeaksInYear).toBe(8);
      expect(prisma.hofEntry.update).toHaveBeenCalledWith({
        where: { id: "entry-1" },
        data: expect.objectContaining({
          totalPeaks: 120,
          peaksInYear: 25,
          foreignPeaksInYear: 8,
        }),
        include: expect.any(Object),
      });
      expect(recalculateTotalsForUserAndHof).toHaveBeenCalledWith(
        "user-1",
        "hof-1"
      );
    });

    it("should handle zero values correctly", async () => {
      const mockExisting = {
        id: "entry-1",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
        totalPeaks: 100,
        peaksInYear: 20,
        foreignPeaks: 30,
        foreignPeaksInYear: 5,
      };

      const mockUpdated = {
        ...mockExisting,
        peaksInYear: 0,
        foreignPeaksInYear: 0,
        member: {
          id: "user-1",
          username: "user1",
          displayName: "User One",
        },
        hof: {
          id: "hof-1",
          code: "BWB",
          title: "BWB Hall of Fame",
        },
        year: {
          id: "year-1",
          code: "2024",
          title: "2024",
        },
      };

      (prisma.hofEntry.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockExisting) // First call: check if entry exists
        .mockResolvedValueOnce(mockUpdated); // Second call: fetch updated entry after recalculation
      (prisma.hofEntry.update as jest.Mock).mockResolvedValueOnce(mockUpdated);
      (recalculateTotalsForUserAndHof as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "PUT",
        body: JSON.stringify({
          memberId: "user-1",
          hofId: "hof-1",
          yearId: "year-1",
          totalPeaks: 100,
          peaksInYear: 0,
          foreignPeaksInYear: 0,
        }),
      });

      const response = await PUT(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(200);
      expect(prisma.hofEntry.update).toHaveBeenCalledWith({
        where: { id: "entry-1" },
        data: expect.objectContaining({
          peaksInYear: 0,
          foreignPeaksInYear: 0,
        }),
        include: expect.any(Object),
      });
    });

    it("should allow updating member/hof/year combination", async () => {
      const mockExisting = {
        id: "entry-1",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
        totalPeaks: 100,
        peaksInYear: 20,
        foreignPeaks: 30,
        foreignPeaksInYear: 5,
      };

      const mockUpdatedWithNewMember = {
        ...mockExisting,
        memberId: "user-2",
        member: {
          id: "user-2",
          username: "user2",
          displayName: "User Two",
        },
        hof: {
          id: "hof-1",
          code: "BWB",
          title: "BWB Hall of Fame",
        },
        year: {
          id: "year-1",
          code: "2024",
          title: "2024",
        },
      };

      (prisma.hofEntry.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockExisting) // First call: check if entry exists
        .mockResolvedValueOnce(null) // Second call: check for duplicate
        .mockResolvedValueOnce(mockUpdatedWithNewMember); // Third call: fetch updated entry after recalculation

      (prisma.hofEntry.update as jest.Mock).mockResolvedValueOnce(
        mockUpdatedWithNewMember
      );
      (recalculateTotalsForUserAndHof as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "PUT",
        body: JSON.stringify({
          memberId: "user-2",
          hofId: "hof-1",
          yearId: "year-1",
          totalPeaks: 100,
          peaksInYear: 20,
          foreignPeaksInYear: 5,
        }),
      });

      const response = await PUT(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Validation Errors", () => {
    it("should return 400 if memberId is missing", async () => {
      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "PUT",
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          peaksInYear: 25,
          foreignPeaksInYear: 8,
        }),
      });

      const response = await PUT(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Member, HOF, and Year are required");
    });

    it("should return 400 if hofId is missing", async () => {
      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "PUT",
        body: JSON.stringify({
          memberId: "user-1",
          yearId: "year-1",
          peaksInYear: 25,
          foreignPeaksInYear: 8,
        }),
      });

      const response = await PUT(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Member, HOF, and Year are required");
    });

    it("should return 400 if yearId is missing", async () => {
      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "PUT",
        body: JSON.stringify({
          memberId: "user-1",
          hofId: "hof-1",
          peaksInYear: 25,
          foreignPeaksInYear: 8,
        }),
      });

      const response = await PUT(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Member, HOF, and Year are required");
    });
  });

  describe("Not Found Errors", () => {
    it("should return 404 if entry does not exist", async () => {
      (prisma.hofEntry.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "PUT",
        body: JSON.stringify({
          memberId: "user-1",
          hofId: "hof-1",
          yearId: "year-1",
          totalPeaks: 120,
          peaksInYear: 25,
          foreignPeaksInYear: 8,
        }),
      });

      const response = await PUT(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain("HOF entry not found");
    });
  });

  describe("Duplicate Detection", () => {
    it("should return 400 if new combination already exists", async () => {
      const mockExisting = {
        id: "entry-1",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
        totalPeaks: 100,
        peaksInYear: 20,
        foreignPeaks: 30,
        foreignPeaksInYear: 5,
      };

      const mockDuplicate = {
        id: "entry-2",
        memberId: "user-2",
        hofId: "hof-1",
        yearId: "year-1",
        totalPeaks: 50,
        peaksInYear: 10,
        foreignPeaks: 15,
        foreignPeaksInYear: 3,
      };

      (prisma.hofEntry.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockExisting) // Existence check
        .mockResolvedValueOnce(mockDuplicate); // Duplicate check

      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "PUT",
        body: JSON.stringify({
          memberId: "user-2",
          hofId: "hof-1",
          yearId: "year-1",
          totalPeaks: 120,
          peaksInYear: 25,
          foreignPeaksInYear: 8,
        }),
      });

      const response = await PUT(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain(
        "An entry for this member, HOF, and year combination already exists"
      );
    });
  });

  describe("GET /api/hof-entries/[id]", () => {
    it("should fetch a specific entry by ID", async () => {
      const mockEntry = {
        id: "entry-1",
        memberId: "user-1",
        hofId: "hof-1",
        yearId: "year-1",
        totalPeaks: 120,
        peaksInYear: 25,
        foreignPeaks: 35,
        foreignPeaksInYear: 8,
        member: {
          id: "user-1",
          username: "user1",
          displayName: "User One",
        },
        hof: {
          id: "hof-1",
          code: "BWB",
          title: "BWB Hall of Fame",
        },
        year: {
          id: "year-1",
          code: "2024",
          title: "2024",
        },
      };

      (prisma.hofEntry.findUnique as jest.Mock).mockResolvedValueOnce(
        mockEntry
      );

      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "GET",
      });

      const response = await GET(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("entry-1");
      expect(data.member).toBeDefined();
      expect(data.hof).toBeDefined();
      expect(data.year).toBeDefined();
    });

    it("should return 404 if entry not found", async () => {
      (prisma.hofEntry.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost/api/hof-entries/entry-1", {
        method: "GET",
      });

      const response = await GET(req, {
        params: Promise.resolve({ id: "entry-1" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain("HOF entry not found");
    });
  });
});
