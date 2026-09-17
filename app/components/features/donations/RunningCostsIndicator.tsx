import { getFundingSettings, computeBarSegments } from "@/src/lib/funding-settings";

const fmtMonthYear = (d: Date) => d.toLocaleString("en-US", { month: "short", year: "numeric" });

export async function RunningCostsIndicator() {
  const settings = await getFundingSettings();
  const { totalSpent, totalCollected, monthlyEst } = settings;
  const seg = computeBarSegments(settings);

  const nowPctStr = `${seg.nowPct}%`;

  return (
    <section className="mt-6 pt-6 border-t border-dark-600" aria-labelledby="running-costs-heading">
      <h3
        id="running-costs-heading"
        className="text-base sm:text-lg font-semibold text-primary-400 mb-2"
      >
        Running Costs
      </h3>
      <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
        Total costs since September 2025: €{totalSpent.toFixed(0)}. Estimated €{monthlyEst}/month
        ongoing (€{monthlyEst * 12}/year).
      </p>

      {/* Single timeline bar */}
      <div className="mb-1">
        <div
          className="flex h-4 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round((totalCollected / totalSpent) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round((totalCollected / totalSpent) * 100)}% of costs covered`}
        >
          {/* Contributed (green) */}
          <div className="bg-primary-400" style={{ width: `${seg.contributedPct}%` }} />
          {/* Gap (amber) — only when gap > 0 */}
          {seg.gapPct > 0 && (
            <div className="bg-amber-500/70" style={{ width: `${seg.gapPct}%` }} />
          )}
          {/* Now divider */}
          <div className="w-px bg-white/30 shrink-0" />
          {/* Surplus pre-funded months (lighter green) — only when surplus > 0 */}
          {seg.surplusFuturePct > 0 && (
            <div className="bg-primary-400/40" style={{ width: `${seg.surplusFuturePct}%` }} />
          )}
          {/* Remaining future (gray) */}
          <div className="bg-dark-600" style={{ width: `${seg.futurePct}%` }} />
        </div>
      </div>

      {/* Date labels */}
      <div className="relative h-5 mb-3">
        <span className="absolute left-0 text-xs text-gray-600">
          <time dateTime="2025-09">Sep 2025</time>
        </span>
        <span
          className="absolute text-xs text-gray-400 -translate-x-1/2"
          style={{ left: nowPctStr }}
        >
          now
        </span>
        <span className="absolute right-0 text-xs text-gray-600">
          <time
            dateTime={`${seg.timelineEnd.getFullYear()}-${String(seg.timelineEnd.getMonth() + 1).padStart(2, "0")}`}
          >
            {fmtMonthYear(seg.timelineEnd)}
          </time>
        </span>
      </div>

      {/* Amount labels */}
      <div className="flex items-center justify-between text-xs mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary-400" />
            <span className="text-primary-400 font-medium">
              €{totalCollected.toFixed(2)} contributed
            </span>
          </span>
          {seg.gap > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500/70" />
              <span className="text-amber-400/80">€{seg.gap.toFixed(2)} gap</span>
            </span>
          )}
          {seg.surplus > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary-400/40" />
              <span className="text-primary-300">€{seg.surplus.toFixed(2)} surplus</span>
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-dark-600 border border-dark-500" />
          est. €{monthlyEst}/mo ahead
        </span>
      </div>

      {/* Contributor thanks */}
      <p className="text-center text-xs text-gray-600 italic">
        Thank you to all members who have contributed.
      </p>
    </section>
  );
}
