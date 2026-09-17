import {
  checkLceApplies,
  meetsMinimumPeaksRequirement,
  meetsMinimumForeignPeaksRequirement,
  meetsMinimumFprRequirement,
} from "../../src/lib/hofQualificationRules";
import type { MemberStats } from "../../src/types/hof";

const baseStats: MemberStats = {
  member: {
    id: "member-1",
    username: "member1",
    displayName: "Member One",
    status: "ACTIVE",
    birthYear: 2000,
    familyName: null,
    retiredYear: null,
    deceasedYear: null,
    residenceCountryId: "US",
  },
  totalPeaks: 10,
  peaksInYear: 0,
  foreignPeaks: 3,
  fpr: 30,
  isNewEntrant: false,
  isFirstTimeAward: false,
  awardTierName: null,
  dataNotProvided: false,
  hasLce: false,
  lceCountryId: null,
  memberAge: null,
};

describe("hofQualificationRules LCE behavior", () => {
  it("uses year participation country override for LCE", () => {
    const lceCountryIds = new Set(["FR"]);
    const yearParticipationMap = new Map([
      ["member-1", { enabled: true, dataNotProvided: false, countryId: "FR" }],
    ]);

    const lceInfo = checkLceApplies(
      baseStats.member.id,
      baseStats.member.residenceCountryId,
      true,
      lceCountryIds,
      yearParticipationMap,
    );

    expect(lceInfo).toEqual({ hasLce: true, lceCountryId: "FR" });
  });

  it("returns no LCE when disabled", () => {
    const lceCountryIds = new Set(["US"]);
    const yearParticipationMap = new Map();

    const lceInfo = checkLceApplies(
      baseStats.member.id,
      baseStats.member.residenceCountryId,
      false,
      lceCountryIds,
      yearParticipationMap,
    );

    expect(lceInfo).toEqual({ hasLce: false, lceCountryId: null });
  });

  it("applies LCE thresholds when present", () => {
    const lceInfo = { hasLce: true, lceCountryId: "US" };

    const meetsPeaks = meetsMinimumPeaksRequirement(
      { ...baseStats, totalPeaks: 6 },
      {
        minPeaks: 10,
        lceEnabled: true,
        lceMinPeaks: 5,
      },
      lceInfo,
    );

    const meetsForeignPeaks = meetsMinimumForeignPeaksRequirement(
      { ...baseStats, foreignPeaks: 2 },
      {
        minForeignPeaks: 4,
        lceEnabled: true,
        lceMinForeignPeaks: 2,
      },
      lceInfo,
    );

    const meetsFpr = meetsMinimumFprRequirement(
      { ...baseStats, fpr: 12 },
      {
        minFpr: 20,
        lceEnabled: true,
        lceMinFpr: 10,
        lceCountries: [],
      },
      lceInfo,
    );

    expect(meetsPeaks).toBe(true);
    expect(meetsForeignPeaks).toBe(true);
    expect(meetsFpr).toBe(true);
  });

  it("falls back to standard thresholds when LCE thresholds are null", () => {
    const lceInfo = { hasLce: true, lceCountryId: "US" };

    const meetsPeaks = meetsMinimumPeaksRequirement(
      { ...baseStats, totalPeaks: 6 },
      {
        minPeaks: 10,
        lceEnabled: true,
        lceMinPeaks: null,
      },
      lceInfo,
    );

    expect(meetsPeaks).toBe(false);
  });

  it("does not mutate stats object", () => {
    const stats = { ...baseStats };
    const lceInfo = { hasLce: true, lceCountryId: "US" };

    meetsMinimumPeaksRequirement(
      stats,
      { minPeaks: 5, lceEnabled: true, lceMinPeaks: 4 },
      lceInfo,
    );

    expect(stats.hasLce).toBe(false);
    expect(stats.lceCountryId).toBe(null);
  });
});
