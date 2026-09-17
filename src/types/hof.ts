/**
 * Shared type definitions for Hall of Fame (HOF) system
 * Centralized to avoid duplication across components
 */

export type HallOfFame = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  displayOrder: number;
  allowManualEntry?: boolean;
  createdAt?: string;
  updatedAt?: string;
  progressRegisterExcludeRetired?: boolean;
  progressRegisterExcludeDeceased?: boolean;
  progressRegisterExcludeInactive?: boolean;
  progressRegisterInactivityYears?: number;
};

export type Year = {
  id: string;
  code: string;
  title: string;
  displayOrder: number;
  isActive?: boolean;
  value?: number;
};

export type HofYearConfig = {
  id: string;
  minPeaks: number;
  minPeaksEnabled?: boolean;
  minForeignPeaks: number;
  minForeignPeaksEnabled?: boolean;
  minFpr: number;
  minFprEnabled?: boolean;
  minimumAge: number;
  minimumAgeEnabled?: boolean;
  lceEnabled?: boolean;
  lceMinFpr?: number | null;
  lceMinPeaks?: number | null;
  lceMinForeignPeaks?: number | null;
  lceCountries?: Array<{
    countryId: string;
    hasLce: boolean;
  }>;
};

export type MemberStats = {
  member: {
    id: string;
    username: string;
    displayName: string;
    status: string;
    birthYear?: number | null;
    familyName?: string | null;
    retiredYear?: number | null;
    deceasedYear?: number | null;
    residenceCountryId?: string | null;
  };
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  fpr: number;
  isNewEntrant: boolean;
  isFirstTimeAward: boolean;
  awardTierName: string | null;
  dataNotProvided: boolean;
  hasLce: boolean;
  lceCountryId?: string | null;
  memberAge?: number | null;
};

export type ProgressMemberStats = MemberStats & {
  failedMinimumAge: boolean;
  failedMinimumPeaks: boolean;
  failedMinimumForeignPeaks: boolean;
  failedMinimumFpr: boolean;
};

export type ProgressRegisterExclusionStats = {
  retiredCount: number;
  deceasedCount: number;
  inactiveCount: number;
  totalExcluded: number;
};
