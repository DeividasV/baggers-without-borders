/* eslint-disable */
/**
 * Journal Children API Tests
 * Tests for /api/journal/[id]/children endpoint (publish-time ordering + validation)
 */

jest.mock("@/src/lib/api-auth", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    journal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { NextRequest } from "next/server";
import { PUT } from "@/app/api/journal/[id]/children/route";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

describe("Journal Children API - PUT /api/journal/[id]/children", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    (getSession as jest.Mock).mockRejectedValueOnce(new Error("no session"));

    const request = new NextRequest(
      "http://localhost:3000/api/journal/p1/children",
      {
        method: "PUT",
        body: JSON.stringify({ childIds: [] }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 403 when not admin", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({ user: { role: "USER" } });

    const request = new NextRequest(
      "http://localhost:3000/api/journal/p1/children",
      {
        method: "PUT",
        body: JSON.stringify({ childIds: [] }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(response.status).toBe(403);
  });

  it("returns 400 when too many childIds", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({
      user: { role: "ADMIN" },
    });

    (prisma.journal.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "p1",
      parentId: null,
    });

    const childIds = Array.from({ length: 201 }, (_, i) => `c${i}`);

    const request = new NextRequest(
      "http://localhost:3000/api/journal/p1/children",
      {
        method: "PUT",
        body: JSON.stringify({ childIds }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/Too many childIds/i);
  });

  it("returns 400 when cycle would be created (ancestor assigned as child)", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({
      user: { role: "ADMIN" },
    });

    // First: load parent
    (prisma.journal.findUnique as jest.Mock).mockImplementation(
      ({ where }: any) => {
        if (where?.id === "p1")
          return Promise.resolve({ id: "p1", parentId: "a1" });
        if (where?.id === "a1") return Promise.resolve({ parentId: null });
        return Promise.resolve(null);
      },
    );

    const request = new NextRequest(
      "http://localhost:3000/api/journal/p1/children",
      {
        method: "PUT",
        body: JSON.stringify({ childIds: ["a1"] }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/cycle/i);
  });

  it("orders children by publishedAt (oldest first) and returns children list", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({
      user: { role: "ADMIN" },
    });

    (prisma.journal.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "p1",
      parentId: null,
    });

    (prisma.journal.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: "c1",
        publishedAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "c2",
        publishedAt: new Date("2026-02-01T00:00:00.000Z"),
        updatedAt: new Date("2026-02-02T00:00:00.000Z"),
      },
      {
        id: "c3",
        publishedAt: null,
        updatedAt: new Date("2026-02-03T00:00:00.000Z"),
      },
    ]);

    const tx = {
      journal: {
        updateMany: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          {
            id: "c1",
            title: "Child 1",
            slug: "child-1",
            status: "PUBLISHED",
            parentId: "p1",
            childOrder: 0,
            publishedAt: new Date("2026-01-01T00:00:00.000Z"),
          },
          {
            id: "c2",
            title: "Child 2",
            slug: "child-2",
            status: "PUBLISHED",
            parentId: "p1",
            childOrder: 1,
            publishedAt: new Date("2026-02-01T00:00:00.000Z"),
          },
          {
            id: "c3",
            title: "Child 3",
            slug: "child-3",
            status: "DRAFT",
            parentId: "p1",
            childOrder: 2,
            publishedAt: null,
          },
        ]),
      },
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) =>
      fn(tx),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/journal/p1/children",
      {
        method: "PUT",
        body: JSON.stringify({ childIds: ["c2", "c3", "c1"] }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.children).toHaveLength(3);
    expect(tx.journal.updateMany).toHaveBeenCalled();
    expect(tx.journal.update).toHaveBeenCalledTimes(3);

    // childOrder must follow publish-time ordering (published first, oldest first), then drafts.
    expect(tx.journal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: expect.objectContaining({ parentId: "p1", childOrder: 0 }),
      }),
    );
    expect(tx.journal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c2" },
        data: expect.objectContaining({ parentId: "p1", childOrder: 1 }),
      }),
    );
    expect(tx.journal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c3" },
        data: expect.objectContaining({ parentId: "p1", childOrder: 2 }),
      }),
    );
  });
});
