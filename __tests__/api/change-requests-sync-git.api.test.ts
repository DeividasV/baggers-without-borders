import { NextRequest } from "next/server";

jest.mock("@/src/lib/api-auth", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    changeRequest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    changeRequestTicketCounter: {
      findFirst: jest.fn(),
    },
    appSetting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { POST } from "@/app/api/change-requests/sync-git/route";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

describe("change request sync git API", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    (prisma.changeRequest.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.changeRequestTicketCounter.findFirst as jest.Mock).mockResolvedValue(null);
  });

  afterAll(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
  });

  it("returns 503 when the friendly ticket migration is missing", async () => {
    (prisma.changeRequest.findFirst as jest.Mock).mockRejectedValueOnce(
      new Error("no such column: ticketNumber")
    );

    const response = await POST(
      new NextRequest("http://localhost/api/change-requests/sync-git", {
        method: "POST",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain("database migrations");
  });

  it("rejects non-admin users", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({
      user: {
        id: "user-1",
        role: "USER",
      },
    });

    const response = await POST(
      new NextRequest("http://localhost/api/change-requests/sync-git", {
        method: "POST",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });
});
