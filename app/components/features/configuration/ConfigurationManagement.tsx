"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Settings,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  Trophy,
  Calendar,
} from "lucide-react";
import SearchInput from "@/ui/SearchInput";
import StatsCard from "@/ui/StatsCard";
import SortableTableHeader from "@/ui/SortableTableHeader";
import MultiValueTableHeader from "@/ui/MultiValueTableHeader";
import { formatNumber } from "@/src/lib/utils";

type HofYearConfig = {
  id: string;
  hofId: string;
  yearId: string;
  minPeaks: number;
  minPeaksEnabled?: boolean;
  minForeignPeaks: number;
  minForeignPeaksEnabled?: boolean;
  minFpr: number;
  minFprEnabled?: boolean;
  minimumAge?: number;
  minimumAgeEnabled?: boolean;
  lceEnabled?: boolean;
  lceMinFpr?: number | null;
  lceMinPeaks?: number | null;
  lceMinForeignPeaks?: number | null;
  notes: string | null;
  hofmeister?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  hof: {
    id: string;
    code: string;
    title: string;
    isActive: boolean;
    displayOrder: number;
  };
  year: {
    id: string;
    code: string;
    title: string;
    isActive: boolean;
    displayOrder: number;
  };
  createdAt: string;
  updatedAt: string;
};

type HallOfFame = {
  id: string;
  code: string;
  title: string;
  isActive: boolean;
  displayOrder: number;
};

type Year = {
  id: string;
  code: string;
  title: string;
  isActive: boolean;
  displayOrder: number;
};

export default function ConfigurationManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [configs, setConfigs] = useState<HofYearConfig[]>([]);
  const [hofs, setHofs] = useState<HallOfFame[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  // Derive values from URL params to ensure they're always in sync
  const searchTerm = searchParams.get("search") || "";
  const hofFilter = searchParams.get("hofId") || "ALL";
  const yearFilter = searchParams.get("yearId") || "ALL";
  const sortBy = searchParams.get("sortBy") || "hof.code";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  useEffect(() => {
    fetchData();
  }, []);

  const updateURL = (updates: {
    search?: string;
    hofId?: string;
    yearId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    const params = new URLSearchParams();

    const newSearch =
      updates.search !== undefined ? updates.search : searchTerm;
    const newHofFilter =
      updates.hofId !== undefined ? updates.hofId : hofFilter;
    const newYearFilter =
      updates.yearId !== undefined ? updates.yearId : yearFilter;
    const newSortBy = updates.sortBy !== undefined ? updates.sortBy : sortBy;
    const newSortOrder =
      updates.sortOrder !== undefined ? updates.sortOrder : sortOrder;

    if (newSearch.trim()) {
      params.set("search", newSearch.trim());
    }

    if (newHofFilter !== "ALL") {
      params.set("hofId", newHofFilter);
    }

    if (newYearFilter !== "ALL") {
      params.set("yearId", newYearFilter);
    }

    params.set("sortBy", newSortBy);
    params.set("sortOrder", newSortOrder);

    const newUrl = params.toString()
      ? `?${params.toString()}`
      : "/admin/configuration";
    router.replace(newUrl, { scroll: false });
  };

  const fetchData = async () => {
    // Only fetch once on initial mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      setLoading(true);
      const [configsRes, hofsRes, yearsRes] = await Promise.all([
        fetch("/api/hof-year-configs"),
        fetch("/api/hofs"),
        fetch("/api/years"),
      ]);

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigs(data);
      }

      if (hofsRes.ok) {
        const data = await hofsRes.json();
        setHofs(data);
      }

      if (yearsRes.ok) {
        const data = await yearsRes.json();
        setYears(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order - must include sortBy to ensure it's set in URL
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      updateURL({ sortBy: field, sortOrder: newOrder });
    } else {
      // New field, default to ascending
      updateURL({ sortBy: field, sortOrder: "asc" });
    }
  };

  // Filter configs
  const filteredConfigs = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    return configs.filter((config) => {
      const matchesSearch =
        searchLower === "" ||
        config.hof.code.toLowerCase().includes(searchLower) ||
        config.hof.title.toLowerCase().includes(searchLower) ||
        config.year.code.toLowerCase().includes(searchLower) ||
        config.year.title.toLowerCase().includes(searchLower);

      const matchesHof = hofFilter === "ALL" || config.hofId === hofFilter;
      const matchesYear = yearFilter === "ALL" || config.yearId === yearFilter;

      return matchesSearch && matchesHof && matchesYear;
    });
  }, [configs, searchTerm, hofFilter, yearFilter]);

  // Sort configs
  const sortedConfigs = useMemo(() => {
    const sorted = [...filteredConfigs].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "hof.code":
          // Use displayOrder for HoF sorting instead of code
          aValue = a.hof.displayOrder;
          bValue = b.hof.displayOrder;
          break;
        case "year.code":
          // Use displayOrder for Year sorting instead of code
          aValue = a.year.displayOrder;
          bValue = b.year.displayOrder;
          break;
        case "hofmeister.displayName":
          aValue = a.hofmeister?.displayName || "";
          bValue = b.hofmeister?.displayName || "";
          break;
        case "minPeaks":
          aValue = a.minPeaks;
          bValue = b.minPeaks;
          break;
        case "lceMinPeaks":
          aValue = a.lceMinPeaks ?? 0;
          bValue = b.lceMinPeaks ?? 0;
          break;
        case "minForeignPeaks":
          aValue = a.minForeignPeaks;
          bValue = b.minForeignPeaks;
          break;
        case "lceMinForeignPeaks":
          aValue = a.lceMinForeignPeaks ?? 0;
          bValue = b.lceMinForeignPeaks ?? 0;
          break;
        case "minFpr":
          aValue = a.minFpr;
          bValue = b.minFpr;
          break;
        case "lceMinFpr":
          aValue = a.lceMinFpr ?? 0;
          bValue = b.lceMinFpr ?? 0;
          break;
        case "minimumAge":
          aValue = a.minimumAge || 0;
          bValue = b.minimumAge || 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          aValue = a.hof.displayOrder;
          bValue = b.hof.displayOrder;
      }

      // Handle numeric sorting (including displayOrder)
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Handle string sorting
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortOrder === "asc") {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      }

      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
    });

    return sorted;
  }, [filteredConfigs, sortBy, sortOrder]);

  const navigateToConfig = (configId: string) => {
    const params = new URLSearchParams();

    if (searchTerm) params.set("search", searchTerm);
    if (hofFilter && hofFilter !== "ALL") params.set("hofId", hofFilter);
    if (yearFilter && yearFilter !== "ALL") params.set("yearId", yearFilter);

    const queryString = params.toString();
    const returnUrl = queryString
      ? `/admin/configuration?${queryString}`
      : "/admin/configuration";

    router.push(
      `/admin/configuration/${configId}?returnTo=${encodeURIComponent(
        returnUrl,
      )}`,
    );
  };

  // Stats
  const totalConfigs = configs.length;
  const activeConfigs = configs.filter(
    (c) => c.hof.isActive && c.year.isActive,
  ).length;
  const inactiveConfigs = totalConfigs - activeConfigs;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-primary-400">Loading configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-400">
          Hall of Fame Configuration
        </h1>
        <p className="text-gray-400 mt-1">
          Manage display and filtering settings for Hall of Fame tables
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            icon={Settings}
            value={formatNumber(totalConfigs)}
            label="Total"
          />
          <StatsCard
            icon={CheckCircle2}
            value={formatNumber(activeConfigs)}
            label="Active"
          />
          <StatsCard
            icon={XCircle}
            value={formatNumber(inactiveConfigs)}
            label="Inactive"
          />
        </div>
      </div>

      {/* Management and Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/admin/hofs")}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Trophy className="h-5 w-5" />
            <span>Manage HoFs</span>
          </button>
          <button
            onClick={() => router.push("/admin/years")}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Calendar className="h-5 w-5" />
            <span>Manage Years</span>
          </button>
        </div>
        <button
          onClick={() => router.push("/admin/configuration/new")}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Configuration</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchInput
              value={searchTerm}
              onChange={(e) => updateURL({ search: e.target.value })}
              placeholder="Search by HoF or Year..."
            />
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={hofFilter}
                onChange={(e) => updateURL({ hofId: e.target.value })}
                className="input-field pl-10 w-full"
              >
                <option value="ALL">All HoFs</option>
                {hofs.map((hof) => (
                  <option key={hof.id} value={hof.id}>
                    {hof.code} - {hof.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={yearFilter}
                onChange={(e) => updateURL({ yearId: e.target.value })}
                className="input-field pl-10 w-full"
              >
                <option value="ALL">All Years</option>
                {years.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.code} - {year.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info and Clear Button */}
          <div className="flex justify-between items-center gap-2 pt-2">
            <div className="text-xs text-gray-400">
              <span className="font-medium text-gray-300">
                {filteredConfigs.length}
              </span>{" "}
              {filteredConfigs.length === 1 ? "record" : "records"}
            </div>
            <button
              onClick={() => {
                updateURL({
                  search: "",
                  hofId: "ALL",
                  yearId: "ALL",
                  sortBy: "hof.code",
                  sortOrder: "asc",
                });
              }}
              disabled={
                !searchTerm && hofFilter === "ALL" && yearFilter === "ALL"
              }
              className="text-xs text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Configurations List */}
      {filteredConfigs.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">
              No configurations found
            </h2>
            <p className="text-gray-500">
              {searchTerm || hofFilter !== "ALL" || yearFilter !== "ALL"
                ? "Try adjusting your filters"
                : "Create your first configuration to get started"}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-600">
                    <SortableTableHeader
                      label="Hall of Fame"
                      field="hof.code"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="left"
                    />
                    <SortableTableHeader
                      label="Year"
                      field="year.code"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="left"
                    />
                    <SortableTableHeader
                      label="HoF Meister"
                      field="hofmeister.displayName"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="left"
                    />
                    <MultiValueTableHeader
                      label="Min Peaks"
                      options={[
                        { label: "Standard", field: "minPeaks" },
                        { label: "LCE", field: "lceMinPeaks" },
                      ]}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="center"
                    />
                    <MultiValueTableHeader
                      label="Min Foreign Peaks"
                      options={[
                        { label: "Standard", field: "minForeignPeaks" },
                        { label: "LCE", field: "lceMinForeignPeaks" },
                      ]}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="center"
                    />
                    <MultiValueTableHeader
                      label="Min FPR"
                      options={[
                        { label: "Standard", field: "minFpr" },
                        { label: "LCE", field: "lceMinFpr" },
                      ]}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="center"
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedConfigs.map((config) => {
                    const isActive =
                      config.hof.isActive && config.year.isActive;
                    return (
                      <tr
                        key={config.id}
                        onClick={() => navigateToConfig(config.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigateToConfig(config.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open configuration for ${config.hof.code} ${config.year.code}`}
                        className="border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
                      >
                        <td className="py-4 px-4">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {config.hof.code}
                              </span>
                              {config.lceEnabled && (
                                <span className="text-xs text-green-400 border border-green-600/40 bg-dark-800 px-2 py-0.5 rounded-full">
                                  LCE
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-400 wrap-break-word">
                              {config.hof.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-white">
                              {config.year.code}
                            </span>
                            <span className="text-sm text-gray-400 wrap-break-word">
                              {config.year.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <span className="text-sm text-gray-300">
                            {config.hofmeister?.displayName || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col items-center">
                            <span className="text-gray-300">
                              {config.minPeaks}
                            </span>
                            {config.lceEnabled &&
                              config.lceMinPeaks != null && (
                                <span className="text-sm text-gray-500">
                                  LCE: {config.lceMinPeaks}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col items-center">
                            <span className="text-gray-300">
                              {config.minForeignPeaks}
                            </span>
                            {config.lceEnabled &&
                              config.lceMinForeignPeaks != null && (
                                <span className="text-sm text-gray-500">
                                  LCE: {config.lceMinForeignPeaks}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col items-center">
                            <span className="text-gray-300">
                              {config.minFpr}%
                            </span>
                            {config.lceEnabled && config.lceMinFpr != null && (
                              <span className="text-sm text-gray-500">
                                LCE: {config.lceMinFpr}%
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {sortedConfigs.map((config) => {
              const isActive = config.hof.isActive && config.year.isActive;
              return (
                <div
                  key={config.id}
                  onClick={() => navigateToConfig(config.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigateToConfig(config.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open configuration for ${config.hof.code} ${config.year.code}`}
                  className="bg-dark-800 border border-dark-600 rounded-lg p-4 cursor-pointer hover:bg-dark-750 transition-colors focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-white wrap-break-word">
                          {config.hof.code} - {config.year.code}
                        </h2>
                        {config.lceEnabled && (
                          <span className="text-xs text-green-400 border border-green-600/40 bg-dark-800 px-2 py-0.5 rounded-full">
                            LCE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1 wrap-break-word">
                        {config.hof.title} • {config.year.title}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Min Peaks:</span>
                      <span className="text-gray-300">
                        {config.minPeaks}
                        {config.lceEnabled && config.lceMinPeaks != null && (
                          <span className="text-gray-500">
                            {" "}
                            ({config.lceMinPeaks})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Min Foreign Peaks:</span>
                      <span className="text-gray-300">
                        {config.minForeignPeaks}
                        {config.lceEnabled &&
                          config.lceMinForeignPeaks != null && (
                            <span className="text-gray-500">
                              {" "}
                              ({config.lceMinForeignPeaks})
                            </span>
                          )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Min FPR:</span>
                      <span className="text-gray-300">
                        {config.minFpr}%
                        {config.lceEnabled && config.lceMinFpr != null && (
                          <span className="text-gray-500">
                            {" "}
                            ({config.lceMinFpr}%)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
