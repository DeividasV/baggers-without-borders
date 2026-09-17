"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FUNDING_DEFAULTS,
  computeBarSegments,
  type FundingSettings,
  type BarSegments,
} from "@/src/lib/funding-bar-utils";

export function FundingStatusBar() {
  const [settings, setSettings] = useState<FundingSettings>(FUNDING_DEFAULTS);
  // Computed client-side only to avoid Date-based hydration mismatches
  const [seg, setSeg] = useState<BarSegments | null>(null);

  useEffect(() => {
    setSeg(computeBarSegments(settings));
  }, [settings]);

  useEffect(() => {
    fetch("/api/app-settings?category=funding")
      .then((r) => r.json())
      .then((data: Array<{ key: string; value: string }>) => {
        if (!Array.isArray(data)) return;
        const get = (key: string, fallback: number) => {
          const entry = data.find((s) => s.key === key);
          if (!entry?.value) return fallback;
          const n = parseFloat(entry.value);
          return isNaN(n) ? fallback : n;
        };
        setSettings({
          totalSpent: get("funding_total_spent", FUNDING_DEFAULTS.totalSpent),
          totalCollected: get("funding_total_collected", FUNDING_DEFAULTS.totalCollected),
          monthlyEst: get("funding_monthly_est", FUNDING_DEFAULTS.monthlyEst),
        });
      })
      .catch(() => {});
  }, []);

  const { totalCollected, monthlyEst } = settings;
  const yearlyEst = monthlyEst * 12;

  if (!seg) {
    // Placeholder matching the bar height to avoid layout shift
    return <div className="bg-dark-900 border-b border-dark-700 px-4 py-2 h-8.25" />;
  }

  return (
    <div className="bg-dark-900 border-b border-dark-700 px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        {/* Left: bar + info — progressively reveals more detail on wider screens */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-gray-500 text-xs shrink-0 hidden sm:inline">Platform costs:</span>

          {/* Mini 3-segment timeline bar */}
          <div
            className="flex h-1.5 w-16 sm:w-20 rounded-full overflow-hidden shrink-0"
            role="progressbar"
            aria-valuenow={Math.round((totalCollected / settings.totalSpent) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round((totalCollected / settings.totalSpent) * 100)}% of costs covered`}
          >
            <div className="bg-primary-400" style={{ width: `${seg.contributedPct}%` }} />
            {seg.gapPct > 0 && (
              <div className="bg-amber-500/70" style={{ width: `${seg.gapPct}%` }} />
            )}
            <div className="w-px bg-white/20 shrink-0" />
            {seg.surplusFuturePct > 0 && (
              <div className="bg-primary-400/40" style={{ width: `${seg.surplusFuturePct}%` }} />
            )}
            <div className="bg-dark-600" style={{ width: `${seg.futurePct}%` }} />
          </div>

          <span className="text-primary-400 text-xs font-medium shrink-0">
            €{totalCollected.toFixed(0)} contributed
          </span>

          {seg.gap > 0 && (
            <>
              <span className="text-gray-600 text-xs hidden sm:inline">·</span>
              <span className="text-amber-400/80 text-xs hidden sm:inline shrink-0">
                €{seg.gap.toFixed(0)} gap
              </span>
            </>
          )}

          {seg.surplus > 0 && (
            <>
              <span className="text-gray-600 text-xs hidden sm:inline">·</span>
              <span className="text-primary-300 text-xs hidden sm:inline shrink-0">
                €{seg.surplus.toFixed(0)} surplus
              </span>
            </>
          )}

          <span className="text-gray-600 text-xs hidden md:inline">·</span>
          <span className="text-gray-500 text-xs hidden md:inline shrink-0">
            est. €{yearlyEst}/year
          </span>

          <span className="text-gray-600 text-xs hidden lg:inline">·</span>
          <span className="text-gray-400 text-xs hidden lg:inline italic shrink-0">
            thanks to all contributors
          </span>
        </div>

        {/* Right: links */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/sponsors"
            className="text-gray-400 hover:text-gray-200 text-xs shrink-0 transition-colors hidden sm:inline"
          >
            Sponsors
          </Link>
          <Link
            href="/donate"
            className="text-primary-400 hover:text-primary-300 text-xs font-medium shrink-0 transition-colors"
          >
            Donate →
          </Link>
        </div>
      </div>
    </div>
  );
}
