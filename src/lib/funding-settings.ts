import "server-only";
import { prisma } from "@/src/lib/prisma";
import {
  FUNDING_DEFAULTS,
  computeBarSegments,
  type FundingSettings,
  type BarSegments,
} from "@/src/lib/funding-bar-utils";

export { FUNDING_DEFAULTS, computeBarSegments };
export type { FundingSettings, BarSegments };

export async function getFundingSettings(): Promise<FundingSettings> {
  try {
    const settings = await prisma.appSetting.findMany({
      where: { category: "funding" },
    });

    const get = (key: string, fallback: number): number => {
      const s = settings.find((s) => s.key === key);
      if (!s?.value) return fallback;
      const n = parseFloat(s.value);
      return isNaN(n) ? fallback : n;
    };

    return {
      totalSpent: get("funding_total_spent", FUNDING_DEFAULTS.totalSpent),
      totalCollected: get("funding_total_collected", FUNDING_DEFAULTS.totalCollected),
      monthlyEst: get("funding_monthly_est", FUNDING_DEFAULTS.monthlyEst),
    };
  } catch {
    return { ...FUNDING_DEFAULTS };
  }
}
