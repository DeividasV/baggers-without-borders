/* eslint-disable */
/**
 * HOF Year Configs API Tests
 * Tests for /api/hof-year-configs endpoints including configuration management and LCE settings
 */

// Mock next-auth BEFORE any imports to prevent jose module issues
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/src/lib/auth", () => ({
  authOptions: {},
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/hof-year-configs/route";
import { PUT } from "@/app/api/hof-year-configs/[id]/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/src/lib/prisma";
import {
  createMockHofYearConfig,
  createMockConfigWithHofmeister,
} from "../utils/test-data-factory";

// Mock prisma
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    hofYearConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    countryLceConfig: {
      createMany: jest.fn(),
    },
  },
}));

// Set up default admin session mock that can be overridden per test
(getServerSession as jest.Mock).mockResolvedValue({
  user: { id: "admin-1", role: "ADMIN" },
});

describe("HOF Year Configs API - GET /api/hof-year-configs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject unauthenticated requests", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should fetch all configs for authenticated user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const mockConfigs = [
      {
        id: "config-1",
        hofId: "hof-1",
        yearId: "year-1",
        minPeaks: 50,
        minForeignPeaks: 5,
        minFpr: 0.1,
        minimumAge: 18,
        lceEnabled: true,
        lceMinFpr: 0.15,
        notes: "",
        hof: {
          id: "hof-1",
          code: "BWB",
          title: "BWB Hall of Fame",
          isActive: true,
        },
        year: { id: "year-1", code: "2023", title: "2023", isActive: true },
        lceCountries: [
          {
            id: "lce-1",
            hofYearConfigId: "config-1",
            countryId: "country-1",
            hasLce: true,
            country: { id: "country-1", code: "US", name: "United States" },
          },
        ],
      },
    ];

    prisma.hofYearConfig.findMany.mockResolvedValue(mockConfigs);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].minPeaks).toBe(50);
    expect(data[0].lceEnabled).toBe(true);
    expect(data[0].lceCountries).toHaveLength(1);
  });

  it("should filter configs by HOF ID", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    prisma.hofYearConfig.findMany.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs?hofId=hof-123"
    );

    await GET(request);

    expect(prisma.hofYearConfig.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hofId: "hof-123" },
      })
    );
  });

  it("should filter configs by year ID", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    prisma.hofYearConfig.findMany.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs?yearId=year-456"
    );

    await GET(request);

    expect(prisma.hofYearConfig.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { yearId: "year-456" },
      })
    );
  });

  it("should filter configs by both HOF and year ID", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    prisma.hofYearConfig.findMany.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs?hofId=hof-123&yearId=year-456"
    );

    await GET(request);

    expect(prisma.hofYearConfig.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hofId: "hof-123", yearId: "year-456" },
      })
    );
  });

  it("should handle errors gracefully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    prisma.hofYearConfig.findMany.mockRejectedValue(
      new Error("Database error")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch configurations");
  });
});

describe("HOF Year Configs API - POST /api/hof-year-configs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject unauthenticated requests", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hofId: "hof-1", yearId: "year-1" }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should reject non-admin requests", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hofId: "hof-1", yearId: "year-1" }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should create a new config with valid data", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const mockConfig = {
      id: "config-1",
      hofId: "hof-1",
      yearId: "year-1",
      minPeaks: 50,
      minForeignPeaks: 5,
      minFpr: 0.1,
      minimumAge: 18,
      lceEnabled: false,
      lceMinFpr: null,
      notes: "Test config",
      hof: { id: "hof-1", code: "BWB", title: "BWB Hall of Fame" },
      year: { id: "year-1", code: "2023", title: "2023" },
      lceCountries: [],
    };

    prisma.hofYearConfig.findUnique.mockResolvedValue(null);
    prisma.hofYearConfig.create.mockResolvedValue(mockConfig);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          minPeaks: 50,
          minForeignPeaks: 5,
          minFpr: 0.1,
          minimumAge: 18,
          notes: "Test config",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.minPeaks).toBe(50);
    expect(data.minForeignPeaks).toBe(5);
  });

  it("should reject config creation without required fields", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Missing hofId and yearId
          minPeaks: 50,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("HoF ID and Year ID are required");
  });

  it("should reject duplicate config", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    prisma.hofYearConfig.findUnique.mockResolvedValue({
      id: "existing-config",
      hofId: "hof-1",
      yearId: "year-1",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          minPeaks: 50,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("already exists");
  });

  it("should default numeric fields to 0 when not provided", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    prisma.hofYearConfig.findUnique.mockResolvedValue(null);
    prisma.hofYearConfig.create.mockResolvedValue({
      id: "config-1",
      hofId: "hof-1",
      yearId: "year-1",
      hof: {},
      year: {},
      lceCountries: [],
    });

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          // No numeric fields provided
        }),
      }
    );

    await POST(request);

    expect(prisma.hofYearConfig.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          minPeaks: 0,
          minForeignPeaks: 0,
          minFpr: 0,
          minimumAge: 0,
          lceEnabled: false,
        }),
      })
    );
  });

  it("should create LCE country mappings when provided", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    prisma.hofYearConfig.findUnique.mockResolvedValue(null);
    prisma.hofYearConfig.create.mockResolvedValue({
      id: "config-1",
      hofId: "hof-1",
      yearId: "year-1",
      hof: {},
      year: {},
      lceCountries: [],
    });

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          minPeaks: 50,
          lceEnabled: true,
          lceMinFpr: 0.15,
          lceCountryIds: ["country-1", "country-2", "country-3"],
        }),
      }
    );

    await POST(request);

    expect(prisma.countryLceConfig.createMany).toHaveBeenCalledWith({
      data: [
        { hofYearConfigId: "config-1", countryId: "country-1", hasLce: true },
        { hofYearConfigId: "config-1", countryId: "country-2", hasLce: true },
        { hofYearConfigId: "config-1", countryId: "country-3", hasLce: true },
      ],
    });
  });

  it("should not create LCE mappings when LCE is disabled", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    prisma.hofYearConfig.findUnique.mockResolvedValue(null);
    prisma.hofYearConfig.create.mockResolvedValue({
      id: "config-1",
      hof: {},
      year: {},
      lceCountries: [],
    });

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          minPeaks: 50,
          lceEnabled: false,
          lceCountryIds: ["country-1", "country-2"],
        }),
      }
    );

    await POST(request);

    expect(prisma.countryLceConfig.createMany).not.toHaveBeenCalled();
  });

  it("should not create LCE mappings when no countries are provided", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    prisma.hofYearConfig.findUnique.mockResolvedValue(null);
    prisma.hofYearConfig.create.mockResolvedValue({
      id: "config-1",
      hof: {},
      year: {},
      lceCountries: [],
    });

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          minPeaks: 50,
          lceEnabled: true,
          lceCountryIds: [],
        }),
      }
    );

    await POST(request);

    expect(prisma.countryLceConfig.createMany).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    prisma.hofYearConfig.findUnique.mockRejectedValue(
      new Error("Database error")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          minPeaks: 50,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create configuration");
  });
});

describe("HOF Year Configs API - Hofmeister Assignment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create config with hofmeisterId", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const mockConfig = createMockConfigWithHofmeister(
      { id: "config-1", hofmeisterId: "user-123" },
      { id: "user-123", displayName: "John Doe", username: "johndoe" }
    );

    prisma.hofYearConfig.findUnique.mockResolvedValue(null);
    prisma.hofYearConfig.create.mockResolvedValue(mockConfig);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          hofmeisterId: "user-123",
          minPeaks: 50,
          minForeignPeaks: 5,
          minFpr: 0.1,
          minimumAge: 18,
          notes: "Test config",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.hofmeisterId).toBe("user-123");
    expect(data.hofmeister).toBeDefined();
    expect(data.hofmeister.displayName).toBe("John Doe");
    expect(prisma.hofYearConfig.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hofmeisterId: "user-123",
        }),
      })
    );
  });

  it("should create config without hofmeisterId (optional)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const mockConfig = createMockHofYearConfig({
      id: "config-1",
      hofmeisterId: null,
      hofmeister: null,
    });

    prisma.hofYearConfig.findUnique.mockResolvedValue(null);
    prisma.hofYearConfig.create.mockResolvedValue(mockConfig);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          minPeaks: 50,
          minForeignPeaks: 5,
          minFpr: 0.1,
          minimumAge: 18,
          notes: "Test config",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.hofmeisterId).toBeNull();
    expect(data.hofmeister).toBeNull();
  });

  it("should include hofmeister details in GET response", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const mockConfigs = [
      {
        id: "config-1",
        hofId: "hof-1",
        yearId: "year-1",
        hofmeisterId: "user-123",
        minPeaks: 50,
        minForeignPeaks: 5,
        minFpr: 0.1,
        minimumAge: 18,
        lceEnabled: false,
        lceMinFpr: null,
        notes: "Test config",
        hof: {
          id: "hof-1",
          code: "BWB",
          title: "BWB Hall of Fame",
          displayOrder: 1,
        },
        year: { id: "year-1", code: "2023", title: "2023" },
        hofmeister: {
          id: "user-123",
          displayName: "Jane Smith",
          username: "janesmith",
        },
        lceCountries: [],
      },
    ];

    prisma.hofYearConfig.findMany.mockResolvedValue(mockConfigs);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].hofmeister).toBeDefined();
    expect(data[0].hofmeister.displayName).toBe("Jane Smith");
    expect(data[0].hofmeister.username).toBe("janesmith");
    expect(prisma.hofYearConfig.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          hofmeister: expect.objectContaining({
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          }),
        }),
      })
    );
  });

  it("should update config to assign hofmeister", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const existingConfig = {
      id: "config-1",
      hofId: "hof-1",
      yearId: "year-1",
      hofmeisterId: null,
      minPeaks: 50,
      minForeignPeaks: 5,
      minFpr: 0.1,
      minimumAge: 18,
      minPeaksEnabled: true,
      minForeignPeaksEnabled: true,
      minFprEnabled: true,
      minimumAgeEnabled: true,
      lceEnabled: false,
      lceMinFpr: null,
      notes: "Test config",
    };

    const updatedConfig = {
      ...existingConfig,
      hofmeisterId: "user-456",
      hofmeister: {
        id: "user-456",
        displayName: "Bob Manager",
        username: "bobmanager",
      },
      hof: { id: "hof-1", code: "BWB", title: "BWB Hall of Fame" },
      year: { id: "year-1", code: "2023", title: "2023" },
      lceCountries: [],
    };

    prisma.hofYearConfig.findUnique
      .mockResolvedValueOnce(existingConfig) // First call to check existence
      .mockResolvedValueOnce(updatedConfig); // Second call to fetch updated config with relations
    prisma.hofYearConfig.update.mockResolvedValue(updatedConfig);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs/config-1",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofmeisterId: "user-456",
        }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "config-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hofmeisterId).toBe("user-456");
    expect(data.hofmeister).toBeDefined();
    expect(data.hofmeister.displayName).toBe("Bob Manager");
    expect(prisma.hofYearConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "config-1" },
        data: expect.objectContaining({
          hofmeisterId: "user-456",
        }),
      })
    );
  });

  it("should update config to remove hofmeister", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const existingConfig = {
      id: "config-1",
      hofId: "hof-1",
      yearId: "year-1",
      hofmeisterId: "user-456",
      minPeaks: 50,
      minForeignPeaks: 5,
      minFpr: 0.1,
      minimumAge: 18,
      minPeaksEnabled: true,
      minForeignPeaksEnabled: true,
      minFprEnabled: true,
      minimumAgeEnabled: true,
      lceEnabled: false,
      lceMinFpr: null,
      notes: "Test config",
    };

    const updatedConfig = {
      ...existingConfig,
      hofmeisterId: null,
      hofmeister: null,
      hof: { id: "hof-1", code: "BWB", title: "BWB Hall of Fame" },
      year: { id: "year-1", code: "2023", title: "2023" },
      lceCountries: [],
    };

    prisma.hofYearConfig.findUnique
      .mockResolvedValueOnce(existingConfig) // First call to check existence
      .mockResolvedValueOnce(updatedConfig); // Second call to fetch updated config with relations
    prisma.hofYearConfig.update.mockResolvedValue(updatedConfig);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs/config-1",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofmeisterId: null,
        }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "config-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hofmeisterId).toBeNull();
    expect(data.hofmeister).toBeNull();
  });
});

describe("HOF Year Configs API - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject invalid hofmeisterId (non-existent user)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    // Mock Prisma to reject foreign key constraint
    prisma.hofYearConfig.findUnique.mockResolvedValue(null);
    prisma.hofYearConfig.create.mockRejectedValue({
      code: "P2003",
      meta: { field_name: "hofmeisterId" },
      message: "Foreign key constraint failed",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          hofmeisterId: "invalid-user-999",
          minPeaks: 50,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create configuration");
  });

  it("should handle empty string hofmeisterId as null", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const mockConfig = {
      id: "config-1",
      hofId: "hof-1",
      yearId: "year-1",
      hofmeisterId: null,
      minPeaks: 50,
      minForeignPeaks: 5,
      minFpr: 0.1,
      minimumAge: 18,
      lceEnabled: false,
      lceMinFpr: null,
      notes: null,
      hof: { id: "hof-1", code: "BWB", title: "BWB Hall of Fame" },
      year: { id: "year-1", code: "2023", title: "2023" },
      hofmeister: null,
      lceCountries: [],
    };

    prisma.hofYearConfig.findUnique.mockResolvedValue(null);
    prisma.hofYearConfig.create.mockResolvedValue(mockConfig);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofId: "hof-1",
          yearId: "year-1",
          hofmeisterId: "",
          minPeaks: 50,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.hofmeisterId).toBeNull();
  });

  it("should preserve existing hofmeisterId when not provided in PUT", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const existingConfig = {
      id: "config-1",
      hofId: "hof-1",
      yearId: "year-1",
      hofmeisterId: "user-123",
      minPeaks: 50,
      minForeignPeaks: 5,
      minFpr: 0.1,
      minimumAge: 18,
      minPeaksEnabled: true,
      minForeignPeaksEnabled: true,
      minFprEnabled: true,
      minimumAgeEnabled: true,
      lceEnabled: false,
      lceMinFpr: null,
      notes: "Test config",
    };

    const updatedConfig = {
      ...existingConfig,
      minPeaks: 75,
      hofmeister: {
        id: "user-123",
        displayName: "John Doe",
        username: "johndoe",
      },
      hof: { id: "hof-1", code: "BWB", title: "BWB Hall of Fame" },
      year: { id: "year-1", code: "2023", title: "2023" },
      lceCountries: [],
    };

    prisma.hofYearConfig.findUnique
      .mockResolvedValueOnce(existingConfig)
      .mockResolvedValueOnce(updatedConfig);
    prisma.hofYearConfig.update.mockResolvedValue(updatedConfig);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs/config-1",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          minPeaks: 75,
          // hofmeisterId intentionally not provided
        }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "config-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hofmeisterId).toBe("user-123");
    expect(prisma.hofYearConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hofmeisterId: "user-123", // Preserved
        }),
      })
    );
  });

  it("should update hofmeisterId to null explicitly", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const existingConfig = {
      id: "config-1",
      hofId: "hof-1",
      yearId: "year-1",
      hofmeisterId: "user-123",
      minPeaks: 50,
      minForeignPeaks: 5,
      minFpr: 0.1,
      minimumAge: 18,
      minPeaksEnabled: true,
      minForeignPeaksEnabled: true,
      minFprEnabled: true,
      minimumAgeEnabled: true,
      lceEnabled: false,
      lceMinFpr: null,
      notes: "Test config",
    };

    const updatedConfig = {
      ...existingConfig,
      hofmeisterId: null,
      hofmeister: null,
      hof: { id: "hof-1", code: "BWB", title: "BWB Hall of Fame" },
      year: { id: "year-1", code: "2023", title: "2023" },
      lceCountries: [],
    };

    prisma.hofYearConfig.findUnique
      .mockResolvedValueOnce(existingConfig)
      .mockResolvedValueOnce(updatedConfig);
    prisma.hofYearConfig.update.mockResolvedValue(updatedConfig);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs/config-1",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hofmeisterId: null,
        }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "config-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hofmeisterId).toBeNull();
    expect(prisma.hofYearConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hofmeisterId: null,
        }),
      })
    );
  });

  it("should include hofmeister in GET response even when null", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const mockConfigs = [
      {
        id: "config-1",
        hofId: "hof-1",
        yearId: "year-1",
        hofmeisterId: null,
        minPeaks: 50,
        minForeignPeaks: 5,
        minFpr: 0.1,
        minimumAge: 18,
        lceEnabled: false,
        lceMinFpr: null,
        notes: null,
        hof: {
          id: "hof-1",
          code: "BWB",
          title: "BWB Hall of Fame",
          displayOrder: 1,
        },
        year: { id: "year-1", code: "2023", title: "2023" },
        hofmeister: null,
        lceCountries: [],
      },
    ];

    prisma.hofYearConfig.findMany.mockResolvedValue(mockConfigs);

    const request = new NextRequest(
      "http://localhost:3000/api/hof-year-configs"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).toHaveProperty("hofmeister");
    expect(data[0].hofmeister).toBeNull();
  });
});
