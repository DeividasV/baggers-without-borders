/**
 * Unit Tests: Consent Checking Logic
 * Tests src/lib/consent-check.ts functions
 */

import { checkMissingRequiredConsents } from "@/src/lib/consent-check";
import { prisma } from "@/src/lib/prisma";

// Mock Prisma
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    userConsent: {
      findMany: jest.fn(),
    },
  },
}));

describe("checkMissingRequiredConsents", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array when user has all consents", async () => {
    (prisma.userConsent.findMany as jest.Mock).mockResolvedValue([]);

    const result = await checkMissingRequiredConsents("user-123");

    expect(result).toEqual([]);
  });

  it("should return missing Privacy Policy consent", async () => {
    const mockConsent = {
      id: "consent-1",
      userId: "user-123",
      consentTypeId: "type-1",
      dateGiven: null,
      isRequired: true,
      consentType: {
        id: "type-1",
        title: "Privacy Policy",
        description: "Privacy policy consent",
        status: "ACTIVE",
      },
    };

    (prisma.userConsent.findMany as jest.Mock).mockResolvedValue([mockConsent]);

    const result = await checkMissingRequiredConsents("user-123");

    expect(result).toHaveLength(1);
    expect(result[0].consentType.title).toBe("Privacy Policy");
  });

  it("should return missing Terms of Service consent", async () => {
    const mockConsent = {
      id: "consent-2",
      userId: "user-123",
      consentTypeId: "type-2",
      dateGiven: null,
      isRequired: true,
      consentType: {
        id: "type-2",
        title: "Terms of Service",
        description: "Terms of service consent",
        status: "ACTIVE",
      },
    };

    (prisma.userConsent.findMany as jest.Mock).mockResolvedValue([mockConsent]);

    const result = await checkMissingRequiredConsents("user-123");

    expect(result).toHaveLength(1);
    expect(result[0].consentType.title).toBe("Terms of Service");
  });

  it("should NOT return historical consents", async () => {
    // The function filters via WHERE clause, so the mock should return empty
    // because historical consents don't match the "Privacy Policy" or "Terms of Service" filter
    (prisma.userConsent.findMany as jest.Mock).mockResolvedValue([]);

    const result = await checkMissingRequiredConsents("user-123");

    // Historical consents are filtered at the database level
    expect(result).toHaveLength(0);
    
    // Verify the query includes the title filter
    expect(prisma.userConsent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          consentType: expect.objectContaining({
            title: {
              in: ["Privacy Policy", "Terms of Service"],
            },
          }),
        }),
      })
    );
  });

  it("should return both Privacy Policy and Terms of Service if missing", async () => {
    const mockConsents = [
      {
        id: "consent-1",
        userId: "user-123",
        consentTypeId: "type-1",
        dateGiven: null,
        isRequired: true,
        consentType: {
          id: "type-1",
          title: "Privacy Policy",
          description: "Privacy policy",
          status: "ACTIVE",
        },
      },
      {
        id: "consent-2",
        userId: "user-123",
        consentTypeId: "type-2",
        dateGiven: null,
        isRequired: true,
        consentType: {
          id: "type-2",
          title: "Terms of Service",
          description: "Terms of service",
          status: "ACTIVE",
        },
      },
    ];

    (prisma.userConsent.findMany as jest.Mock).mockResolvedValue(mockConsents);

    const result = await checkMissingRequiredConsents("user-123");

    expect(result).toHaveLength(2);
    const titles = result.map((consent: any) => consent.consentType.title);
    expect(titles).toContain("Privacy Policy");
    expect(titles).toContain("Terms of Service");
  });

  it("should only query for ACTIVE consent types", async () => {
    (prisma.userConsent.findMany as jest.Mock).mockResolvedValue([]);

    await checkMissingRequiredConsents("user-123");

    expect(prisma.userConsent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          consentType: expect.objectContaining({
            status: "ACTIVE",
          }),
        }),
      })
    );
  });

  it("should only query for required consents", async () => {
    (prisma.userConsent.findMany as jest.Mock).mockResolvedValue([]);

    await checkMissingRequiredConsents("user-123");

    expect(prisma.userConsent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isRequired: true,
        }),
      })
    );
  });

  it("should only query for consents with null dateGiven", async () => {
    (prisma.userConsent.findMany as jest.Mock).mockResolvedValue([]);

    await checkMissingRequiredConsents("user-123");

    expect(prisma.userConsent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dateGiven: null,
        }),
      })
    );
  });

  it("should handle database errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    (prisma.userConsent.findMany as jest.Mock).mockRejectedValue(
      new Error("Database connection failed")
    );

    const result = await checkMissingRequiredConsents("user-123");

    // Should return empty array on error and log the error
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error checking missing consents:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
