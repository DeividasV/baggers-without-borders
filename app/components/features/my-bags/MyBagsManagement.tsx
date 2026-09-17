"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  TrendingUp,
  Mountain,
  Percent,
  CalendarDays,
  Lock,
} from "lucide-react";
import StatsCard from "@/ui/StatsCard";
import Button from "@/app/components/ui/Button";
import LockIndicator from "./LockIndicator";
import { formatNumber } from "@/src/lib/utils";

type HofEntry = {
  id: string;
  memberId: string;
  hofId: string;
  yearId: string;
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  foreignPeaksInYear: number;
  isParticipatingHof?: boolean;
  isParticipatingYear?: boolean;
  isParticipating?: boolean;
  member: {
    id: string;
    username: string;
    displayName: string;
  };
  hof: {
    id: string;
    code: string;
    title: string;
    displayOrder: number;
    allowManualEntry: boolean;
  };
  year: {
    id: string;
    code: string;
    title: string;
    displayOrder: number;
    allowManualEntry: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

type MetricType =
  | "peaksInYear"
  | "totalPeaks"
  | "foreignPeaks"
  | "foreignPeaksInYear"
  | "fpr";

export default function MyBagsManagement() {
  const router = useRouter();
  const { data: session } = useSession();
  const [entries, setEntries] = useState<HofEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>("totalPeaks");
  const [userAllowManualEntry, setUserAllowManualEntry] = useState(true);
  const [disabledCount, setDisabledCount] = useState(0);
  const hasInitialized = useRef(false);

  const fetchEntries = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/my-bags`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || data);
        setUserAllowManualEntry(data.userAllowManualEntry ?? true);
        setDisabledCount(data.disabledCount ?? 0);
      }
    } catch (error) {
      console.error("Error fetching my bags entries:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!session?.user?.id) return;

    hasInitialized.current = true;
    fetchEntries();
  }, [fetchEntries]);

  // Get unique HOFs and Years, sorted by displayOrder
  const { hofs, years } = useMemo(() => {
    const hofMap = new Map<string, HofEntry["hof"]>();
    const yearMap = new Map<string, HofEntry["year"]>();

    entries.forEach((entry) => {
      hofMap.set(entry.hofId, entry.hof);
      yearMap.set(entry.yearId, entry.year);
    });

    const hofs = Array.from(hofMap.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    const years = Array.from(yearMap.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder, // Ascending order for years (earlier years first)
    );

    return { hofs, years };
  }, [entries]);

  // Create a matrix lookup: year -> hof -> entry
  const matrixData = useMemo(() => {
    const matrix = new Map<string, Map<string, HofEntry>>();

    entries.forEach((entry) => {
      if (!matrix.has(entry.yearId)) {
        matrix.set(entry.yearId, new Map());
      }
      matrix.get(entry.yearId)!.set(entry.hofId, entry);
    });

    return matrix;
  }, [entries]);

  const getEntryForCell = (yearId: string, hofId: string): HofEntry | null => {
    return matrixData.get(yearId)?.get(hofId) || null;
  };

  // Check if a cell is editable based on user, HOF, and year allowManualEntry flags
  const isCellEditable = (entry: HofEntry | null): boolean => {
    if (!entry) return false;
    return (
      userAllowManualEntry &&
      entry.hof.allowManualEntry &&
      entry.year.allowManualEntry
    );
  };

  // Get max value for current metric to calculate heatmap intensity
  const maxValueForMetric = useMemo(() => {
    if (entries.length === 0) return 1;

    let max = 0;
    entries.forEach((entry) => {
      let value = 0;
      switch (selectedMetric) {
        case "peaksInYear":
          value = entry.peaksInYear;
          break;
        case "totalPeaks":
          value = entry.totalPeaks;
          break;
        case "foreignPeaks":
          value = entry.foreignPeaks;
          break;
        case "foreignPeaksInYear":
          value = entry.foreignPeaksInYear;
          break;
        case "fpr":
          value =
            entry.totalPeaks > 0
              ? (entry.foreignPeaks / entry.totalPeaks) * 100
              : 0;
          break;
      }
      if (value > max) max = value;
    });

    return max || 1; // Avoid division by zero
  }, [entries, selectedMetric]);

  // Get heatmap color based on value
  const getHeatmapColor = (value: number): string => {
    if (value === 0) return "bg-dark-900/50";

    const intensity = Math.min(value / maxValueForMetric, 1);

    // Using primary green/yellow colors with varying opacity
    if (intensity < 0.2) return "bg-primary-900/20";
    if (intensity < 0.4) return "bg-primary-900/35";
    if (intensity < 0.6) return "bg-primary-800/40";
    if (intensity < 0.8) return "bg-primary-700/50";
    return "bg-primary-600/60";
  };

  const renderCellContent = (entry: HofEntry | null) => {
    if (!entry) {
      return <span className="text-gray-600">-</span>;
    }

    let displayValue: string | number = 0;
    switch (selectedMetric) {
      case "peaksInYear":
        displayValue = formatNumber(entry.peaksInYear);
        break;
      case "totalPeaks":
        displayValue = formatNumber(entry.totalPeaks);
        break;
      case "foreignPeaks":
        displayValue = formatNumber(entry.foreignPeaks);
        break;
      case "foreignPeaksInYear":
        displayValue = formatNumber(entry.foreignPeaksInYear);
        break;
      case "fpr":
        const fpr =
          entry.totalPeaks > 0
            ? (entry.foreignPeaks / entry.totalPeaks) * 100
            : 0;
        displayValue = `${fpr.toFixed(1)}%`;
        break;
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">
          {displayValue === "0" || displayValue === "0.0%" ? "" : displayValue}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-primary-400">Loading entries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-400">My Bags</h1>
          <p className="text-gray-400 mt-1">
            Your Hall of Fame entries and statistics
          </p>
        </div>
        <Link href="/support">
          <Button variant="secondary" size="sm" type="button">
            Report Data Issue
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            icon={TrendingUp}
            value={formatNumber(
              (() => {
                // Find the lowest enabled HOF category (based on displayOrder)
                // HOFs are already sorted by displayOrder (ascending)
                const lowestEnabledHof = hofs.find((hof) => {
                  const hofEntries = entries.filter((e) => e.hofId === hof.id);
                  // Check if this HOF has any enabled entries (isParticipating !== false)
                  return hofEntries.some((e) => e.isParticipating !== false);
                });

                if (!lowestEnabledHof) return 0;

                // Get the latest totalPeaks from the lowest enabled HOF
                const hofEntries = entries.filter(
                  (e) => e.hofId === lowestEnabledHof.id,
                );
                return hofEntries.length > 0
                  ? Math.max(...hofEntries.map((e) => e.totalPeaks))
                  : 0;
              })(),
            )}
            label="Total Peaks"
            hasBorder="none"
          />
          <StatsCard
            icon={Mountain}
            value={formatNumber(
              (() => {
                // Find the lowest enabled HOF category
                const lowestEnabledHof = hofs.find((hof) => {
                  const hofEntries = entries.filter((e) => e.hofId === hof.id);
                  return hofEntries.some((e) => e.isParticipating !== false);
                });

                if (!lowestEnabledHof) return 0;

                // Get the latest foreignPeaks from the lowest enabled HOF
                const hofEntries = entries.filter(
                  (e) => e.hofId === lowestEnabledHof.id,
                );
                return hofEntries.length > 0
                  ? Math.max(...hofEntries.map((e) => e.foreignPeaks))
                  : 0;
              })(),
            )}
            label="Total Foreign Peaks"
            hasBorder="both"
          />
          <StatsCard
            icon={Percent}
            value={(() => {
              // Find the lowest enabled HOF category
              const lowestEnabledHof = hofs.find((hof) => {
                const hofEntries = entries.filter((e) => e.hofId === hof.id);
                return hofEntries.some((e) => e.isParticipating !== false);
              });

              if (!lowestEnabledHof) return "0.0%";

              const hofEntries = entries.filter(
                (e) => e.hofId === lowestEnabledHof.id,
              );
              const totalPeaks =
                hofEntries.length > 0
                  ? Math.max(...hofEntries.map((e) => e.totalPeaks))
                  : 0;
              const foreignPeaks =
                hofEntries.length > 0
                  ? Math.max(...hofEntries.map((e) => e.foreignPeaks))
                  : 0;
              const fpr =
                totalPeaks > 0 ? (foreignPeaks / totalPeaks) * 100 : 0;
              return `${fpr.toFixed(1)}%`;
            })()}
            label="Overall FPR"
            hasBorder="none"
          />
        </div>
      </div>

      {/* Entries Matrix */}
      {entries.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Mountain className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">
              No entries yet
            </h2>
            <p className="text-gray-500">
              Your climbing data will appear here once an administrator adds it
              to the system.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          {/* Metric Selection Tabs - Desktop Only */}
          <div className="hidden md:inline-flex rounded-lg bg-dark-700 p-1 mb-6">
            <button
              onClick={() => setSelectedMetric("totalPeaks")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                selectedMetric === "totalPeaks"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Total Peaks
            </button>
            <button
              onClick={() => setSelectedMetric("foreignPeaks")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                selectedMetric === "foreignPeaks"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Total Foreign Peaks
            </button>
            <button
              onClick={() => setSelectedMetric("fpr")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                selectedMetric === "fpr"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              FPR
            </button>
            <button
              onClick={() => setSelectedMetric("peaksInYear")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                selectedMetric === "peaksInYear"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Peaks in Year
            </button>
            <button
              onClick={() => setSelectedMetric("foreignPeaksInYear")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                selectedMetric === "foreignPeaksInYear"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Foreign Peaks in Year
            </button>
          </div>

          {/* Matrix Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-30 bg-dark-800 bg-opacity-100! border-l-2 border-l-dark-800 border-r border-t border-b border-dark-600 py-3 px-4 text-center text-sm font-medium text-gray-400 shadow-[2px_0_5px_rgba(0,0,0,0.3)] min-w-30">
                    Year / HoF
                  </th>
                  {hofs.map((hof) => (
                    <th
                      key={hof.id}
                      className="bg-dark-800 border border-dark-600 py-3 px-4 text-center text-sm font-medium text-gray-400 min-w-25 relative"
                    >
                      <span className="font-semibold">{hof.code}</span>
                      {!hof.allowManualEntry && (
                        <div
                          className="absolute top-1 right-1 opacity-30"
                          title={`Manual data entry is disabled for ${hof.code}`}
                        >
                          <Lock className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map((year, index) => (
                  <tr key={year.id}>
                    <td className="sticky left-0 z-30 bg-dark-800 bg-opacity-100! border-l-2 border-l-dark-800 border-r border-t border-b border-dark-600 py-3 px-4 font-medium text-white text-center shadow-[2px_0_5px_rgba(0,0,0,0.3)] min-w-30">
                      <span className="font-semibold block">{year.title}</span>
                      {!year.allowManualEntry && (
                        <div
                          className="absolute top-1 right-1 opacity-30"
                          title={`Manual data entry is disabled for ${year.title}`}
                        >
                          <Lock className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                    </td>
                    {hofs.map((hof) => {
                      const entry = getEntryForCell(year.id, hof.id);

                      // Get numeric value for heatmap
                      let numericValue = 0;
                      if (entry) {
                        switch (selectedMetric) {
                          case "peaksInYear":
                            numericValue = entry.peaksInYear;
                            break;
                          case "totalPeaks":
                            numericValue = entry.totalPeaks;
                            break;
                          case "foreignPeaks":
                            numericValue = entry.foreignPeaks;
                            break;
                          case "foreignPeaksInYear":
                            numericValue = entry.foreignPeaksInYear;
                            break;
                          case "fpr":
                            numericValue =
                              entry.totalPeaks > 0
                                ? (entry.foreignPeaks / entry.totalPeaks) * 100
                                : 0;
                            break;
                        }
                      }

                      const heatmapClass = entry
                        ? getHeatmapColor(numericValue)
                        : "bg-dark-900/50";

                      const isEditable = isCellEditable(entry);
                      const isDisabled =
                        entry && entry.isParticipating === false;

                      return (
                        <td
                          key={hof.id}
                          onClick={() => {
                            if (entry && isEditable && !isDisabled) {
                              router.push(
                                `/my-bags/${entry.id}/edit?returnTo=/my-bags`,
                              );
                            }
                          }}
                          className={`border border-dark-600 py-3 px-4 text-center transition-all duration-150 relative ${
                            isDisabled
                              ? "bg-dark-900/80 opacity-40 cursor-not-allowed"
                              : heatmapClass
                          } ${
                            entry && isEditable && !isDisabled
                              ? "cursor-pointer text-white hover:border-2 hover:border-primary-400 hover:shadow-[0_0_8px_rgba(132,204,22,0.5)] hover:scale-105 hover:z-20"
                              : entry && !isDisabled
                                ? "cursor-not-allowed text-gray-400"
                                : entry && isDisabled
                                  ? "text-gray-600"
                                  : "text-gray-600"
                          }`}
                        >
                          {/* Lock icon for locked HOF or Year */}
                          {entry &&
                            (!hof.allowManualEntry ||
                              !entry.year.allowManualEntry) && (
                              <div
                                className="absolute top-1 right-1 opacity-20 pointer-events-none z-0"
                                title={
                                  !hof.allowManualEntry
                                    ? `Manual data entry is disabled for ${hof.code}`
                                    : `Manual data entry is disabled for ${entry.year.title}`
                                }
                              >
                                <Lock className="h-2.5 w-2.5 text-gray-500" />
                              </div>
                            )}
                          <div className="relative z-10">
                            {renderCellContent(entry)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-linear-to-r from-primary-900/30 to-primary-800/30 border-t-2 border-primary-600/50">
                  <td className="sticky left-0 z-30 bg-dark-800 bg-opacity-100! border-l-2 border-l-dark-800 border-r border-t border-b border-dark-600 py-4 px-4 text-center text-primary-400 font-bold text-base shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                    TOTAL
                  </td>
                  {hofs.map((hof) => {
                    // Calculate totals for this HOF across all years
                    const hofEntries = entries.filter(
                      (e) => e.hofId === hof.id,
                    );
                    const sumPeaksInYear = hofEntries.reduce(
                      (sum, e) => sum + e.peaksInYear,
                      0,
                    );
                    const sumForeignPeaksInYear = hofEntries.reduce(
                      (sum, e) => sum + e.foreignPeaksInYear,
                      0,
                    );
                    // Get the latest (most recent) entry for cumulative totals
                    const latestEntry =
                      hofEntries.length > 0
                        ? hofEntries.reduce((latest, current) =>
                            current.year.displayOrder > latest.year.displayOrder
                              ? current
                              : latest,
                          )
                        : null;
                    const latestTotal = latestEntry?.totalPeaks || 0;
                    const latestForeign = latestEntry?.foreignPeaks || 0;
                    const overallFpr =
                      latestTotal > 0 ? (latestForeign / latestTotal) * 100 : 0;

                    // Check if this HOF is disabled for the user
                    const isHofDisabled =
                      hofEntries.length > 0 &&
                      hofEntries.every((e) => e.isParticipating === false);

                    let displayValue: string | number = 0;
                    switch (selectedMetric) {
                      case "peaksInYear":
                        displayValue = formatNumber(sumPeaksInYear);
                        break;
                      case "totalPeaks":
                        displayValue = formatNumber(latestTotal);
                        break;
                      case "foreignPeaks":
                        displayValue = formatNumber(latestForeign);
                        break;
                      case "foreignPeaksInYear":
                        displayValue = formatNumber(sumForeignPeaksInYear);
                        break;
                      case "fpr":
                        displayValue = `${overallFpr.toFixed(1)}%`;
                        break;
                    }

                    return (
                      <td
                        key={hof.id}
                        className={`border border-dark-600 py-4 px-4 text-center font-bold text-base ${
                          isHofDisabled
                            ? "opacity-40 text-gray-600"
                            : "text-primary-300"
                        }`}
                      >
                        {displayValue === "0" || displayValue === "0.0%"
                          ? ""
                          : displayValue}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>

            {/* Manual Entry Locked Notice - Below Table */}
            {!userAllowManualEntry && (
              <div className="mt-4 flex items-start gap-2 text-gray-500 text-xs">
                <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Manual editing of your bagg entries has been disabled. If you
                  believe this is incorrect, please contact an administrator.
                </p>
              </div>
            )}

            {/* Participation Notice */}
            {disabledCount > 0 && (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                <div className="flex items-start gap-2 text-yellow-400 text-sm">
                  <CalendarDays className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>{disabledCount}</strong>{" "}
                    {disabledCount === 1 ? "entry is" : "entries are"} disabled
                    due to participation settings. Disabled entries appear
                    grayed out and cannot be edited. Contact an administrator to
                    update your Hall of Fame or Year participation settings.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-6">
            {hofs.map((hof) => {
              const hofEntries = entries.filter((e) => e.hofId === hof.id);
              if (hofEntries.length === 0) return null;

              // Calculate totals for this HOF
              const sumPeaksInYear = hofEntries.reduce(
                (sum, e) => sum + e.peaksInYear,
                0,
              );
              const sumForeignPeaksInYear = hofEntries.reduce(
                (sum, e) => sum + e.foreignPeaksInYear,
                0,
              );
              const latestTotal =
                hofEntries.length > 0
                  ? Math.max(...hofEntries.map((e) => e.totalPeaks))
                  : 0;
              // Get the latest (most recent) entry for cumulative foreign peaks
              const latestEntry =
                hofEntries.length > 0
                  ? hofEntries.reduce((latest, current) =>
                      current.year.displayOrder > latest.year.displayOrder
                        ? current
                        : latest,
                    )
                  : null;
              const latestForeign = latestEntry?.foreignPeaks || 0;
              const hofFpr =
                latestTotal > 0 ? (latestForeign / latestTotal) * 100 : 0;

              // Check if this HOF is disabled for the user
              const isHofDisabled =
                hofEntries.length > 0 &&
                hofEntries.every((e) => e.isParticipating === false);

              return (
                <div key={hof.id} className="space-y-2">
                  {/* HOF Header */}
                  <div className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 relative">
                    <h2 className="text-lg font-bold text-white">{hof.code}</h2>
                    {!hof.allowManualEntry && (
                      <div
                        className="absolute top-2 right-2 opacity-30"
                        title={`Manual data entry is disabled for ${hof.code}`}
                      >
                        <Lock className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Year Entries for this HOF */}
                  {hofEntries
                    .sort((a, b) => a.year.displayOrder - b.year.displayOrder)
                    .map((entry) => {
                      const isEditable = isCellEditable(entry);
                      const isDisabled = entry.isParticipating === false;

                      return (
                        <div
                          key={entry.id}
                          onClick={() => {
                            if (isEditable && !isDisabled) {
                              router.push(
                                `/my-bags/${entry.id}/edit?returnTo=/my-bags`,
                              );
                            }
                          }}
                          className={`bg-dark-800 border border-dark-600 rounded-lg p-4 transition-colors relative ${
                            isDisabled
                              ? "opacity-40 cursor-not-allowed"
                              : isEditable
                                ? "cursor-pointer hover:bg-dark-750"
                                : "cursor-not-allowed opacity-75"
                          }`}
                        >
                          {/* Lock icon for locked Year - memoized component for performance */}
                          <LockIndicator
                            isLocked={!entry.year.allowManualEntry}
                            yearCode={entry.year.code}
                            size="lg"
                            label
                          />

                          {/* Year */}
                          <div className="mb-3 pb-3 border-b border-dark-600 relative z-10">
                            <p className="text-xs text-gray-500 mb-1">Year</p>
                            <p className="text-sm font-medium text-white">
                              {entry.year.title}
                            </p>
                          </div>

                          {/* All Statistics */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                In Year
                              </p>
                              <p className="text-base font-bold text-white">
                                {formatNumber(entry.peaksInYear)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Total Peaks
                              </p>
                              <p className="text-base font-bold text-white">
                                {formatNumber(entry.totalPeaks)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Total Foreign
                              </p>
                              <p className="text-base font-bold text-white">
                                {formatNumber(entry.foreignPeaks)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Foreign in Year
                              </p>
                              <p className="text-base font-bold text-white">
                                {formatNumber(entry.foreignPeaksInYear)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">FPR</p>
                              <p className="text-base font-bold text-white">
                                {entry.totalPeaks > 0
                                  ? `${(
                                      (entry.foreignPeaks / entry.totalPeaks) *
                                      100
                                    ).toFixed(1)}%`
                                  : "0.0%"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* HOF Totals */}
                  <div
                    className={`bg-linear-to-r from-primary-900/30 to-primary-800/30 border-2 border-primary-600/50 rounded-lg p-4 ${
                      isHofDisabled ? "opacity-40" : ""
                    }`}
                  >
                    <div className="text-center mb-3 pb-3 border-b border-primary-600/50">
                      <p
                        className={`text-sm font-bold ${
                          isHofDisabled ? "text-gray-600" : "text-primary-400"
                        }`}
                      >
                        {hof.code} TOTAL
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">In Year</p>
                        <p
                          className={`text-base font-bold ${
                            isHofDisabled ? "text-gray-600" : "text-primary-300"
                          }`}
                        >
                          {formatNumber(sumPeaksInYear)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Total Peaks
                        </p>
                        <p
                          className={`text-base font-bold ${
                            isHofDisabled ? "text-gray-600" : "text-primary-300"
                          }`}
                        >
                          {formatNumber(latestTotal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Total Foreign
                        </p>
                        <p
                          className={`text-base font-bold ${
                            isHofDisabled ? "text-gray-600" : "text-primary-300"
                          }`}
                        >
                          {formatNumber(latestForeign)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Foreign in Year
                        </p>
                        <p
                          className={`text-base font-bold ${
                            isHofDisabled ? "text-gray-600" : "text-primary-300"
                          }`}
                        >
                          {formatNumber(sumForeignPeaksInYear)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">FPR</p>
                        <p
                          className={`text-base font-bold ${
                            isHofDisabled ? "text-gray-600" : "text-primary-300"
                          }`}
                        >
                          {hofFpr.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Manual Entry Locked Notice - Below Mobile Cards */}
            {!userAllowManualEntry && (
              <div className="mt-4 flex items-start gap-2 text-gray-500 text-xs">
                <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Manual editing of your bagg entries has been disabled. If you
                  believe this is incorrect, please contact an administrator.
                </p>
              </div>
            )}

            {/* Participation Notice */}
            {disabledCount > 0 && (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                <div className="flex items-start gap-2 text-yellow-400 text-sm">
                  <CalendarDays className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>{disabledCount}</strong>{" "}
                    {disabledCount === 1 ? "entry is" : "entries are"} disabled
                    due to participation settings. Disabled entries appear
                    grayed out and cannot be edited. Contact an administrator to
                    update your Hall of Fame or Year participation settings.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
