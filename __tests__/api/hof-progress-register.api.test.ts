/* eslint-disable */
/**
 * HOF Progress Register Filtering Tests
 * Tests for Progress Register exclusion filters (retired, deceased, inactive members)
 */

// Mock next-auth BEFORE any imports
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/src/lib/auth", () => ({
  authOptions: {},
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/hof-tables/route";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";

// Mock prisma
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    year: {
      findMany: jest.fn(),
    },
    hallOfFame: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    appSetting: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    userHofParticipation: {
      findMany: jest.fn(),
    },
    userYearParticipation: {
      findMany: jest.fn(),
    },
    hofEntry: {
      findMany: jest.fn(),
    },
    hofYearConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    awardTier: {
      findMany: jest.fn(),
    },
  },
}));

// Mock session (unauthenticated for public route)
(getServerSession as jest.Mock).mockResolvedValue(null);

describe("HOF Progress Register Filtering", () => {
  const mockYears = [
    {
      id: "year-2024",
      code: "2024",
      title: "2024",
      displayOrder: 1,
      isActive: true,
    },
    {
      id: "year-2023",
      code: "2023",
      title: "2023",
      displayOrder: 0,
      isActive: true,
    },
  ];

  const mockHofs = [
    {
      id: "hof-p100",
      code: "P100",
      title: "P100m Table",
      displayOrder: 0,
      isActive: true,
      progressRegisterExcludeRetired: true,
      progressRegisterExcludeDeceased: true,
      progressRegisterExcludeInactive: true,
      progressRegisterInactivityYears: 2,
    },
  ];

  const mockMembers = [
    {
      id: "user-active",
      username: "active",
      displayName: "Active User",
      status: "ACTIVE",
      residenceCountryId: null,
      birthCountryId: null,
      birthYear: 1980,
      familyName: "User",
      retiredYear: null,
      deceasedYear: null,
    },
    {
      id: "user-retired",
      username: "retired",
      displayName: "Retired User",
      status: "ACTIVE",
      residenceCountryId: null,
      birthCountryId: null,
      birthYear: 1970,
      familyName: "User",
      retiredYear: 2020,
      deceasedYear: null,
    },
    {
      id: "user-deceased",
      username: "deceased",
      displayName: "Deceased User",
      status: "ACTIVE",
      residenceCountryId: null,
      birthCountryId: null,
      birthYear: 1960,
      familyName: "User",
      retiredYear: null,
      deceasedYear: 2021,
    },
    {
      id: "user-inactive",
      username: "inactive",
      displayName: "Inactive User",
      status: "ACTIVE",
      residenceCountryId: null,
      birthCountryId: null,
      birthYear: 1975,
      familyName: "User",
      retiredYear: null,
      deceasedYear: null,
    },
  ];

  const mockConfig = {
    id: "config-1",
    hofId: "hof-p100",
    yearId: "year-2024",
    minPeaks: 10,
    minPeaksEnabled: true,
    minForeignPeaks: 2,
    minForeignPeaksEnabled: true,
    minFpr: 5,
    minFprEnabled: true,
    minimumAge: 0,
    minimumAgeEnabled: false,
    lceEnabled: false,
    lceMinFpr: null,
    lceCountries: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (prisma.year.findMany as jest.Mock).mockResolvedValue(mockYears);
    (prisma.hallOfFame.findMany as jest.Mock).mockResolvedValue(mockHofs);
    (prisma.appSetting.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockMembers);
    (prisma.userHofParticipation.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.userYearParticipation.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.hofYearConfig.findUnique as jest.Mock).mockResolvedValue(
      mockConfig
    );
    (prisma.hofYearConfig.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.awardTier.findMany as jest.Mock).mockResolvedValue([]);
  });

  describe("Retired Members Filter", () => {
    it("should exclude retired members from Progress Register when filter is enabled", async () => {
      const mockEntries = [
        {
          id: "entry-1",
          memberId: "user-active",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5, // Below qualification (10)
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[0],
        },
        {
          id: "entry-2",
          memberId: "user-retired",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5, // Below qualification
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[1],
        },
      ];

      (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const request = new NextRequest(
        "http://localhost:3000/api/hof-tables?yearId=year-2024&hofId=hof-p100"
      );

      const response = await GET(request);
      const data = await response.json();

      // Active user should be in Progress Register
      expect(data.progressRegisterMembers).toHaveLength(1);
      expect(data.progressRegisterMembers[0].member.id).toBe("user-active");

      // Retired user should be excluded
      expect(
        data.progressRegisterMembers.find(
          (m: any) => m.member.id === "user-retired"
        )
      ).toBeUndefined();
    });

    it("should include retired members when filter is disabled", async () => {
      // Update HOF to disable retired filter
      const hofsWithoutRetiredFilter = [
        {
          ...mockHofs[0],
          progressRegisterExcludeRetired: false,
        },
      ];
      (prisma.hallOfFame.findMany as jest.Mock).mockResolvedValue(
        hofsWithoutRetiredFilter
      );

      const mockEntries = [
        {
          id: "entry-1",
          memberId: "user-active",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[0],
        },
        {
          id: "entry-2",
          memberId: "user-retired",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[1],
        },
      ];

      (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const request = new NextRequest(
        "http://localhost:3000/api/hof-tables?yearId=year-2024&hofId=hof-p100"
      );

      const response = await GET(request);
      const data = await response.json();

      // Both users should be in Progress Register
      expect(data.progressRegisterMembers).toHaveLength(2);
    });
  });

  describe("Deceased Members Filter", () => {
    it("should exclude deceased members from Progress Register when filter is enabled", async () => {
      const mockEntries = [
        {
          id: "entry-1",
          memberId: "user-active",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[0],
        },
        {
          id: "entry-3",
          memberId: "user-deceased",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[2],
        },
      ];

      (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const request = new NextRequest(
        "http://localhost:3000/api/hof-tables?yearId=year-2024&hofId=hof-p100"
      );

      const response = await GET(request);
      const data = await response.json();

      // Active user should be in Progress Register
      expect(data.progressRegisterMembers).toHaveLength(1);
      expect(data.progressRegisterMembers[0].member.id).toBe("user-active");

      // Deceased user should be excluded
      expect(
        data.progressRegisterMembers.find(
          (m: any) => m.member.id === "user-deceased"
        )
      ).toBeUndefined();
    });
  });

  describe("Inactive Members Filter", () => {
    it("should exclude inactive members with no recent activity from Progress Register", async () => {
      const mockEntries = [
        // Active user with entry in 2024
        {
          id: "entry-1",
          memberId: "user-active",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[0],
        },
        // Inactive user with last entry in 2023 (more than 2 years ago if current is 2024)
        {
          id: "entry-4",
          memberId: "user-inactive",
          hofId: "hof-p100",
          yearId: "year-2023",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[3],
        },
      ];

      // Return all entries when fetching for activity check
      (prisma.hofEntry.findMany as jest.Mock).mockImplementation(
        (args: any) => {
          if (args.where?.yearId === "year-2024") {
            // Only active user has 2024 entry
            return Promise.resolve([mockEntries[0]]);
          }
          // Return all for activity detection
          return Promise.resolve(mockEntries);
        }
      );

      const request = new NextRequest(
        "http://localhost:3000/api/hof-tables?yearId=year-2024&hofId=hof-p100"
      );

      const response = await GET(request);
      const data = await response.json();

      // Only active user should be in Progress Register
      expect(data.progressRegisterMembers).toHaveLength(1);
      expect(data.progressRegisterMembers[0].member.id).toBe("user-active");

      // Inactive user should be excluded (last activity was in 2023, threshold is 2 years)
      expect(
        data.progressRegisterMembers.find(
          (m: any) => m.member.id === "user-inactive"
        )
      ).toBeUndefined();
    });

    it("should include member if they have activity within threshold", async () => {
      // Update years to test with 2025 as current year
      const recentYears = [
        {
          id: "year-2025",
          code: "2025",
          title: "2025",
          displayOrder: 2,
          isActive: true,
        },
        {
          id: "year-2024",
          code: "2024",
          title: "2024",
          displayOrder: 1,
          isActive: true,
        },
        {
          id: "year-2023",
          code: "2023",
          title: "2023",
          displayOrder: 0,
          isActive: true,
        },
      ];
      (prisma.year.findMany as jest.Mock).mockResolvedValue(recentYears);

      const mockEntries = [
        // User with entry in 2024 (within 2-year threshold from 2025)
        {
          id: "entry-1",
          memberId: "user-active",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[0],
        },
      ];

      (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const request = new NextRequest(
        "http://localhost:3000/api/hof-tables?yearId=year-2025&hofId=hof-p100"
      );

      const response = await GET(request);
      const data = await response.json();

      // User should be in Progress Register (activity in 2024, threshold is 2 years from 2025)
      expect(
        data.progressRegisterMembers.find(
          (m: any) => m.member.id === "user-active"
        )
      ).toBeDefined();
    });
  });

  describe("Combined Filters", () => {
    it("should apply all filters together", async () => {
      const mockEntries = [
        // Active user - should pass all filters
        {
          id: "entry-1",
          memberId: "user-active",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[0],
        },
        // Retired user - should be excluded
        {
          id: "entry-2",
          memberId: "user-retired",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[1],
        },
        // Deceased user - should be excluded
        {
          id: "entry-3",
          memberId: "user-deceased",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[2],
        },
      ];

      (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const request = new NextRequest(
        "http://localhost:3000/api/hof-tables?yearId=year-2024&hofId=hof-p100"
      );

      const response = await GET(request);
      const data = await response.json();

      // Only active user should be in Progress Register
      expect(data.progressRegisterMembers).toHaveLength(1);
      expect(data.progressRegisterMembers[0].member.id).toBe("user-active");
    });

    it("should respect different filter settings per HOF", async () => {
      // HOF with only deceased filter enabled
      const customHof = [
        {
          ...mockHofs[0],
          progressRegisterExcludeRetired: false,
          progressRegisterExcludeDeceased: true,
          progressRegisterExcludeInactive: false,
        },
      ];
      (prisma.hallOfFame.findMany as jest.Mock).mockResolvedValue(customHof);

      const mockEntries = [
        {
          id: "entry-1",
          memberId: "user-retired",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[1],
        },
        {
          id: "entry-2",
          memberId: "user-deceased",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 5,
          peaksInYear: 5,
          foreignPeaks: 2,
          foreignPeaksInYear: 2,
          member: mockMembers[2],
        },
      ];

      (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const request = new NextRequest(
        "http://localhost:3000/api/hof-tables?yearId=year-2024&hofId=hof-p100"
      );

      const response = await GET(request);
      const data = await response.json();

      // Retired user should be included (filter disabled)
      expect(
        data.progressRegisterMembers.find(
          (m: any) => m.member.id === "user-retired"
        )
      ).toBeDefined();

      // Deceased user should be excluded (filter enabled)
      expect(
        data.progressRegisterMembers.find(
          (m: any) => m.member.id === "user-deceased"
        )
      ).toBeUndefined();
    });
  });

  describe("Qualified Members", () => {
    it("should not apply Progress Register filters to qualified members", async () => {
      const mockEntries = [
        // Retired user who QUALIFIES for HOF (>= 10 peaks)
        {
          id: "entry-1",
          memberId: "user-retired",
          hofId: "hof-p100",
          yearId: "year-2024",
          totalPeaks: 15, // Above qualification threshold
          peaksInYear: 15,
          foreignPeaks: 5,
          foreignPeaksInYear: 5,
          member: mockMembers[1],
        },
      ];

      (prisma.hofEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const request = new NextRequest(
        "http://localhost:3000/api/hof-tables?yearId=year-2024&hofId=hof-p100"
      );

      const response = await GET(request);
      const data = await response.json();

      // Retired user should be in main HOF table (qualified)
      expect(data.members).toHaveLength(1);
      expect(data.members[0].member.id).toBe("user-retired");

      // Should not be in Progress Register
      expect(data.progressRegisterMembers).toHaveLength(0);
    });
  });
});
