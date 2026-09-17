"use client";

import Link from "next/link";
import { Search, X, Settings } from "lucide-react";

type Year = {
  id: string;
  code: string;
  title: string;
  displayOrder: number;
};

type HallOfFame = {
  id: string;
  code: string;
  title: string;
  displayOrder: number;
};

type HofYearConfig = {
  minPeaks: number;
  minForeignPeaks: number;
  minFpr: number;
  lceMinPeaks?: number | null;
  lceMinForeignPeaks?: number | null;
  hofmeister?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
};

type HofTableFiltersProps = {
  years: Year[];
  hofs: HallOfFame[];
  selectedYearId: string | null;
  selectedHofId: string | null;
  config: HofYearConfig | null;
  hofLabel: string;
  yearLabel: string;
  isAdmin: boolean;
  onYearChange: (yearId: string) => void;
  onHofChange: (hofId: string) => void;
  selectedBadges: Set<string>;
  onBadgeToggle: (badgeType: string) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
};

export default function HofTableFilters({
  years,
  hofs,
  selectedYearId,
  selectedHofId,
  config,
  hofLabel,
  yearLabel,
  isAdmin,
  onYearChange,
  onHofChange,
  selectedBadges,
  onBadgeToggle,
  searchText,
  onSearchChange,
}: HofTableFiltersProps) {
  // Define available badge filters
  const badgeFilters = [
    {
      id: "me",
      label: "Me",
      color: "primary",
      bgColor: "bg-primary-600/20",
      textColor: "text-primary-400",
      borderColor: "border-primary-600/50",
    },
    {
      id: "newEntrant",
      label: "New Entrant",
      color: "green",
      bgColor: "bg-green-600/20",
      textColor: "text-green-400",
      borderColor: "border-green-600/50",
    },
    {
      id: "newAward",
      label: "New Award",
      color: "yellow",
      bgColor: "bg-yellow-600/20",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-600/50",
    },
    {
      id: "retired",
      label: "Retired",
      color: "blue",
      bgColor: "bg-blue-600/20",
      textColor: "text-blue-400",
      borderColor: "border-blue-600/50",
    },
    {
      id: "deceased",
      label: "Deceased",
      color: "gray",
      bgColor: "bg-gray-600/20",
      textColor: "text-gray-400",
      borderColor: "border-gray-600/50",
    },
    {
      id: "lce",
      label: "LCE",
      color: "primary",
      bgColor: "bg-primary-600/20",
      textColor: "text-primary-400",
      borderColor: "border-primary-600/50",
    },
    {
      id: "junior",
      label: "Junior",
      color: "blue",
      bgColor: "bg-blue-600/20",
      textColor: "text-blue-400",
      borderColor: "border-blue-600/50",
    },
    {
      id: "national",
      label: "National",
      color: "yellow",
      bgColor: "bg-yellow-600/20",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-600/50",
    },
    {
      id: "missingData",
      label: "Missing Data",
      color: "gray",
      bgColor: "bg-gray-600/20",
      textColor: "text-gray-500",
      borderColor: "border-gray-600/30",
    },
  ];

  return (
    <>
      {/* HoF Selection - Modern Radio Style */}
      {hofs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">
              Select Hall of Fame
            </h3>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="inline-flex rounded-lg bg-dark-700 p-1 flex-wrap gap-1 max-w-full"
                role="group"
                aria-label="Hall of Fame filter"
              >
                {hofs.map((hof) => (
                  <button
                    key={hof.id}
                    onClick={() => onHofChange(hof.id)}
                    aria-pressed={selectedHofId === hof.id}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                      selectedHofId === hof.id
                        ? "bg-primary-600 text-white shadow-lg"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    {hof.code}
                  </button>
                ))}
              </div>

              <div className="inline-flex rounded-lg bg-dark-700 p-1 shrink-0">
                <Link
                  href="/p-index"
                  className="px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer text-gray-400 hover:text-gray-300 whitespace-nowrap"
                >
                  P-Index
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-start xl:justify-end gap-2 shrink-0">
              {isAdmin && selectedHofId && selectedYearId && (
                <Link
                  href={`/admin/configuration?hofId=${selectedHofId}&yearId=${selectedYearId}&sortBy=hof.code&sortOrder=asc`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-600/50 hover:border-primary-500 text-primary-300 hover:text-primary-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  HoF Configuration
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Year Selection - Modern Radio Style */}
      {years.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Select Year
          </h3>
          <div
            className="inline-flex rounded-lg bg-dark-700 p-1 flex-wrap gap-1 max-w-full"
            role="group"
            aria-label="Year filter"
          >
            {years.map((year) => (
              <button
                key={year.id}
                onClick={() => onYearChange(year.id)}
                aria-pressed={selectedYearId === year.id}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  selectedYearId === year.id
                    ? "bg-primary-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                {year.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badge Filters and Search */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Badge filters section */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Filter by Badge
            </h3>
            <div className="flex flex-wrap gap-2">
              {badgeFilters.map((badge) => {
                const isSelected = selectedBadges.has(badge.id);
                return (
                  <button
                    key={badge.id}
                    onClick={() => onBadgeToggle(badge.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? `${badge.bgColor} ${badge.textColor} ${badge.borderColor}`
                        : "bg-dark-700/50 text-gray-400 border-dark-600 hover:text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {badge.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search section */}
          <div className="w-full sm:w-64">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Search by Name
            </h3>
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-1.5 bg-dark-700 border border-dark-600 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
              />
              {searchText && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label="Clear search"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        {(selectedBadges.size > 0 || searchText) && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {selectedBadges.size > 0 &&
                "Showing records with selected badges"}
              {selectedBadges.size > 0 && searchText && " · "}
              {searchText && `Searching for "${searchText}"`}
            </span>
            {(selectedBadges.size > 0 || searchText) && (
              <button
                onClick={() => {
                  selectedBadges.forEach((badge) => onBadgeToggle(badge));
                  onSearchChange("");
                }}
                className="text-xs text-primary-400 hover:text-primary-300 underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Missing Configuration Warning */}
      {!config && selectedYearId && selectedHofId && isAdmin && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <div className="shrink-0 mt-0.5">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-300 mb-1">
                Configuration Missing
              </p>
              <p className="text-xs text-gray-400 mb-2">
                No filtering configuration exists for{" "}
                <span className="font-medium text-gray-300">
                  {hofLabel} - {yearLabel}
                </span>
                . All members with entries are shown without filters.
              </p>
              {isAdmin && (
                <Link
                  href="/admin/configuration/new"
                  className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
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
                  Create Configuration
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
