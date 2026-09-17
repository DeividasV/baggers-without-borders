/* eslint-disable */
/**
 * Journal List API Tests
 * Tests for /api/journal endpoint status filtering
 */

jest.mock("@/src/lib/api-auth", () => ({
  getOptionalSession: jest.fn(),
}));

jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    journal: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/journal/route";
import { getOptionalSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

describe("Journal API - GET /api/journal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("defaults to PUBLISHED-only for anonymous", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValueOnce(null);

    (prisma.journal.findMany as jest.Mock).mockResolvedValueOnce([]);
    (prisma.journal.count as jest.Mock).mockResolvedValueOnce(0);

    const request = new NextRequest(
      "http://localhost:3000/api/journal?page=1&limit=12",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.journal.findMany as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PUBLISHED" }),
      }),
    );
  });

  it("allows admin to request specific status filter", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValueOnce({
      user: { role: "ADMIN" },
    });

    (prisma.journal.findMany as jest.Mock).mockResolvedValueOnce([]);
    (prisma.journal.count as jest.Mock).mockResolvedValueOnce(0);

    const request = new NextRequest(
      "http://localhost:3000/api/journal?page=1&limit=12&status=DRAFT",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.journal.findMany as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "DRAFT" }),
      }),
    );
  });

  it("returns 400 for invalid status when admin provides status", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValueOnce({
      user: { role: "ADMIN" },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/journal?page=1&limit=12&status=NOT_A_STATUS",
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("allows admin to request a type filter", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValueOnce({
      user: { role: "ADMIN" },
    });

    (prisma.journal.findMany as jest.Mock).mockResolvedValueOnce([]);
    (prisma.journal.count as jest.Mock).mockResolvedValueOnce(0);

    const request = new NextRequest(
      "http://localhost:3000/api/journal?page=1&limit=12&type=awards",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.journal.findMany as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: { in: ["awards"] },
        }),
      }),
    );
  });

  it("returns 400 for invalid type filter", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValueOnce({
      user: { role: "ADMIN" },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/journal?page=1&limit=12&type=not-a-type",
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
