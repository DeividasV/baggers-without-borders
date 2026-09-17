"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Database,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import SearchableSelect from "@/ui/SearchableSelect";
import { Pagination } from "@/ui/Pagination";
import ConfirmationDialog from "@/ui/ConfirmationDialog";
import StatsCard from "@/ui/StatsCard";
import SortableTableHeader from "@/ui/SortableTableHeader";
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
  member: {
    id: string;
    username: string;
    displayName: string;
  };
  hof: {
    id: string;
    code: string;
    title: string;
  };
  year: {
    id: string;
    code: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
};

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export default function DataEntryManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<HofEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "20"),
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [memberFilter, setMemberFilter] = useState<string>(
    searchParams.get("member") || "ALL"
  );
  const [hofFilter, setHofFilter] = useState<string>(
    searchParams.get("hof") || "ALL"
  );
  const [yearFilter, setYearFilter] = useState<string>(
    searchParams.get("year") || "ALL"
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sortBy") || "member.displayName"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc"
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Get unique members, HOFs and Years for filters (from all entries)
  const [allHofs, setAllHofs] = useState<
    Array<{ id: string; code: string; title: string }>
  >([]);
  const [allYears, setAllYears] = useState<
    Array<{ id: string; code: string; title: string }>
  >([]);
  const [allMembers, setAllMembers] = useState<
    Array<{ id: string; username: string; displayName: string }>
  >([]);
  const hasInitializedFilters = useRef(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [
    memberFilter,
    hofFilter,
    yearFilter,
    pagination.page,
    pagination.limit,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    updateURL();
  }, [
    pagination.page,
    pagination.limit,
    memberFilter,
    hofFilter,
    yearFilter,
    sortBy,
    sortOrder,
  ]);

  const fetchFilterOptions = async () => {
    // Only fetch filter options once
    if (hasInitializedFilters.current) return;
    hasInitializedFilters.current = true;

    try {
      const [hofsRes, yearsRes, membersRes] = await Promise.all([
        fetch("/api/hofs"),
        fetch("/api/years"),
        fetch("/api/users?limit=1000"),
      ]);

      if (hofsRes.ok) {
        const hofsData = await hofsRes.json();
        setAllHofs(hofsData);
      }

      if (yearsRes.ok) {
        const yearsData = await yearsRes.json();
        setAllYears(yearsData);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setAllMembers(membersData.users || []);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();

    if (pagination.page !== 1) {
      params.set("page", pagination.page.toString());
    }

    if (pagination.limit !== 20) {
      params.set("limit", pagination.limit.toString());
    }

    if (memberFilter !== "ALL") {
      params.set("member", memberFilter);
    }

    if (hofFilter !== "ALL") {
      params.set("hof", hofFilter);
    }

    if (yearFilter !== "ALL") {
      params.set("year", yearFilter);
    }

    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    const newUrl = params.toString()
      ? `?${params.toString()}`
      : "/admin/data-entry";
    router.replace(newUrl, { scroll: false });
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (memberFilter !== "ALL") {
        params.append("memberId", memberFilter);
      }

      if (hofFilter !== "ALL") {
        params.append("hofId", hofFilter);
      }

      if (yearFilter !== "ALL") {
        params.append("yearId", yearFilter);
      }

      // Add sort params
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/hof-entries?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching HOF entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/hof-entries/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchEntries();
        setDeleteId(null);
      } else {
        console.error("Failed to delete entry");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primary-400">Loading entries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-400">Data Entry</h1>
        <p className="text-gray-400 mt-1">
          Manage Hall of Fame member entries and statistics
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          <StatsCard
            icon={Database}
            value={formatNumber(
              entries.reduce(
                (sum: number, entry: HofEntry) => sum + entry.peaksInYear,
                0
              )
            )}
            label="Peaks in Year"
          />
          <StatsCard
            icon={Database}
            value={formatNumber(
              entries.reduce(
                (sum: number, entry: HofEntry) => sum + entry.totalPeaks,
                0
              )
            )}
            label="Total Peaks"
          />
          <StatsCard
            icon={Database}
            value={formatNumber(
              entries.reduce(
                (sum: number, entry: HofEntry) =>
                  sum + entry.foreignPeaksInYear,
                0
              )
            )}
            label="Foreign Peaks in Year"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start md:justify-end">
        <button
          onClick={() => {
            const currentParams = new URLSearchParams(window.location.search);
            router.push(
              `/admin/data-entry/new?returnTo=${encodeURIComponent(
                "/admin/data-entry?" + currentParams.toString()
              )}`
            );
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Entry</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Member Filter */}
            <SearchableSelect
              label="Member"
              value={memberFilter}
              onChange={(value) => {
                setMemberFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={[
                { id: "ALL", label: "All", subtitle: "" },
                ...allMembers.map((member) => ({
                  id: member.id,
                  label: member.displayName,
                  subtitle: "",
                })),
              ]}
              placeholder="All"
            />

            {/* HOF Filter */}
            <SearchableSelect
              label="Hall of Fame"
              value={hofFilter}
              onChange={(value) => {
                setHofFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={[
                { id: "ALL", label: "All", subtitle: "" },
                ...allHofs.map((hof) => ({
                  id: hof.id,
                  label: hof.title,
                  subtitle: "",
                })),
              ]}
              placeholder="All"
            />

            {/* Year Filter */}
            <SearchableSelect
              label="Year"
              value={yearFilter}
              onChange={(value) => {
                setYearFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={[
                { id: "ALL", label: "All", subtitle: "" },
                ...allYears.map((year) => ({
                  id: year.id,
                  label: year.title,
                  subtitle: "",
                })),
              ]}
              placeholder="All"
            />
          </div>

          {/* Info and Clear Button */}
          <div className="flex justify-between items-center gap-2 pt-2">
            <div className="text-xs text-gray-400">
              <span className="font-medium text-gray-300">
                {pagination.totalCount}
              </span>{" "}
              {pagination.totalCount === 1 ? "record" : "records"} •{" "}
              <span className="font-medium text-gray-300">
                {entries.length}
              </span>{" "}
              displayed
            </div>
            <button
              onClick={() => {
                setMemberFilter("ALL");
                setHofFilter("ALL");
                setYearFilter("ALL");
                setSortBy("member.displayName");
                setSortOrder("asc");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              disabled={
                memberFilter === "ALL" &&
                hofFilter === "ALL" &&
                yearFilter === "ALL"
              }
              className="text-xs text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">
              No entries yet
            </h2>
            <p className="text-gray-500">
              {memberFilter !== "ALL" ||
              hofFilter !== "ALL" ||
              yearFilter !== "ALL"
                ? "No entries match your filters. Try adjusting your selection."
                : "Add your first entry to start tracking Hall of Fame data."}
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
                      label="Member"
                      field="member.displayName"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="left"
                    />
                    <SortableTableHeader
                      label="HoF"
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
                      label="Peaks/Year"
                      field="peaksInYear"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="center"
                    />
                    <SortableTableHeader
                      label="Foreign/Year"
                      field="foreignPeaksInYear"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="center"
                    />
                    <SortableTableHeader
                      label="Total Peaks"
                      field="totalPeaks"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="center"
                    />
                    <SortableTableHeader
                      label="Foreign Total"
                      field="foreignPeaks"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="center"
                    />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: HofEntry) => (
                    <tr
                      key={entry.id}
                      onClick={() => {
                        const currentParams = new URLSearchParams(
                          window.location.search
                        );
                        router.push(
                          `/admin/data-entry/${
                            entry.id
                          }/edit?returnTo=${encodeURIComponent(
                            "/admin/data-entry?" + currentParams.toString()
                          )}`
                        );
                      }}
                      className="border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-white">
                          {entry.member.displayName}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-white">
                          {entry.hof.code}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-white">
                          {entry.year.code}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-white font-medium">
                          {entry.peaksInYear}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-white font-medium">
                          {entry.foreignPeaksInYear}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-white font-medium">
                          {entry.totalPeaks}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-white font-medium">
                          {entry.foreignPeaks}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {entries.map((entry: HofEntry) => (
              <div
                key={entry.id}
                onClick={() => {
                  const currentParams = new URLSearchParams(
                    window.location.search
                  );
                  router.push(
                    `/admin/data-entry/${
                      entry.id
                    }/edit?returnTo=${encodeURIComponent(
                      "/admin/data-entry?" + currentParams.toString()
                    )}`
                  );
                }}
                className="bg-dark-800 border border-dark-600 rounded-lg p-4 cursor-pointer hover:bg-dark-750 transition-colors"
              >
                {/* Member Info */}
                <div className="mb-3">
                  <h2 className="text-xl font-bold text-white">
                    {entry.member.displayName}
                  </h2>
                </div>

                {/* HoF and Year */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">HoF</p>
                    <p className="text-sm font-medium text-white">
                      {entry.hof.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Year</p>
                    <p className="text-sm font-medium text-white">
                      {entry.year.code}
                    </p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Peaks/Year</p>
                    <p className="text-lg font-bold text-white">
                      {formatNumber(entry.peaksInYear)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Foreign/Year</p>
                    <p className="text-lg font-bold text-white">
                      {formatNumber(entry.foreignPeaksInYear)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Peaks</p>
                    <p className="text-lg font-bold text-white">
                      {formatNumber(entry.totalPeaks)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Foreign Total</p>
                    <p className="text-lg font-bold text-white">
                      {formatNumber(entry.foreignPeaks)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            pageSize={pagination.limit}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            onPageSizeChange={(limit) =>
              setPagination((prev) => ({ ...prev, limit, page: 1 }))
            }
            itemName="entries"
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this entry? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-900/20 text-red-400 border border-red-700/30 hover:bg-red-900/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
