"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogsTable, LogsStats, LogFilters } from ".";
import { Pagination } from "@/components/ui";

export interface AuditLog {
  id: string;
  eventType: string;
  eventCategory: string;
  status: string;
  userId: string | null;
  sessionId: string | null;
  ipAddressHash: string;
  ipCountry: string | null;
  userAgent: string | null;
  resourceType: string | null;
  resourceId: string | null;
  actionDetails: string | null;
  errorMessage: string | null;
  retentionDate: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  } | null;
}

export interface LogsStats {
  total: number;
  failed: number;
  uniqueUsers: number;
  topCountries: Array<{ code: string | null; name: string; count: number }>;
}

export interface LogsFilters {
  eventType: string;
  userId: string;
  status: string;
  ipCountry: string;
  dateFrom: string;
  dateTo: string;
}

export default function LogsManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<LogsStats>({
    total: 0,
    failed: 0,
    uniqueUsers: 0,
    topCountries: [],
  });
  const [users, setUsers] = useState<
    Array<{ id: string; displayName: string }>
  >([]);
  const [countries, setCountries] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 100;

  // Filters - initialize from URL params
  const [filters, setFilters] = useState<LogsFilters>({
    eventType: searchParams.get("eventType") || "",
    userId: searchParams.get("userId") || "",
    status: searchParams.get("status") || "",
    ipCountry: searchParams.get("ipCountry") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  });

  // Sorting - initialize from URL params
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  );

  // Privacy notice dismissed state
  const [privacyNoticeDismissed, setPrivacyNoticeDismissed] = useState(false);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");

      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      // Add filters
      if (filters.eventType) params.append("eventType", filters.eventType);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.status) params.append("status", filters.status);
      if (filters.ipCountry) params.append("ipCountry", filters.ipCountry);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      const response = await fetch(`/api/admin/logs?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();

      setLogs(data.data);
      setStats(data.stats);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);

      // Set users from API response (only on first load)
      if (data.users && users.length === 0) {
        setUsers(data.users);
      }

      // Set countries from API response (only on first load)
      if (data.countries && countries.length === 0) {
        setCountries(data.countries);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs on mount and when filters/page/sort change
  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters, sortBy, sortOrder]);

  // Helper to update URL with current filters and sorting
  const updateURL = (
    newFilters: LogsFilters,
    page: number,
    sort?: { sortBy: string; sortOrder: "asc" | "desc" }
  ) => {
    const params = new URLSearchParams();

    if (page > 1) params.set("page", page.toString());
    if (newFilters.eventType) params.set("eventType", newFilters.eventType);
    if (newFilters.userId) params.set("userId", newFilters.userId);
    if (newFilters.status) params.set("status", newFilters.status);
    if (newFilters.ipCountry) params.set("ipCountry", newFilters.ipCountry);
    if (newFilters.dateFrom) params.set("dateFrom", newFilters.dateFrom);
    if (newFilters.dateTo) params.set("dateTo", newFilters.dateTo);

    const currentSortBy = sort?.sortBy || sortBy;
    const currentSortOrder = sort?.sortOrder || sortOrder;
    if (currentSortBy !== "createdAt") params.set("sortBy", currentSortBy);
    if (currentSortOrder !== "desc") params.set("sortOrder", currentSortOrder);

    const queryString = params.toString();
    router.push(queryString ? `/admin/logs?${queryString}` : "/admin/logs", {
      scroll: false,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(filters, page);
  };

  const handleFiltersChange = (newFilters: Partial<LogsFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1); // Reset to first page when filters change
    updateURL(updatedFilters, 1);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      eventType: "",
      userId: "",
      status: "",
      ipCountry: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    updateURL(clearedFilters, 1);
  };

  const handleSort = (field: string) => {
    const newSortOrder =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
    updateURL(filters, 1, { sortBy: field, sortOrder: newSortOrder });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      {!privacyNoticeDismissed && (
        <div className="bg-dark-700 border-l-4 border-primary-500 p-4 rounded">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-primary-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-dark-50">
                  Audit Log Privacy & Security Information
                </h3>
                <div className="mt-2 text-sm text-dark-200">
                  <p className="font-medium text-dark-100">
                    Privacy and security are paramount. This audit log is
                    designed with GDPR compliance and data protection best
                    practices at its core.
                  </p>
                  <p className="mt-3">
                    Security events are recorded for monitoring, compliance, and
                    account protection. The system collects only the minimum
                    necessary data:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      <strong>Hashed IP addresses</strong> — Irreversibly hashed
                      using SHA-256 before storage. Raw IP addresses are never
                      stored, ensuring real IPs cannot be recovered.
                    </li>
                    <li>
                      <strong>Country codes</strong> — Derived from Cloudflare
                      headers (ISO 3166-1 Alpha-2) for security monitoring, not
                      precise location tracking.
                    </li>
                    <li>
                      <strong>Browser and OS information</strong> — Basic
                      technical details for security analysis only. No device
                      fingerprinting or tracking.
                    </li>
                    <li>
                      <strong>Event types, timestamps, and user actions</strong>{" "}
                      — Essential for audit trails and security incident
                      detection.
                    </li>
                  </ul>
                  <p className="mt-3">
                    <strong>GDPR Compliance & Data Retention:</strong>{" "}
                    Authentication events are automatically deleted after 90
                    days, administrative actions after 2 years. All data is
                    permanently removed when retention periods expire. Access or
                    deletion requests can be made by contacting an
                    administrator.
                  </p>
                  <p className="mt-2 text-primary-400 font-medium">
                    The system is built to professional security standards,
                    ensuring transparency, accountability, and privacy
                    protection.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setPrivacyNoticeDismissed(true)}
              className="text-dark-400 hover:text-dark-200 transition-colors"
              aria-label="Dismiss notice"
            >
              <svg
                className="h-5 w-5"
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
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <LogsStats stats={stats} />

      {/* Filters */}
      <LogFilters
        filters={filters}
        users={users}
        countries={countries}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
        </div>
      )}

      {/* Logs Table */}
      {!loading && !error && (
        <>
          <LogsTable
            logs={logs}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={limit}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-dark-400 text-center">
            Showing {logs.length} of {totalCount} total logs
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !error && logs.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-dark-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-dark-200">
            No logs found
          </h3>
          <p className="mt-1 text-sm text-dark-400">
            {Object.values(filters).some((v) =>
              Array.isArray(v) ? v.length > 0 : v
            )
              ? "Try adjusting your filters"
              : "Audit logs will appear here as events occur"}
          </p>
        </div>
      )}
    </div>
  );
}
