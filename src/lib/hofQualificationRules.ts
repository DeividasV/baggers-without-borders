/**
 * Hall of Fame Qualification Rules
 *
 * Pure functions that determine whether a member qualifies for HOF tables
 * based on various criteria (age, peaks, foreign peaks, FPR).
 *
 * These functions are stateless and side-effect free.
 */

import type { MemberStats } from "@/src/types/hof";

type YearParticipation = {
  enabled: boolean;
  dataNotProvided: boolean;
  countryId: string | null;
};

type LceInfo = {
  hasLce: boolean;
  lceCountryId: string | null;
};

/**
 * HELPER: Get Member Country ID
 *
 * Retrieves the member's country ID, preferring the year-specific override
 * from participation data, falling back to residence country.
 */
function getMemberCountryId(
  memberId: string,
  yearParticipationMap: Map<string, YearParticipation>,
  fallbackCountryId: string | null | undefined,
): string | null {
  const yearParticipation = yearParticipationMap.get(memberId);
  return yearParticipation?.countryId || fallbackCountryId || null;
}

/**
 * HELPER: Check if Large Country Exception (LCE) applies to a member
 *
 * Determines if a member is from an LCE country and should use alternative thresholds.
 * This is a pure function that returns LCE status without mutating any objects.
 */
export function checkLceApplies(
  memberId: string,
  memberCountryId: string | null | undefined,
  lceEnabled: boolean,
  lceCountryIds: Set<string>,
  yearParticipationMap: Map<string, YearParticipation>,
): LceInfo {
  if (!lceEnabled || lceCountryIds.size === 0) {
    return { hasLce: false, lceCountryId: null };
  }

  const countryId = getMemberCountryId(
    memberId,
    yearParticipationMap,
    memberCountryId,
  );

  if (countryId && lceCountryIds.has(countryId)) {
    return { hasLce: true, lceCountryId: countryId };
  }

  return { hasLce: false, lceCountryId: null };
}

/**
 * RULE 1: Minimum Age Requirement
 *
 * Checks if a member meets the minimum age requirement for the selected year.
 */
export function meetsMinimumAgeRequirement(
  stats: MemberStats,
  config: { minimumAge: number; minimumAgeEnabled?: boolean },
  yearValue: number,
): boolean {
  if (config.minimumAgeEnabled == false) {
    return true;
  }

  if (config.minimumAge === 0) {
    return true;
  }

  if (!stats.member.birthYear) {
    return false;
  }

  const memberAge = yearValue - stats.member.birthYear;
  return memberAge >= config.minimumAge;
}

/**
 * RULE 2: Minimum Total Peaks Requirement
 *
 * Checks if a member has climbed at least the minimum number of total peaks.
 * When LCE is enabled, LCE countries MUST meet LCE threshold (standard is not used).
 * When LCE is disabled or member is not from LCE country, standard threshold applies.
 *
 * Pure function with no side effects. LCE info must be determined separately.
 */
export function meetsMinimumPeaksRequirement(
  stats: MemberStats,
  config: {
    minPeaks: number;
    minPeaksEnabled?: boolean;
    lceEnabled: boolean;
    lceMinPeaks: number | null;
  },
  lceInfo: LceInfo,
): boolean {
  if (config.minPeaksEnabled === false) {
    return true;
  }

  if (config.minPeaks === 0) {
    return true;
  }

  // Use LCE threshold if applicable, otherwise use standard
  const peaksThreshold =
    lceInfo.hasLce && config.lceMinPeaks !== null
      ? config.lceMinPeaks
      : config.minPeaks;

  return stats.totalPeaks >= peaksThreshold;
}

/**
 * RULE 3: Minimum Foreign Peaks Requirement
 *
 * Checks if a member has climbed at least the minimum number of foreign peaks.
 * When LCE is enabled, LCE countries MUST meet LCE threshold (standard is not used).
 * When LCE is disabled or member is not from LCE country, standard threshold applies.
 *
 * Pure function with no side effects. LCE info must be determined separately.
 */
export function meetsMinimumForeignPeaksRequirement(
  stats: MemberStats,
  config: {
    minForeignPeaks: number;
    minForeignPeaksEnabled?: boolean;
    lceEnabled: boolean;
    lceMinForeignPeaks: number | null;
  },
  lceInfo: LceInfo,
): boolean {
  if (config.minForeignPeaksEnabled === false) {
    return true;
  }

  if (config.minForeignPeaks === 0) {
    return true;
  }

  // Use LCE threshold if applicable, otherwise use standard
  const foreignPeaksThreshold =
    lceInfo.hasLce && config.lceMinForeignPeaks !== null
      ? config.lceMinForeignPeaks
      : config.minForeignPeaks;

  return stats.foreignPeaks >= foreignPeaksThreshold;
}

/**
 * RULE 4: Minimum Foreign Peaks Ratio (FPR) Requirement
 *
 * Checks if a member meets the FPR threshold.
 * When LCE is enabled, LCE countries MUST meet LCE FPR threshold (standard is not used).
 * When LCE is disabled or member is not from LCE country, standard threshold applies.
 *
 * Pure function with no side effects. LCE info must be determined separately.
 */
export function meetsMinimumFprRequirement(
  stats: MemberStats,
  config: {
    minFpr: number;
    minFprEnabled?: boolean;
    lceEnabled: boolean;
    lceMinFpr: number | null;
    lceCountries: Array<{ countryId: string; hasLce: boolean }>;
  },
  lceInfo: LceInfo,
): boolean {
  if (config.minFprEnabled === false) {
    return true;
  }

  if (config.minFpr === 0) {
    return true;
  }

  // Use LCE threshold if applicable, otherwise use standard
  const fprThreshold =
    lceInfo.hasLce && config.lceMinFpr !== null
      ? config.lceMinFpr
      : config.minFpr;

  return stats.fpr >= fprThreshold;
}

/**
 * Progress Register Exclusion: Retired Members
 *
 * Checks if a member should be excluded from Progress Register due to retirement.
 */
export function isRetiredAndExcluded(
  member: { retiredYear: number | null },
  excludeRetired: boolean,
): boolean {
  return excludeRetired && member.retiredYear !== null;
}

/**
 * Progress Register Exclusion: Deceased Members
 *
 * Checks if a member should be excluded from Progress Register due to being deceased.
 */
export function isDeceasedAndExcluded(
  member: { deceasedYear: number | null },
  excludeDeceased: boolean,
): boolean {
  return excludeDeceased && member.deceasedYear !== null;
}

/**
 * Progress Register Exclusion: Inactive Members
 *
 * Checks if a member should be excluded from Progress Register due to inactivity.
 *
 * @param memberId - The member's ID
 * @param excludeInactive - Whether to exclude inactive members
 * @param inactivityYears - Number of years of inactivity before exclusion
 * @param currentYearValue - Current year as integer (e.g., 2024)
 * @param memberEntriesMap - Pre-built map of member ID to their HOF entries
 * @param years - All available years for year code lookup
 * @returns true if member should be excluded (is inactive), false otherwise
 */
export function isInactiveAndExcluded(
  memberId: string,
  excludeInactive: boolean,
  inactivityYears: number,
  currentYearValue: number,
  memberEntriesMap: Map<string, Array<{ yearId: string }>>,
  years: Array<{ id: string; code: string }>,
): boolean {
  if (!excludeInactive) {
    return false;
  }

  const memberEntries = memberEntriesMap.get(memberId) || [];

  if (memberEntries.length === 0) {
    return true; // No entries at all = inactive
  }

  // Find the most recent year with entries
  const entryYears = memberEntries.map((e) => {
    const year = years.find((y) => y.id === e.yearId);
    return year ? parseInt(year.code) : 0;
  });

  const lastActivityYear = Math.max(...entryYears);
  const inactivityThreshold = currentYearValue - inactivityYears;

  return lastActivityYear < inactivityThreshold;
}
