/* eslint-disable */

jest.mock("@/src/lib/api-auth", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/src/lib/journal-auth", () => ({
  isJournalEditor: jest.fn(),
}));

jest.mock("@/src/lib/journal-utils", () => ({
  uniqueSlug: jest.fn(),
}));

jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    journal: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/journal/route";
import { PUT } from "@/app/api/journal/[id]/route";
import { getSession } from "@/src/lib/api-auth";
import { uniqueSlug } from "@/src/lib/journal-utils";
import { prisma } from "@/src/lib/prisma";

describe("Journal API table style mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
  });

  it("rejects invalid table style on create", async () => {
    const request = new NextRequest("http://localhost:3000/api/journal", {
      method: "POST",
      body: JSON.stringify({
        title: "My article",
        tableStyle: "not-a-style",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(prisma.journal.create as jest.Mock).not.toHaveBeenCalled();
  });

  it("defaults create to legacy when table style is omitted", async () => {
    (uniqueSlug as jest.Mock).mockResolvedValue("my-article");
    (prisma.journal.create as jest.Mock).mockResolvedValue({
      id: "journal-1",
      title: "My article",
      tableStyle: "legacy",
    });

    const request = new NextRequest("http://localhost:3000/api/journal", {
      method: "POST",
      body: JSON.stringify({
        title: "My article",
        content: "| A |\n| --- |\n| 1 |",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(prisma.journal.create as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tableStyle: "legacy" }),
      })
    );
  });

  it("rejects invalid table style on update", async () => {
    (prisma.journal.findUnique as jest.Mock).mockResolvedValue({
      id: "journal-1",
      status: "DRAFT",
    });

    const request = new NextRequest("http://localhost:3000/api/journal/journal-1", {
      method: "PUT",
      body: JSON.stringify({ tableStyle: "bad-style" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "journal-1" }),
    });

    expect(response.status).toBe(400);
  });

  it("persists a valid table style on update", async () => {
    (prisma.journal.findUnique as jest.Mock).mockResolvedValue({
      id: "journal-1",
      status: "DRAFT",
    });

    const tx = {
      journalAuthor: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      journal: {
        update: jest.fn().mockResolvedValue({
          id: "journal-1",
          tableStyle: "striped",
        }),
      },
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx));

    const request = new NextRequest("http://localhost:3000/api/journal/journal-1", {
      method: "PUT",
      body: JSON.stringify({ tableStyle: "striped" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "journal-1" }),
    });

    expect(response.status).toBe(200);
    expect(tx.journal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tableStyle: "striped" }),
      })
    );
  });
});
