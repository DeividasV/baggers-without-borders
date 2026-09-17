import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import {
  checkLceApplies,
  meetsMinimumAgeRequirement,
  meetsMinimumPeaksRequirement,
  meetsMinimumForeignPeaksRequirement,
  meetsMinimumFprRequirement,
  isRetiredAndExcluded,
  isDeceasedAndExcluded,
  isInactiveAndExcluded,
} from "@/src/lib/hofQualificationRules";

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic";

// ============================================================================
// HALL OF FAME QUALIFICATION SYSTEM
// ============================================================================
// This API endpoint manages the Hall of Fame (HOF) tables, which display
// members who meet specific qualification criteria for a given year and HOF.
//
// HOW IT WORKS:
// 1. Load all members who have HOF entries for the selected Year and HOF
// 2. Calculate their statistics (total peaks, foreign peaks, FPR)
// 3. Apply qualification rules (age, peaks, foreign peaks, FPR)
// 4. Filter by member status (exclude ARCHIVED and INACTIVE)
// 5. Filter by participation settings (HOF and Year participation flags)
// 6. Return qualified members with their stats and badges
//
// QUALIFICATION RULES (checked in order):
// - Rule 1: Minimum Age - Member must be at least X years old in selected year
// - Rule 2: Minimum Total Peaks - Member must have climbed at least X peaks
// - Rule 3: Minimum Foreign Peaks - Member must have climbed at least X foreign peaks
// - Rule 4: Minimum FPR - Member must have Foreign Peaks Ratio >= X%
//            (with optional Large Country Exception for lower threshold)
//
// MEMBER BADGES:
// - New Entrant: First year meeting minimum peaks requirement
// - New Award: First time achieving this award tier
// - LCE: Large Country Exception applied (lower FPR threshold)
// - Retired: Member has retiredYear set (not null)
// - Deceased: Member has deceasedYear set (not null)
// - No Data: Member didn't submit data this year
// ============================================================================

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Member statistics with calculated values and qualification status */
type MemberStats = {
  member: {
    id: string;
    username: string;
    displayName: string;
    status: string;
    residenceCountryId: string | null;
    birthCountryId: string | null;
    birthYear: number | null;
    familyName: string | null;
    retiredYear: number | null;
    deceasedYear: number | null;
  };
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  fpr: number;
  isNewEntrant: boolean;
  isFirstTimeAward: boolean;
  awardTierName: string | null;
  firstQualificationYear: string | null;
  isParticipating: boolean;
  dataNotProvided: boolean;
  hasLce: boolean;
  lceCountryId: string | null;
  isFromLceCountry?: boolean; // True if member resides in LCE country (regardless of benefit)
};

/** HOF Year Configuration with qualification criteria */
type HofYearConfigType = {
  id: string;
  updatedAt: Date;
  minPeaks: number;
  minPeaksEnabled: boolean;
  minForeignPeaks: number;
  minForeignPeaksEnabled: boolean;
  minFpr: number;
  minFprEnabled: boolean;
  minimumAge: number;
  minimumAgeEnabled: boolean;
  lceEnabled: boolean;
  lceMinFpr: number | null;
  lceMinPeaks: number | null;
  lceMinForeignPeaks: number | null;
  meisterReportContent: string | null;
  meisterReportImage: string | null;
  meisterReportImageTitle: string | null;
  meisterReportImageAttribution: string | null;
  hofmeister?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  lceCountries: Array<{
    countryId: string;
    hasLce: boolean;
  }>;
};

/** Year participation data with country override */
type YearParticipationType = {
  enabled: boolean;
  dataNotProvided: boolean;
  countryId: string | null;
};

// ============================================================================
// GET /api/hof-tables - Get HOF table data for active and deceased members (public route)
// Returns members with HOF entries who meet the filtering criteria
// Includes: ACTIVE and DECEASED members only
// Excludes: NEW, INACTIVE, and ARCHIVED members
export async function GET(request: NextRequest) {
  try {
    // Optional session - public route that may show extra features if logged in
    const session = await getOptionalSession();
    const currentUserId = session?.user?.id;

    const searchParams = request.nextUrl.searchParams;
    const yearId = searchParams.get("yearId");
    const hofId = searchParams.get("hofId");

    // Fetch all active years for the badges (ordered by displayOrder ascending)
    const years = await prisma.year.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "desc" }, // Changed to desc to get latest first
      select: {
        id: true,
        code: true,
        title: true,
        displayOrder: true,
      },
    });

    // Fetch all active HoFs for the badges (including Progress Register filter settings)
    const hofs = await prisma.hallOfFame.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        code: true,
        title: true,
        displayOrder: true,
        progressRegisterExcludeRetired: true,
        progressRegisterExcludeDeceased: true,
        progressRegisterExcludeInactive: true,
        progressRegisterInactivityYears: true,
      },
    });

    // Fetch app settings for defaults
    const [defaultYearSetting, defaultHofSetting] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: "default_year_id" } }),
      prisma.appSetting.findUnique({ where: { key: "default_hof_id" } }),
    ]);

    // Fetch all active members (excluding ARCHIVED status)
    const members = await prisma.user.findMany({
      where: {
        status: {
          not: "ARCHIVED",
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true,
        residenceCountryId: true,
        birthCountryId: true,
      },
      orderBy: {
        displayName: "asc",
      },
    });

    // Default to latest year (first in list after ordering by displayOrder desc)
    // or use the app setting if available
    let selectedYearId = yearId;
    if (!selectedYearId && defaultYearSetting?.value) {
      selectedYearId = defaultYearSetting.value;
    }
    if (!selectedYearId) {
      selectedYearId = years[0]?.id;
    }

    // Default to p100 (find by code) or use the app setting if available
    let selectedHofId = hofId;
    if (!selectedHofId && defaultHofSetting?.value) {
      selectedHofId = defaultHofSetting.value;
    }
    if (!selectedHofId) {
      const p100Hof = hofs.find((h) => h.code.toLowerCase() === "p100");
      selectedHofId = p100Hof?.id || hofs[0]?.id;
    }

    if (!selectedYearId || !selectedHofId) {
      return NextResponse.json({
        members: [],
        years,
        hofs,
        selectedYearId: null,
        selectedHofId: null,
      });
    }

    // Get selected HOF with Progress Register filter settings
    const selectedHof = hofs.find((h) => h.id === selectedHofId);
    if (!selectedHof) {
      return NextResponse.json({
        members: [],
        years,
        hofs,
        selectedYearId: null,
        selectedHofId: null,
      });
    }

    // Fetch user HOF participations for filtering
    const hofParticipations = await prisma.userHofParticipation.findMany({
      where: {
        hofId: selectedHofId,
      },
      select: {
        userId: true,
        enabled: true,
      },
    });

    // Create map of user HOF participation status
    const hofParticipationMap = new Map(
      hofParticipations.map((p) => [p.userId, p.enabled]),
    );

    // Fetch user year participations for filtering and country overrides
    const yearParticipations = await prisma.userYearParticipation.findMany({
      where: {
        yearId: selectedYearId,
      },
      select: {
        userId: true,
        enabled: true,
        dataNotProvided: true,
        countryId: true,
      },
    });

    // Get list of members who are enabled for both HOF and Year
    // These members should appear in the HOF table even if they don't have data entries
    const enabledMemberIds = new Set<string>();
    yearParticipations.forEach((yp) => {
      // Member must be enabled for the year
      if (yp.enabled) {
        const hofParticipation = hofParticipationMap.get(yp.userId);
        // Member must also be enabled for the HOF (or not explicitly disabled)
        if (hofParticipation !== false) {
          enabledMemberIds.add(yp.userId);
        }
      }
    });

    // Fetch HOF entries filtered by both year and HoF
    const hofEntries = await prisma.hofEntry.findMany({
      where: {
        yearId: selectedYearId,
        hofId: selectedHofId,
      },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            displayName: true,
            status: true,
            residenceCountryId: true,
            birthCountryId: true,
            birthYear: true,
            familyName: true,
            retiredYear: true,
            deceasedYear: true,
          },
        },
        hof: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    // Get member IDs who have entries
    const memberIdsWithEntries = new Set(hofEntries.map((e) => e.memberId));

    // Find enabled members who don't have entries yet (need to be shown with 0 stats)
    const membersWithoutEntries = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(enabledMemberIds).filter(
            (id) => !memberIdsWithEntries.has(id),
          ),
        },
        status: {
          notIn: ["ARCHIVED", "INACTIVE"],
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true,
        residenceCountryId: true,
        birthCountryId: true,
        birthYear: true,
        familyName: true,
        retiredYear: true,
        deceasedYear: true,
      },
    });

    // Create map of user year participation status and country overrides
    const yearParticipationMap = new Map(
      yearParticipations.map((p) => [
        p.userId,
        {
          enabled: p.enabled,
          dataNotProvided: p.dataNotProvided,
          countryId: p.countryId,
        },
      ]),
    );

    // Fetch HofYearConfig for filtering criteria
    const hofYearConfig = (await prisma.hofYearConfig.findUnique({
      where: {
        hofId_yearId: {
          hofId: selectedHofId,
          yearId: selectedYearId,
        },
      },
      select: {
        id: true,
        updatedAt: true,
        minPeaks: true,
        minPeaksEnabled: true,
        minForeignPeaks: true,
        minForeignPeaksEnabled: true,
        minFpr: true,
        minFprEnabled: true,
        minimumAge: true,
        minimumAgeEnabled: true,
        lceEnabled: true,
        lceMinFpr: true,
        lceMinPeaks: true,
        lceMinForeignPeaks: true,
        meisterReportContent: true,
        meisterReportImage: true,
        meisterReportImageTitle: true,
        meisterReportImageAttribution: true,
        hofmeister: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        lceCountries: {
          select: {
            countryId: true,
            hasLce: true,
          },
        },
      },
    })) as HofYearConfigType | null;

    // Fetch award tiers for the selected year and HOF
    const awardTiers = hofYearConfig
      ? await prisma.awardTier.findMany({
          where: {
            hofYearConfigId: hofYearConfig.id,
          },
          orderBy: {
            displayOrder: "asc",
          },
          select: {
            id: true,
            name: true,
            minPeaks: true,
            maxPeaks: true,
            displayOrder: true,
          },
        })
      : [];

    // Fetch all previous years for this HOF to detect new entrants
    const currentYear = years.find((y) => y.id === selectedYearId);
    const previousYears = years.filter(
      (y) => y.displayOrder < (currentYear?.displayOrder || 0),
    );

    // Fetch all HOF entries for previous years (same HOF, all previous years)
    const previousYearIds = previousYears.map((y) => y.id);
    const previousHofEntries = await prisma.hofEntry.findMany({
      where: {
        yearId: { in: previousYearIds },
        hofId: selectedHofId,
      },
      select: {
        memberId: true,
        totalPeaks: true,
        foreignPeaks: true,
      },
    });

    // Group previous entries by member to find their max total peaks and corresponding foreign peaks
    const previousPeaksMap = new Map<string, number>();
    const previousForeignPeaksMap = new Map<
      string,
      { totalPeaks: number; foreignPeaks: number }
    >();

    previousHofEntries.forEach((entry) => {
      const currentMax = previousPeaksMap.get(entry.memberId) || 0;

      // Track the entry with maximum total peaks for each member
      if (entry.totalPeaks >= currentMax) {
        previousPeaksMap.set(entry.memberId, entry.totalPeaks);
        previousForeignPeaksMap.set(entry.memberId, {
          totalPeaks: entry.totalPeaks,
          foreignPeaks: entry.foreignPeaks,
        });
      }
    });

    // Fetch all HOF entries for this HOF across all years to find first qualification year
    const allYearIds = years.map((y) => y.id);
    const allHofEntries = await prisma.hofEntry.findMany({
      where: {
        yearId: { in: allYearIds },
        hofId: selectedHofId,
      },
      select: {
        memberId: true,
        yearId: true,
        totalPeaks: true,
      },
    });

    // Get the minimum peaks requirement if it exists
    const allConfigs = await prisma.hofYearConfig.findMany({
      where: {
        hofId: selectedHofId,
      },
      select: {
        yearId: true,
        minPeaks: true,
      },
    });

    // Create a map of year configs
    const configMap = new Map(allConfigs.map((c) => [c.yearId, c.minPeaks]));

    // Group entries by member and find first qualification year
    const firstQualificationYearMap = new Map<string, string>();
    const memberEntriesByYear = new Map<string, Map<string, number>>();

    // Organize entries by member and year
    allHofEntries.forEach((entry) => {
      if (!memberEntriesByYear.has(entry.memberId)) {
        memberEntriesByYear.set(entry.memberId, new Map());
      }
      memberEntriesByYear
        .get(entry.memberId)!
        .set(entry.yearId, entry.totalPeaks);
    });

    // For each member, find the first year they qualified
    memberEntriesByYear.forEach((yearEntries, memberId) => {
      // Sort years by display order to check chronologically
      const sortedYears = years
        .filter((y) => yearEntries.has(y.id))
        .sort((a, b) => a.displayOrder - b.displayOrder);

      for (const year of sortedYears) {
        const totalPeaks = yearEntries.get(year.id) || 0;
        const minPeaks = configMap.get(year.id) || 0;

        // Check if they qualified in this year
        // If there's a config with minPeaks > 0, check against it
        // If there's no config (minPeaks is 0), they qualify if they have any peaks
        if (minPeaks > 0) {
          if (totalPeaks >= minPeaks) {
            firstQualificationYearMap.set(memberId, year.title);
            break; // Found the first year, stop looking
          }
        } else {
          // No config or minPeaks is 0 - they qualify if they have any entry
          if (totalPeaks > 0) {
            firstQualificationYearMap.set(memberId, year.title);
            break; // Found the first year, stop looking
          }
        }
      }
    });

    // Group entries by member
    const memberDataMap = new Map();

    hofEntries.forEach((entry) => {
      const memberId = entry.memberId;

      if (!memberDataMap.has(memberId)) {
        memberDataMap.set(memberId, {
          entryId: entry.id, // Store the entry ID for editing
          member: entry.member,
          totalPeaks: 0,
          peaksInYear: 0,
          foreignPeaks: 0,
          foreignPeaksInYear: 0,
        });
      }

      const memberData = memberDataMap.get(memberId);

      // Accumulate totals across all HOFs
      memberData.totalPeaks += entry.totalPeaks;
      memberData.peaksInYear += entry.peaksInYear;
      memberData.foreignPeaks += entry.foreignPeaks;
      memberData.foreignPeaksInYear += entry.foreignPeaksInYear || 0;
    });

    // Add members without entries (enabled but no data for current year)
    // They should show their cumulative totals from previous periods with 0 peaks in current year
    membersWithoutEntries.forEach((member) => {
      if (!memberDataMap.has(member.id)) {
        // Get their previous maximum entry to carry forward totals
        const previousEntry = previousForeignPeaksMap.get(member.id);
        const previousMaxPeaks = previousEntry?.totalPeaks || 0;
        const previousForeignPeaks = previousEntry?.foreignPeaks || 0;

        memberDataMap.set(member.id, {
          entryId: null, // No entry for current year
          member: member,
          totalPeaks: previousMaxPeaks, // Carry forward previous total
          peaksInYear: 0, // No peaks in current year
          foreignPeaks: previousForeignPeaks, // Carry forward previous foreign peaks
          foreignPeaksInYear: 0, // No foreign peaks in current year
        });
      }
    });

    // Convert map to array and calculate FPR - only include members with HOF entries
    let memberStats: MemberStats[] = Array.from(memberDataMap.values()).map(
      (data) => {
        const memberId = data.member.id;
        const currentTotalPeaks = data.totalPeaks;
        const previousMaxPeaks = previousPeaksMap.get(memberId) || 0;
        const minPeaks = hofYearConfig?.minPeaks || 0;

        // Helper function to get tier for given peaks
        const getTierForPeaks = (peaks: number) => {
          return awardTiers.find(
            (tier: { minPeaks: number; maxPeaks: number | null }) =>
              peaks >= tier.minPeaks &&
              (tier.maxPeaks === null || peaks <= tier.maxPeaks),
          );
        };

        const currentTier = getTierForPeaks(currentTotalPeaks);
        const previousTier = getTierForPeaks(previousMaxPeaks);

        // New entrant if:
        // 1. They meet minimum peaks now (currentTotalPeaks >= minPeaks)
        // 2. They didn't meet minimum peaks before (previousMaxPeaks < minPeaks)
        // 3. There is a minimum peaks requirement (minPeaks > 0)
        const isNewEntrant =
          minPeaks > 0 &&
          currentTotalPeaks >= minPeaks &&
          previousMaxPeaks < minPeaks;

        // First time achieving this award tier if:
        // 1. They have a current tier
        // 2. They either had no previous tier OR previous tier is different
        const isFirstTimeAward =
          currentTier !== undefined &&
          (previousTier === undefined || previousTier.id !== currentTier.id);

        const hofEnabled = hofParticipationMap.get(memberId);
        const yearParticipation = yearParticipationMap.get(memberId);
        const isParticipating =
          hofEnabled !== false && yearParticipation?.enabled !== false;

        return {
          entryId: data.entryId, // Include entry ID for inline editing
          member: data.member,
          totalPeaks: data.totalPeaks,
          peaksInYear: data.peaksInYear,
          foreignPeaks: data.foreignPeaks,
          foreignPeaksInYear: data.foreignPeaksInYear, // Include year-specific foreign peaks
          fpr:
            data.totalPeaks > 0
              ? (data.foreignPeaks / data.totalPeaks) * 100
              : 0,
          isNewEntrant,
          isFirstTimeAward,
          awardTierName: currentTier?.name || null,
          firstQualificationYear:
            firstQualificationYearMap.get(data.member.id) || null,
          isParticipating,
          dataNotProvided: yearParticipation?.dataNotProvided || false,
          hasLce: false, // Will be set during filtering
          lceCountryId: null, // Will be set during filtering
        };
      },
    );

    // ============================================================================
    // QUALIFICATION RULES - Apply filters in logical order
    // ============================================================================
    // These rules determine which members qualify for the Hall of Fame table
    // Each rule is checked in order, and members must pass ALL rules to qualify
    // We also track members who didn't qualify for the Progress Register
    // ============================================================================

    let progressRegisterMembers: any[] = [];

    // Get the year value for age calculations and activity checks
    const selectedYearObj = years.find((y) => y.id === selectedYearId);
    const yearValue = selectedYearObj
      ? parseInt(selectedYearObj.code)
      : new Date().getFullYear();

    if (hofYearConfig) {
      // Build set of LCE (Large Country Exception) country IDs for quick lookup
      const lceCountryIds = new Set(
        hofYearConfig.lceEnabled
          ? hofYearConfig.lceCountries
              .filter((lce) => lce.hasLce)
              .map((lce) => lce.countryId)
          : [],
      );

      // Separate qualified and non-qualified members
      const qualifiedMembers: typeof memberStats = [];
      const nonQualifiedMembers: any[] = [];

      memberStats.forEach((stats) => {
        // Check if LCE applies to this member (once per member)
        const lceInfo = checkLceApplies(
          stats.member.id,
          stats.member.residenceCountryId,
          hofYearConfig.lceEnabled,
          lceCountryIds,
          yearParticipationMap,
        );

        // Check each qualification rule with LCE thresholds
        const failedMinimumAge = !meetsMinimumAgeRequirement(
          stats,
          hofYearConfig,
          yearValue,
        );
        const failedMinimumPeaks = !meetsMinimumPeaksRequirement(
          stats,
          hofYearConfig,
          lceInfo,
        );
        const failedMinimumForeignPeaks = !meetsMinimumForeignPeaksRequirement(
          stats,
          hofYearConfig,
          lceInfo,
        );
        const failedMinimumFpr = !meetsMinimumFprRequirement(
          stats,
          hofYearConfig,
          lceInfo,
        );

        // Determine if member is actually BENEFITING from LCE
        // Only show LCE badge if they qualify WITH LCE but would NOT qualify WITHOUT it
        let actuallyBenefitingFromLce = false;
        if (lceInfo.hasLce) {
          // Check if they would fail standard requirements (without LCE)
          const noLceInfo = { hasLce: false, lceCountryId: null };
          const wouldFailStandardPeaks = !meetsMinimumPeaksRequirement(
            stats,
            hofYearConfig,
            noLceInfo,
          );
          const wouldFailStandardForeignPeaks =
            !meetsMinimumForeignPeaksRequirement(
              stats,
              hofYearConfig,
              noLceInfo,
            );
          const wouldFailStandardFpr = !meetsMinimumFprRequirement(
            stats,
            hofYearConfig,
            noLceInfo,
          );

          // They benefit from LCE if they pass with LCE but would fail any standard requirement
          actuallyBenefitingFromLce =
            !failedMinimumAge && // Must pass age regardless
            !failedMinimumPeaks && // Passes with LCE
            !failedMinimumForeignPeaks && // Passes with LCE
            !failedMinimumFpr && // Passes with LCE
            (wouldFailStandardPeaks ||
              wouldFailStandardForeignPeaks ||
              wouldFailStandardFpr); // Would fail standard
        }

        // Set LCE badge if actually benefiting from it (for qualified tables)
        stats.hasLce = actuallyBenefitingFromLce;
        stats.lceCountryId = actuallyBenefitingFromLce
          ? lceInfo.lceCountryId
          : null;

        // Track if member is from LCE country regardless of benefit (for Progress Register)
        stats.isFromLceCountry = lceInfo.hasLce;

        // Calculate member age if birth year exists
        const memberAge = stats.member.birthYear
          ? yearValue - stats.member.birthYear
          : null;

        // Apply age privacy: mask age for users viewing others
        // Current user always sees their own age, others only see Met/Not Met
        const shouldMaskAge = currentUserId !== stats.member.id;
        const maskedMemberAge = shouldMaskAge ? null : memberAge;

        // If member failed any rule, they go to Progress Register
        // BUT Progress Register requires at least 2 total peaks and 2 foreign peaks
        if (
          failedMinimumAge ||
          failedMinimumPeaks ||
          failedMinimumForeignPeaks ||
          failedMinimumFpr
        ) {
          // Only add to Progress Register if they have at least 2 peaks and 2 foreign peaks
          if (stats.totalPeaks >= 2 && stats.foreignPeaks >= 2) {
            nonQualifiedMembers.push({
              ...stats,
              failedMinimumAge,
              failedMinimumPeaks,
              failedMinimumForeignPeaks,
              failedMinimumFpr,
              memberAge: maskedMemberAge, // Masked for privacy
            });
          }
        } else {
          // Member passed all rules
          qualifiedMembers.push(stats);
        }
      });

      memberStats = qualifiedMembers;
      progressRegisterMembers = nonQualifiedMembers;
    }

    // Only include active members (exclude ARCHIVED/INACTIVE) in HOF tables
    memberStats = memberStats.filter((stats) => {
      return (
        stats.member.status !== "ARCHIVED" && stats.member.status !== "INACTIVE"
      );
    });

    // Filter out non-participating members (HOF and Year participation)
    memberStats = memberStats.filter((stats) => stats.isParticipating);

    // Filter Progress Register members similarly
    progressRegisterMembers = progressRegisterMembers.filter((stats) => {
      return (
        stats.member.status !== "ARCHIVED" && stats.member.status !== "INACTIVE"
      );
    });
    progressRegisterMembers = progressRegisterMembers.filter(
      (stats) => stats.isParticipating,
    );

    // Track exclusion statistics for admin UI
    const exclusionStats = {
      retiredCount: 0,
      deceasedCount: 0,
      inactiveCount: 0,
      totalExcluded: 0,
    };

    // Apply Progress Register exclusion filters based on HOF settings
    if (selectedHof) {
      const beforeFilterCount = progressRegisterMembers.length;

      // Pre-build memberEntriesMap for O(n) lookup instead of O(n²) nested filter
      const memberEntriesMap = new Map<string, typeof hofEntries>();
      for (const entry of hofEntries) {
        if (!memberEntriesMap.has(entry.memberId)) {
          memberEntriesMap.set(entry.memberId, []);
        }
        memberEntriesMap.get(entry.memberId)!.push(entry);
      }

      progressRegisterMembers = progressRegisterMembers.filter((stats) => {
        // Check retired/deceased first (fast checks)
        if (
          selectedHof.progressRegisterExcludeRetired &&
          stats.member.retiredYear !== null
        ) {
          exclusionStats.retiredCount++;
          return false;
        }

        if (
          selectedHof.progressRegisterExcludeDeceased &&
          stats.member.deceasedYear !== null
        ) {
          exclusionStats.deceasedCount++;
          return false;
        }

        // Check activity for non-retired, non-deceased members
        if (selectedHof.progressRegisterExcludeInactive) {
          const memberEntries = memberEntriesMap.get(stats.member.id) || [];

          if (memberEntries.length === 0) {
            exclusionStats.inactiveCount++;
            return false;
          }

          const entryYears = memberEntries.map((e) => {
            const year = years.find((y) => y.id === e.yearId);
            return year ? parseInt(year.code) : 0;
          });

          const lastActivityYear = Math.max(...entryYears);
          const inactivityThreshold =
            yearValue - (selectedHof.progressRegisterInactivityYears || 2);

          if (lastActivityYear < inactivityThreshold) {
            exclusionStats.inactiveCount++;
            return false;
          }
        }

        return true;
      });

      exclusionStats.totalExcluded =
        beforeFilterCount - progressRegisterMembers.length;
    }

    // Count total active members (excluding ARCHIVED, NEW, INACTIVE)
    const totalActiveMembers = members.filter(
      (m) =>
        m.status !== "ARCHIVED" &&
        m.status !== "INACTIVE" &&
        m.status !== "NEW",
    ).length;

    // Only return members who have entries in this HOF/year combination
    return NextResponse.json({
      members: memberStats,
      progressRegisterMembers,
      progressRegisterExclusionStats: exclusionStats,
      yearValue,
      years,
      hofs,
      selectedYearId,
      selectedHofId,
      config: hofYearConfig, // Include config info for display
      awardTiers, // Include award tiers for tier badges
      totalActiveMembers, // Add total count for percentile calculation
    });
  } catch (error) {
    console.error("Error fetching HOF tables data:", error);
    return NextResponse.json(
      { error: "Failed to fetch HOF tables data" },
      { status: 500 },
    );
  }
}
