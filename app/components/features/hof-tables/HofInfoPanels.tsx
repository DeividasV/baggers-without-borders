import {
  type AwardTier,
  getTierBorderColor,
  getTierTextColor,
  getTierGradient,
} from "@/src/lib/hofTierUtils";

type LceCountry = {
  countryId: string;
  hasLce: boolean;
};

type HofYearConfig = {
  minPeaks: number;
  minPeaksEnabled?: boolean;
  minForeignPeaks: number;
  minForeignPeaksEnabled?: boolean;
  minFpr: number;
  minFprEnabled?: boolean;
  minimumAge: number;
  minimumAgeEnabled?: boolean;
  lceEnabled?: boolean;
  lceMinFpr?: number;
  lceMinPeaks?: number | null;
  lceMinForeignPeaks?: number | null;
  lceCountries?: LceCountry[];
};

type Country = {
  id: string;
  name: string;
  code: string;
};

type HofInfoPanelsProps = {
  config: HofYearConfig | null;
  awardTiers: AwardTier[];
  hofLabel: string;
  yearLabel: string;
  isAdmin: boolean;
  countries?: Country[];
  hof?: {
    progressRegisterExcludeRetired?: boolean;
    progressRegisterExcludeDeceased?: boolean;
    progressRegisterExcludeInactive?: boolean;
    progressRegisterInactivityYears?: number;
  };
  exclusionStats?: {
    retiredCount: number;
    deceasedCount: number;
    inactiveCount: number;
    totalExcluded: number;
  } | null;
};

export default function HofInfoPanels({
  config,
  awardTiers,
  hofLabel,
  yearLabel,
  isAdmin,
  countries = [],
  hof,
  exclusionStats,
}: HofInfoPanelsProps) {
  // Get LCE country names
  const lceCountryIds =
    config?.lceCountries?.filter((c) => c.hasLce).map((c) => c.countryId) || [];
  const lceCountryNames = countries
    .filter((c) => lceCountryIds.includes(c.id))
    .map((c) => c.name)
    .sort();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Table Guide */}
      <div className="card bg-dark-800/50 border border-dark-600">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:justify-between gap-1 sm:gap-2 mb-3">
          <h3 className="text-sm font-semibold text-primary-400">
            Hall of Fame Table
          </h3>
          <span className="text-xs font-medium text-gray-300">Table Guide</span>
        </div>
        <div className="space-y-1.5 text-sm text-gray-400">
          <p>
            <span className="font-medium text-gray-300">Year Filter:</span>{" "}
            Select a specific year to view climbing statistics for that period
          </p>
          <p>
            <span className="font-medium text-gray-300">
              Hall of Fame Filter:
            </span>{" "}
            Choose different prominence categories (P100m, P300m, P500m, etc.)
          </p>
          <p>
            <span className="font-medium text-gray-300">Total Peaks:</span>{" "}
            Cumulative number of peaks with selected Hall of Fame climbed across
            all years
          </p>
          <p>
            <span className="font-medium text-gray-300">
              Peaks in {yearLabel}:
            </span>{" "}
            Number of peaks climbed in the selected year only
          </p>
          <p>
            <span className="font-medium text-gray-300">
              FPR (Foreign Peaks Ratio):
            </span>{" "}
            Percentage of foreign peaks out of total peaks in this Hall of Fame
            (calculated across all years)
          </p>
          <p>
            <span className="font-medium text-gray-300">
              Progress Register:
            </span>{" "}
            Members who participated but didn't meet all qualification
            requirements appear in a separate table below. To appear in Progress
            Register, members must have at least 2 total peaks and 2 foreign
            peaks.
          </p>
        </div>

        {/* Ranking and Tie-Breaking Rules */}
        <div className="mt-4 pt-4 border-t border-dark-600">
          <h4 className="text-sm font-semibold text-primary-400 mb-2">
            Ranking order
          </h4>
          <p className="text-sm text-gray-400 mb-2">
            Members are ranked by total peaks. If totals match, each tie-break
            below is checked in sequence until rank is determined:
          </p>
          <ol className="space-y-1.5 text-sm text-gray-400 list-decimal list-inside ml-3 sm:ml-4 pl-1">
            <li>Higher FPR percentage</li>
            <li>More peaks climbed in {yearLabel}</li>
            <li>
              Earlier first qualification year{" "}
              <span className="text-xs text-gray-500">
                (year first met minimum requirements)
              </span>
            </li>
            <li>
              Display name in reverse alphabetical order (Z ranks higher than A)
            </li>
          </ol>
        </div>

        {/* Expandable Rows */}
        <div className="mt-4 pt-4 border-t border-dark-600">
          <h4 className="text-sm font-semibold text-primary-400 mb-2">
            Expandable member details
          </h4>
          <div className="space-y-1.5 text-sm text-gray-400">
            <p>Click any member row to expand and view detailed information:</p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                <div>
                  <span className="font-medium text-gray-300">
                    Hall of Fame Table:
                  </span>{" "}
                  Yearly history, country details, award progression
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                <div>
                  <span className="font-medium text-gray-300">
                    Progress Register:
                  </span>{" "}
                  Progress tracking with visual indicators for all requirements
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Badge Explanations */}
        <div className="mt-4 pt-4 border-t border-dark-600">
          <h4 className="text-sm font-semibold text-primary-400 mb-2">
            Member badges
          </h4>
          <p className="text-sm text-gray-400 mb-3">
            Badges are automatically added to members based on their status and
            achievements:
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50 whitespace-nowrap">
                You
              </span>
              <span className="text-sm text-gray-400">This is you</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-600/50 whitespace-nowrap">
                New Entrant
              </span>
              <span className="text-sm text-gray-400">
                First time qualifying for this table
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-600/50 whitespace-nowrap">
                New Award
              </span>
              <span className="text-sm text-gray-400">
                Reached a new award level
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50 whitespace-nowrap">
                Retired in XXXX
              </span>
              <span className="text-sm text-gray-400">
                No longer actively climbing
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600/50 whitespace-nowrap">
                Deceased in XXXX
              </span>
              <span className="text-sm text-gray-400">
                Member has passed away
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50 whitespace-nowrap">
                LCE
              </span>
              <span className="text-sm text-gray-400">
                Lower requirement for large countries
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50 whitespace-nowrap">
                Junior
              </span>
              <span className="text-sm text-gray-400">
                Below minimum age requirement
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-600/50 whitespace-nowrap">
                National
              </span>
              <span className="text-sm text-gray-400">
                Has sufficient minimum peaks
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-600/20 text-gray-500 px-2 py-0.5 rounded-full border border-gray-600/30 whitespace-nowrap">
                No Data in {yearLabel}
              </span>
              <span className="text-sm text-gray-400">
                Did not submit data this year
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-600/20 text-gray-500 px-2 py-0.5 rounded-full border border-gray-600/30 whitespace-nowrap">
                Missing Data
              </span>
              <span className="text-sm text-gray-400">
                Birth year not provided (age cannot be verified)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimum Requirements & Award Tiers */}
      <div className="card bg-dark-800/50 border border-dark-600">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:justify-between gap-1 sm:gap-2 mb-3">
          <h3 className="text-sm font-semibold text-primary-400">
            Minimum Requirements
          </h3>
          <span className="text-xs font-medium text-gray-300">
            {hofLabel} {yearLabel} Rules
          </span>
        </div>
        {config &&
        ((config.minPeaksEnabled !== false && config.minPeaks > 0) ||
          (config.minForeignPeaksEnabled !== false &&
            config.minForeignPeaks > 0) ||
          (config.minFprEnabled !== false && config.minFpr > 0) ||
          (config.minimumAgeEnabled !== false && config.minimumAge > 0)) ? (
          <div className="space-y-1.5 text-sm text-gray-400">
            <p>Only participants who meet the following criteria are shown:</p>
            <ul className="space-y-1.5 mt-3">
              {config.minPeaksEnabled !== false && config.minPeaks > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                  <div>
                    <span className="font-medium text-gray-300">
                      Minimum {config.minPeaks} peaks
                    </span>
                    {config.lceEnabled && config.lceMinPeaks !== null && (
                      <span className="text-gray-300 ml-1">
                        (LCE: {config.lceMinPeaks})
                      </span>
                    )}
                    <span className="text-gray-400">
                      {" "}
                      - Total peaks climbed across all years
                    </span>
                  </div>
                </li>
              )}
              {config.minForeignPeaksEnabled !== false &&
                config.minForeignPeaks > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                    <div>
                      <span className="font-medium text-gray-300">
                        Minimum {config.minForeignPeaks} foreign peaks
                      </span>
                      {config.lceEnabled &&
                        config.lceMinForeignPeaks !== null && (
                          <span className="text-gray-300 ml-1">
                            (LCE: {config.lceMinForeignPeaks})
                          </span>
                        )}
                      <span className="text-gray-400">
                        {" "}
                        - Total foreign peaks climbed across all years
                      </span>
                    </div>
                  </li>
                )}
              {config.minFprEnabled !== false && config.minFpr > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                  <div>
                    <span className="font-medium text-gray-300">
                      Minimum {config.minFpr}% FPR
                    </span>
                    {config.lceEnabled && config.lceMinFpr !== null && (
                      <span className="text-gray-300 ml-1">
                        (LCE: {config.lceMinFpr}%)
                      </span>
                    )}
                    <span className="text-gray-400">
                      {" "}
                      - Foreign Peak Ratio percentage
                    </span>
                  </div>
                </li>
              )}
              {config.minimumAgeEnabled !== false && config.minimumAge > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                  <div>
                    <span className="font-medium text-gray-300">
                      Minimum age {config.minimumAge} years
                    </span>
                    <span className="text-gray-400">
                      {" "}
                      - Member's age during {yearLabel}
                    </span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        ) : (
          <div className="space-y-1.5 text-sm text-gray-400">
            <p>No filtering requirements are set.</p>
            <p>All participants with HOF entries are shown in the table.</p>
            {isAdmin && (
              <div className="pt-3 mt-3 border-t border-dark-600">
                <a
                  href="/admin/configuration/new"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Create filtering configuration
                </a>
              </div>
            )}
          </div>
        )}

        {/* Large Country Exception */}
        {config?.lceEnabled && lceCountryNames.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dark-600">
            <h4 className="text-sm font-semibold text-primary-400 mb-3">
              Large country exception (LCE)
            </h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                <div>
                  <span className="font-medium text-gray-300">
                    Exempt Countries:{" "}
                  </span>
                  <span className="text-gray-400">
                    {lceCountryNames.join(", ")}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                <div>
                  <span className="font-medium text-gray-300">
                    LCE Peaks: {config.lceMinPeaks ?? config.minPeaks}
                  </span>
                  {config.lceMinPeaks !== null &&
                    config.lceMinPeaks !== config.minPeaks && (
                      <span className="text-gray-400 ml-1">
                        (Standard: {config.minPeaks})
                      </span>
                    )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                <div>
                  <span className="font-medium text-gray-300">
                    LCE Foreign Peaks:{" "}
                    {config.lceMinForeignPeaks ?? config.minForeignPeaks}
                  </span>
                  {config.lceMinForeignPeaks !== null &&
                    config.lceMinForeignPeaks !== config.minForeignPeaks && (
                      <span className="text-gray-400 ml-1">
                        (Standard: {config.minForeignPeaks})
                      </span>
                    )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                <div>
                  <span className="font-medium text-gray-300">
                    LCE FPR: {config.lceMinFpr ?? config.minFpr}%
                  </span>
                  {config.lceMinFpr !== null &&
                    config.lceMinFpr !== config.minFpr && (
                      <span className="text-gray-400 ml-1">
                        (Standard: {config.minFpr}%)
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Register Requirements */}
        <div className="mt-4 pt-4 border-t border-dark-600">
          <h4 className="text-sm font-semibold text-primary-400 mb-1">
            Progress Register Requirements
          </h4>
          <p className="text-xs text-gray-400 mb-2">
            Minimum requirements to appear in Progress Register
          </p>
          <div className="space-y-1.5 text-sm text-gray-400">
            <p>
              Members who don't qualify for the Hall of Fame table appear in the
              Progress Register if they meet these minimum requirements:
            </p>
            <ul className="space-y-1.5 mt-3">
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                <div>
                  <span className="font-medium text-gray-300">
                    Minimum 2 peaks
                  </span>
                  <span className="text-gray-400">
                    {" "}
                    - Total peaks climbed across all years
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                <div>
                  <span className="font-medium text-gray-300">
                    Minimum 2 foreign peaks
                  </span>
                  <span className="text-gray-400">
                    {" "}
                    - Total foreign peaks climbed across all years
                  </span>
                </div>
              </li>
            </ul>
            {hof &&
              (hof.progressRegisterExcludeRetired ||
                hof.progressRegisterExcludeDeceased ||
                hof.progressRegisterExcludeInactive) && (
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                    <div>
                      <span className="font-medium text-gray-300">
                        Excludes:{" "}
                      </span>
                      {hof.progressRegisterExcludeRetired && (
                        <span className="text-gray-400">retired members</span>
                      )}
                      {hof.progressRegisterExcludeRetired &&
                        (hof.progressRegisterExcludeDeceased ||
                          hof.progressRegisterExcludeInactive) && (
                          <span className="text-gray-400">, </span>
                        )}
                      {hof.progressRegisterExcludeDeceased && (
                        <span className="text-gray-400">deceased members</span>
                      )}
                      {hof.progressRegisterExcludeDeceased &&
                        hof.progressRegisterExcludeInactive && (
                          <span className="text-gray-400">, and </span>
                        )}
                      {!hof.progressRegisterExcludeDeceased &&
                        hof.progressRegisterExcludeInactive &&
                        hof.progressRegisterExcludeRetired && (
                          <span className="text-gray-400"> and </span>
                        )}
                      {hof.progressRegisterExcludeInactive && (
                        <>
                          <span className="text-gray-400">
                            inactive members
                          </span>
                          <span className="text-gray-400">
                            {" "}
                            (no activity in last{" "}
                            {hof.progressRegisterInactivityYears || 2} year
                            {(hof.progressRegisterInactivityYears || 2) !== 1
                              ? "s"
                              : ""}{" "}
                            in this Hall of Fame)
                          </span>
                        </>
                      )}
                    </div>
                  </li>
                </ul>
              )}
            <p className="text-xs text-gray-500 mt-3 italic">
              Members with fewer than 2 peaks or 2 foreign peaks are not shown
              in either table.
              {hof &&
                (hof.progressRegisterExcludeRetired ||
                  hof.progressRegisterExcludeDeceased ||
                  hof.progressRegisterExcludeInactive) &&
                " These exclusions only apply to the Progress Register. Qualified members always remain visible in the Hall of Fame table."}
            </p>

            {/* Admin exclusion statistics */}
            {isAdmin && exclusionStats && exclusionStats.totalExcluded > 0 && (
              <div className="mt-3 p-3 bg-dark-900 rounded border border-dark-700">
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Admin: Exclusion Statistics
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                  {hof?.progressRegisterExcludeRetired &&
                    exclusionStats.retiredCount > 0 && (
                      <div>
                        Retired:{" "}
                        <span className="text-gray-300 font-medium">
                          {exclusionStats.retiredCount}
                        </span>
                      </div>
                    )}
                  {hof?.progressRegisterExcludeDeceased &&
                    exclusionStats.deceasedCount > 0 && (
                      <div>
                        Deceased:{" "}
                        <span className="text-gray-300 font-medium">
                          {exclusionStats.deceasedCount}
                        </span>
                      </div>
                    )}
                  {hof?.progressRegisterExcludeInactive &&
                    exclusionStats.inactiveCount > 0 && (
                      <div>
                        Inactive:{" "}
                        <span className="text-gray-300 font-medium">
                          {exclusionStats.inactiveCount}
                        </span>
                      </div>
                    )}
                  <div className="col-span-2 pt-2 border-t border-dark-700">
                    Total excluded:{" "}
                    <span className="text-primary-400 font-medium">
                      {exclusionStats.totalExcluded}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Award Tiers */}
        {awardTiers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dark-600">
            <h4 className="text-sm font-semibold text-primary-400 mb-2">
              Award tiers
            </h4>
            <p className="text-sm text-gray-400 mb-2">
              Rows have colored left borders and rank backgrounds based on total
              peaks:
            </p>
            <div className="space-y-1 text-sm">
              {awardTiers
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((tier) => (
                  <div
                    key={tier.id}
                    className={`flex items-center justify-between gap-2 rounded px-2 py-1 border-l-4 ${getTierBorderColor(
                      tier.name,
                    )} relative overflow-hidden`}
                  >
                    {/* Gradient background matching table */}
                    <div
                      className={`absolute inset-0 ${getTierGradient(
                        tier.name,
                      )} pointer-events-none`}
                    ></div>
                    <div className="flex items-center gap-2 relative z-10">
                      <span
                        className={`font-medium ${getTierTextColor(tier.name)}`}
                      >
                        {tier.name}
                      </span>
                    </div>
                    <span className="text-gray-400 relative z-10 font-mono tabular-nums text-right min-w-30">
                      {tier.minPeaks}-{tier.maxPeaks ?? "∞"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
