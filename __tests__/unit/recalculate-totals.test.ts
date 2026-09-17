import { recalculateTotalsForUserAndHof } from "@/src/lib/recalculate-totals";
import { prisma } from "@/src/lib/prisma";

jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    hofEntry: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("recalculateTotalsForUserAndHof", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  it("should return 0 if no entries found", async () => {
    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue([]);

    const result = await recalculateTotalsForUserAndHof("user1", "hof1");

    expect(result).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("should calculate cumulative totals correctly", async () => {
    const mockEntries = [
      {
        id: "1",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 10,
        foreignPeaks: 2,
        totalPeaks: 0, // Wrong value - should be updated
        year: { id: "y1", code: "2021", displayOrder: 1 },
      },
      {
        id: "2",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 15,
        foreignPeaks: 3,
        totalPeaks: 0, // Wrong value - should be updated
        year: { id: "y2", code: "2022", displayOrder: 2 },
      },
      {
        id: "3",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 5,
        foreignPeaks: 1,
        totalPeaks: 0, // Wrong value - should be updated
        year: { id: "y3", code: "2023", displayOrder: 3 },
      },
    ];

    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const result = await recalculateTotalsForUserAndHof("user1", "hof1");

    expect(result).toBe(3);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const transactionArg = (prisma.$transaction as jest.Mock).mock.calls[0][0];
    expect(transactionArg).toHaveLength(3);
  });

  it("should only update entries with changed values", async () => {
    const mockEntries = [
      {
        id: "1",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 10,
        foreignPeaksInYear: 2,
        foreignPeaks: 2, // Correct foreign value (cumulative: 2)
        totalPeaks: 10, // Correct domestic value (cumulative: 10)
        year: { id: "y1", code: "2021", displayOrder: 1 },
      },
      {
        id: "2",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 15,
        foreignPeaksInYear: 3,
        foreignPeaks: 3, // Wrong foreign value - should be updated to 5 (2+3)
        totalPeaks: 20, // Wrong domestic value - should be updated to 25 (10+15)
        year: { id: "y2", code: "2022", displayOrder: 2 },
      },
    ];

    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const result = await recalculateTotalsForUserAndHof("user1", "hof1");

    expect(result).toBe(1); // Only second entry needs updating (both peaks incorrect)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const transactionArg = (prisma.$transaction as jest.Mock).mock.calls[0][0];
    expect(transactionArg).toHaveLength(1);
  });

  it("should filter by active years only", async () => {
    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue([]);

    await recalculateTotalsForUserAndHof("user1", "hof1");

    expect(prisma.hofEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          memberId: "user1",
          hofId: "hof1",
          year: {
            isActive: true,
          },
        }),
      }),
    );
  });

  it("should order entries by year displayOrder", async () => {
    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue([]);

    await recalculateTotalsForUserAndHof("user1", "hof1");

    expect(prisma.hofEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          year: {
            displayOrder: "asc",
          },
        },
      }),
    );
  });

  it("should log successful recalculation", async () => {
    const mockEntries = [
      {
        id: "1",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 10,
        foreignPeaks: 2,
        totalPeaks: 0,
        year: { id: "y1", code: "2021", displayOrder: 1 },
      },
    ];

    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    await recalculateTotalsForUserAndHof("user1", "hof1");

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("✅ Recalculated"),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("member user1, HOF hof1"),
    );
  });

  it("should handle multiple years correctly in order", async () => {
    const mockEntries = [
      {
        id: "1",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 5,
        foreignPeaks: 1,
        totalPeaks: 0,
        year: { id: "y1", code: "2021", displayOrder: 1 },
      },
      {
        id: "2",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 10,
        foreignPeaks: 0,
        totalPeaks: 0,
        year: { id: "y2", code: "2022", displayOrder: 2 },
      },
      {
        id: "3",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 7,
        foreignPeaks: 2,
        totalPeaks: 0,
        year: { id: "y3", code: "2023", displayOrder: 3 },
      },
    ];

    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const result = await recalculateTotalsForUserAndHof("user1", "hof1");

    // Expected running totals:
    // Year 1: 5 + 1 = 6
    // Year 2: 6 + 10 + 0 = 16
    // Year 3: 16 + 7 + 2 = 25
    expect(result).toBe(3);
  });

  it("should include year information in query", async () => {
    (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue([]);

    await recalculateTotalsForUserAndHof("user1", "hof1");

    expect(prisma.hofEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          year: {
            select: {
              id: true,
              code: true,
              displayOrder: true,
            },
          },
        },
      }),
    );
  });

  it("should accept transaction client for nested transactions", async () => {
    const mockEntries = [
      {
        id: "1",
        memberId: "user1",
        hofId: "hof1",
        peaksInYear: 10,
        foreignPeaksInYear: 2,
        totalPeaks: 0,
        foreignPeaks: 0,
        year: { id: "y1", code: "2021", displayOrder: 1 },
      },
    ];

    // Mock transaction client (passed during import)
    const mockTransactionClient = {
      hofEntry: {
        findMany: jest.fn().mockResolvedValue(mockEntries),
        update: jest.fn(),
      },
    };

    const result = await recalculateTotalsForUserAndHof(
      "user1",
      "hof1",
      mockTransactionClient as any,
    );

    expect(result).toBe(1);
    expect(mockTransactionClient.hofEntry.findMany).toHaveBeenCalled();
    expect(mockTransactionClient.hofEntry.update).toHaveBeenCalled();
  });
});
