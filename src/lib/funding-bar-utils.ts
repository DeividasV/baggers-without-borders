// Client-safe: no prisma, no server-only imports
// Shared by both FundingStatusBar (client) and RunningCostsIndicator (server)

export const FUNDING_DEFAULTS = {
  totalSpent: 630.36,
  totalCollected: 559.08,
  monthlyEst: 40,
};

export type FundingSettings = {
  totalSpent: number;
  totalCollected: number;
  monthlyEst: number;
};

export type BarSegments = {
  contributedPct: number;
  gapPct: number;
  surplusFuturePct: number;
  futurePct: number;
  nowPct: number;
  gap: number;
  surplus: number;
  timelineEnd: Date;
};

export function computeBarSegments(settings: FundingSettings): BarSegments {
  const { totalSpent, totalCollected, monthlyEst } = settings;

  const gap = Math.max(0, totalSpent - totalCollected);
  const surplus = Math.max(0, totalCollected - totalSpent);

  const TIMELINE_START = new Date(2025, 8, 1); // Sep 2025
  const NOW = new Date();
  const TIMELINE_END = new Date(NOW.getFullYear(), NOW.getMonth() + 13, 1); // +12 months ahead
  const TOTAL_MS = TIMELINE_END.getTime() - TIMELINE_START.getTime();

  const nowPct = Math.min(
    99,
    Math.max(1, ((NOW.getTime() - TIMELINE_START.getTime()) / TOTAL_MS) * 100)
  );
  const futureTotalPct = 100 - nowPct;

  let contributedPct: number;
  let gapPct: number;
  let surplusFuturePct: number;
  let futurePct: number;

  if (surplus > 0) {
    contributedPct = nowPct;
    gapPct = 0;
    const surplusMonths = monthlyEst > 0 ? surplus / monthlyEst : 0;
    surplusFuturePct = Math.min(futureTotalPct, (surplusMonths / 12) * futureTotalPct);
    futurePct = futureTotalPct - surplusFuturePct;
  } else {
    contributedPct = totalSpent > 0 ? nowPct * (totalCollected / totalSpent) : nowPct;
    gapPct = nowPct - contributedPct;
    surplusFuturePct = 0;
    futurePct = futureTotalPct;
  }

  return {
    contributedPct,
    gapPct,
    surplusFuturePct,
    futurePct,
    nowPct,
    gap,
    surplus,
    timelineEnd: TIMELINE_END,
  };
}
