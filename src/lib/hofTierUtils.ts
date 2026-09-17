/**
 * Hall of Fame Award Tier Utilities
 * Helper functions for tier-based styling and member tier determination
 */

export type AwardTier = {
  id: string;
  name: string;
  minPeaks: number;
  maxPeaks: number | null;
  displayOrder: number;
};

/**
 * Map tier names to border colors for left border accent
 */
export const getTierBorderColor = (tierName: string): string => {
  const colors: Record<string, string> = {
    Bronze: "border-l-amber-700",
    Silver: "border-l-slate-300",
    Gold: "border-l-yellow-400",
    Emerald: "border-l-emerald-400",
    Sapphire: "border-l-blue-400",
    Diamond: "border-l-purple-400",
  };
  return colors[tierName] || "";
};

/**
 * Map tier names to gradient styles for rank column (left to right fade)
 */
export const getTierGradient = (tierName: string): string => {
  const gradients: Record<string, string> = {
    Bronze:
      "bg-gradient-to-r from-amber-700/40 via-amber-800/20 to-transparent",
    Silver:
      "bg-gradient-to-r from-slate-300/30 via-slate-400/15 to-transparent",
    Gold: "bg-gradient-to-r from-yellow-400/40 via-yellow-500/20 to-transparent",
    Emerald:
      "bg-gradient-to-r from-emerald-400/40 via-emerald-500/20 to-transparent",
    Sapphire:
      "bg-gradient-to-r from-blue-400/40 via-blue-500/20 to-transparent",
    Diamond:
      "bg-gradient-to-r from-purple-400/40 via-purple-500/20 to-transparent",
  };
  return gradients[tierName] || "";
};

/**
 * Map tier names to hover background colors (brighter versions)
 */
export const getTierHoverBg = (tierName: string): string => {
  const hoverBgs: Record<string, string> = {
    Bronze: "hover:bg-amber-900/30",
    Silver: "hover:bg-slate-700/30",
    Gold: "hover:bg-yellow-800/30",
    Emerald: "hover:bg-emerald-900/30",
    Sapphire: "hover:bg-blue-900/30",
    Diamond: "hover:bg-purple-900/30",
  };
  return hoverBgs[tierName] || "hover:bg-primary-900/20";
};

/**
 * Map tier names to hover border colors (brighter versions)
 */
export const getTierHoverBorder = (tierName: string): string => {
  const hoverBorders: Record<string, string> = {
    Bronze: "hover:border-amber-600/70",
    Silver: "hover:border-slate-300/70",
    Gold: "hover:border-yellow-400/70",
    Emerald: "hover:border-emerald-400/70",
    Sapphire: "hover:border-blue-400/70",
    Diamond: "hover:border-purple-400/70",
  };
  return hoverBorders[tierName] || "hover:border-primary-600/50";
};

/**
 * Map tier names to section separator bottom border colors
 */
export const getTierBottomBorder = (tierName: string): string => {
  const bottomBorders: Record<string, string> = {
    Bronze: "border-b-amber-600/60",
    Silver: "border-b-slate-300/60",
    Gold: "border-b-yellow-400/60",
    Emerald: "border-b-emerald-400/60",
    Sapphire: "border-b-blue-400/60",
    Diamond: "border-b-purple-400/60",
  };
  return bottomBorders[tierName] || "";
};

/**
 * Map tier names to text colors for tier labels
 */
export const getTierTextColor = (tierName: string): string => {
  const colors: Record<string, string> = {
    Bronze: "text-amber-400",
    Silver: "text-slate-300",
    Gold: "text-yellow-400",
    Emerald: "text-emerald-400",
    Sapphire: "text-blue-400",
    Diamond: "text-purple-400",
  };
  return colors[tierName] || "text-primary-300";
};

/**
 * Map tier names to background colors for tier badges
 */
export const getTierBgColor = (tierName: string): string => {
  const bgColors: Record<string, string> = {
    Bronze: "bg-amber-900/20 border-amber-600/30",
    Silver: "bg-slate-700/20 border-slate-400/30",
    Gold: "bg-yellow-900/20 border-yellow-600/30",
    Emerald: "bg-emerald-900/20 border-emerald-600/30",
    Sapphire: "bg-blue-900/20 border-blue-600/30",
    Diamond: "bg-purple-900/20 border-purple-600/30",
  };
  return bgColors[tierName] || "bg-dark-800/50 border-dark-600";
};

/**
 * Determine which tier a member belongs to based on total peaks
 */
export const getMemberTier = (
  totalPeaks: number,
  tiers: AwardTier[],
): AwardTier | null => {
  // Sort tiers by minPeaks descending to check highest tier first
  const sortedTiers = [...tiers].sort((a, b) => b.minPeaks - a.minPeaks);

  for (const tier of sortedTiers) {
    if (
      totalPeaks >= tier.minPeaks &&
      (tier.maxPeaks === null || totalPeaks <= tier.maxPeaks)
    ) {
      return tier;
    }
  }
  return null;
};

/**
 * HOF Member type for sorting and ranking
 */
export type HofMember = {
  totalPeaks: number;
  fpr: number;
  peaksInYear: number;
  firstQualificationYear: string | null;
  member: {
    displayName?: string | null;
    [key: string]: any;
  };
  [key: string]: any;
};

/**
 * Compare two members using HOF tie-breaking rules:
 * 1. Higher totalPeaks (primary sort)
 * 2. Higher FPR (Foreign Peak Ratio)
 * 3. Most new peaks in the year (peaksInYear)
 * 4. Earlier hall entry year (firstQualificationYear)
 * 5. Display name in reverse alphabetical order (Z→A, nulls last)
 */
export const compareHofMembers = <T extends HofMember>(a: T, b: T): number => {
  // 1. Primary sort: totalPeaks descending (highest first)
  if (b.totalPeaks !== a.totalPeaks) {
    return b.totalPeaks - a.totalPeaks;
  }

  // 2. FPR descending (higher is better)
  if (b.fpr !== a.fpr) {
    return b.fpr - a.fpr;
  }

  // 3. Peaks in year descending (more is better)
  if (b.peaksInYear !== a.peaksInYear) {
    return b.peaksInYear - a.peaksInYear;
  }

  // 4. Earlier hall entry year (firstQualificationYear ascending)
  const aYear = a.firstQualificationYear;
  const bYear = b.firstQualificationYear;
  if (aYear !== bYear) {
    // Nulls sort last
    if (aYear === null) return 1;
    if (bYear === null) return -1;
    return aYear.localeCompare(bYear);
  }

  // 5. Display name in reverse alphabetical order (Z→A, nulls last)
  const aDisplay = a.member.displayName;
  const bDisplay = b.member.displayName;
  if (aDisplay !== bDisplay) {
    // Nulls sort last
    if (!aDisplay) return 1;
    if (!bDisplay) return -1;
    // Reverse alphabetical: Z→A (swap normal compare result)
    // localeCompare respects diacritics and international characters
    return bDisplay.localeCompare(aDisplay);
  }

  return 0;
};

/**
 * Sort HOF members using the official tie-breaking rules
 */
export const sortHofMembers = <T extends HofMember>(members: T[]): T[] => {
  return [...members].sort(compareHofMembers);
};

/**
 * Assign ranks to sorted members with tie-aware ranking
 * Members with the same totalPeaks receive the same rank number
 * Next different totalPeaks skips ranks (e.g., #3, #3, #5)
 */
export const assignRanks = <T extends HofMember & { originalRank?: number }>(
  sortedMembers: T[],
): T[] => {
  let currentRank = 1;
  let previousPeaks: number | null = null;
  let skipCount = 0;

  return sortedMembers.map((member, index) => {
    if (previousPeaks !== null && member.totalPeaks !== previousPeaks) {
      // New totalPeaks value, skip ranks based on tie count
      currentRank = currentRank + skipCount;
      skipCount = 0;
    }

    skipCount++;
    previousPeaks = member.totalPeaks;

    return {
      ...member,
      originalRank: currentRank,
    };
  });
};

/**
 * Sort and assign ranks to HOF members in one operation
 */
export const sortAndRankHofMembers = <
  T extends HofMember & { originalRank?: number },
>(
  members: T[],
): T[] => {
  const sorted = sortHofMembers(members);
  return assignRanks(sorted);
};
