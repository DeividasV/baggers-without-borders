"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type MouseEvent } from "react";
import {
  Plus,
  Pencil,
  Heart,
  Paperclip,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  GitBranch,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/ui/Card";
import Button from "@/ui/Button";
import Badge from "@/ui/Badge";
import EmptyState from "@/ui/EmptyState";
import LoadingSpinner from "@/ui/LoadingSpinner";
import SearchInput from "@/ui/SearchInput";
import StatsCard from "@/ui/StatsCard";
import SortableTableHeader from "@/ui/SortableTableHeader";
import { Pagination } from "@/ui/Pagination";
import { formatNumber } from "@/src/lib/utils";
import { getBadgeVariant, getOptionLabel, formatMinutesToHoursMinutes } from "@/src/lib/utils";
import {
  getChangeRequestErrorMessage,
  requestChangeRequestJson,
} from "@/src/lib/changeRequestClient";
import { fetchWithTimeout } from "@/src/lib/fetchWithTimeout";
import {
  CHANGE_REQUEST_TYPES,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  SOURCE_OPTIONS,
} from "@/src/lib/constants";

type ChangeRequest = {
  id: string;
  ticketNumber?: string | null;
  ticketSlug?: string | null;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  plannedTime?: number | null;
  actualTime?: number | null;
  createdAt: string;
  createdBy: {
    id: string;
    displayName: string;
    username: string;
  };
  voteSummary?: {
    totalVotes: number;
    averageVote: number | null;
  };
  _count?: {
    attachments: number;
  };
  // Git sync fields
  commitHash?: string | null;
  commitDate?: string | null;
  version?: string | null;
  category?: string | null;
  isFromGit?: boolean;
};

interface SyncProgress {
  type: string;
  total?: number;
  batches?: number;
  batch?: number;
  processed?: number;
  commits?: string[];
  message?: string;
  error?: string;
  success?: boolean;
}

export default function ChangesManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false); // Background loading state
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams?.get?.("search") || "");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
    searchParams?.get?.("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState<string>(searchParams?.get?.("status") || "ALL");
  const [sourceFilter, setSourceFilter] = useState<string>(searchParams?.get?.("source") || "ALL");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const hasInitialized = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Stats state (for header stats)
  const [stats, setStats] = useState({
    completed: 0,
    active: 0,
    actualTime: 0,
    topLikedOpen: [] as Array<{
      id: string;
      routeId: string;
      ticketNumber?: string | null;
      title: string;
      likeCount: number;
      averageLike: number | null;
    }>,
  });

  // Git sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Debounce search input (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data when debounced search or filters change
  useEffect(() => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Initial load should show loading spinner, subsequent loads should show filtering overlay
    const isInitialLoad = !hasInitialized.current;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setFiltering(true);
    }

    fetchChangeRequests(!isInitialLoad);
    if (isInitialLoad) {
      hasInitialized.current = true;
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, pageSize, sortBy, sortOrder, debouncedSearchTerm, statusFilter, sourceFilter]);

  useEffect(() => {
    updateURL();
  }, [debouncedSearchTerm, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const updateURL = () => {
    const params = new URLSearchParams();

    if (debouncedSearchTerm.trim()) {
      params.set("search", debouncedSearchTerm.trim());
    }

    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }

    if (sourceFilter !== "ALL") {
      params.set("source", sourceFilter);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/changes";
    router.replace(newUrl, { scroll: false });
  };

  const fetchChangeRequests = async (isBackgroundFilter: boolean = false) => {
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (sourceFilter !== "ALL") params.set("source", sourceFilter);

      const data = await requestChangeRequestJson<{ data?: ChangeRequest[]; total?: number }>(
        `/api/change-requests?${params}`,
        {
          signal: abortControllerRef.current.signal,
        },
        {
          retryCount: 1,
          fallbackMessage: "Couldn't load change requests. Check your connection and try again.",
        }
      );

      setChangeRequests(data.data || []);
      setTotalCount(data.total || 0);
      setLoadError(null);
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error fetching change requests:", error);
      setLoadError(
        getChangeRequestErrorMessage(
          error,
          "Couldn't load change requests. Check your connection and try again."
        )
      );
    } finally {
      if (isBackgroundFilter) {
        setFiltering(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchStats = async () => {
    try {
      const data = await requestChangeRequestJson<{ data?: ChangeRequest[] }>(
        "/api/change-requests?limit=99999",
        {},
        {
          retryCount: 1,
          fallbackMessage:
            "Couldn't load the summary cards. The change request list is still available.",
        }
      );

      const allRequests = data.data || [];
      const topLikedOpen = allRequests.filter(
        (r: ChangeRequest) => r.status !== "COMPLETED" && r.status !== "REJECTED"
      );

      const likedOpen = topLikedOpen
        .filter((r: ChangeRequest) => (r.voteSummary?.totalVotes ?? 0) > 0)
        .sort((left: ChangeRequest, right: ChangeRequest) => {
          const likeDelta =
            (right.voteSummary?.totalVotes ?? 0) - (left.voteSummary?.totalVotes ?? 0);
          if (likeDelta !== 0) {
            return likeDelta;
          }

          const averageDelta =
            (right.voteSummary?.averageVote ?? 0) - (left.voteSummary?.averageVote ?? 0);
          if (averageDelta !== 0) {
            return averageDelta;
          }

          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        })
        .slice(0, 3);

      const fallbackOldestOpen = topLikedOpen
        .slice()
        .filter(
          (request: ChangeRequest) =>
            !likedOpen.some((liked: ChangeRequest) => liked.id === request.id)
        )
        .sort(
          (left: ChangeRequest, right: ChangeRequest) =>
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        )
        .slice(0, Math.max(0, 3 - likedOpen.length));

      const topLikedOrOldestOpen = [...likedOpen, ...fallbackOldestOpen].map(
        (request: ChangeRequest) => ({
          id: request.id,
          routeId: getRequestRouteId(request),
          ticketNumber: request.ticketNumber,
          title: request.title,
          likeCount: request.voteSummary?.totalVotes ?? 0,
          averageLike: request.voteSummary?.averageVote ?? null,
        })
      );

      setStats({
        completed: allRequests.filter((r: ChangeRequest) => r.status === "COMPLETED").length,
        active: allRequests.filter(
          (r: ChangeRequest) => r.status === "PENDING" || r.status === "IN_PROGRESS"
        ).length,
        actualTime: allRequests.reduce(
          (sum: number, r: ChangeRequest) => sum + (r.actualTime || 0),
          0
        ),
        topLikedOpen: topLikedOrOldestOpen,
      });
      setStatsError(null);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStatsError(
        getChangeRequestErrorMessage(
          error,
          "Couldn't load the summary cards. The change request list is still available."
        )
      );
    }
  };

  const retryFetchChangeRequests = () => {
    setLoading(true);
    setLoadError(null);
    fetchChangeRequests(false);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getRequestRouteId = (request: Pick<ChangeRequest, "id" | "ticketNumber" | "ticketSlug">) =>
    request.ticketSlug || request.ticketNumber || request.id;

  const getChangeListReturnTo = () => {
    const currentParams = searchParams?.toString() || "";
    return currentParams ? `/admin/changes?${currentParams}` : "/admin/changes";
  };

  const getChangeRequestHref = (
    request: Pick<ChangeRequest, "id" | "ticketNumber" | "ticketSlug">
  ) =>
    `/admin/changes/${getRequestRouteId(request)}?returnTo=${encodeURIComponent(
      getChangeListReturnTo()
    )}`;

  const formatDateYmd = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return date.toISOString().slice(0, 10);
  };

  const formatAverageVote = (value: number | null | undefined) => {
    if (value == null) {
      return "—";
    }

    return `${value.toFixed(1)}/5`;
  };

  const formatAverageVoteShort = (value: number | null | undefined) => {
    if (value == null) {
      return "—";
    }

    return value.toFixed(1);
  };

  const handleCopyTicket = async (e: MouseEvent, request: ChangeRequest) => {
    e.stopPropagation();
    const ticketValue = request.ticketNumber || request.id;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(ticketValue);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = ticketValue;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedTicketId(request.id);
      setTimeout(() => setCopiedTicketId(null), 2000);
    } catch (error) {
      console.error("Failed to copy ticket number:", error);
    }
  };

  // Pagination computed values
  const totalPages = Math.ceil(totalCount / pageSize);

  // Git sync function - pass maxCommits for testing (0 = no limit)
  const handleGitSync = async (maxCommits: number = 0) => {
    setIsSyncing(true);
    setShowSyncModal(true);
    setSyncProgress({ type: "starting" });

    try {
      const url =
        maxCommits > 0
          ? `/api/change-requests/sync-git?maxCommits=${maxCommits}`
          : "/api/change-requests/sync-git";
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
        },
        15000
      );

      if (!response.ok) {
        const errorData = await response.json();
        setSyncProgress({
          type: "error",
          error:
            errorData.error ||
            "Couldn't start Git sync. Try again, and check whether the sync service is available.",
        });
        setIsSyncing(false);
        return;
      }

      // Check if response is JSON (no new commits) or SSE stream
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        setSyncProgress({
          type: "no_changes",
          message: data.message || "No new commits to sync",
          processed: 0,
        });
        setIsSyncing(false);
        return;
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setSyncProgress({
          type: "error",
          error: "Git sync started, but no progress updates were available. Try again.",
        });
        setIsSyncing(false);
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              setSyncProgress(data);

              if (data.type === "complete" || data.type === "error") {
                setIsSyncing(false);
                // Refresh the list after sync
                if (data.type === "complete") {
                  fetchChangeRequests();
                  fetchStats();
                }
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
      setSyncProgress({
        type: "error",
        error: getChangeRequestErrorMessage(
          error,
          "Couldn't complete Git sync. Try again in a moment."
        ),
      });
      setIsSyncing(false);
    }
  };

  if (loading && !loadError) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-primary-400 mt-4">Loading change requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-400">Change Requests</h1>
        <p className="text-gray-400 mt-1">Review and manage change requests</p>
      </div>

      {loadError && changeRequests.length === 0 ? (
        <div className="card border border-red-500/30 bg-red-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Unable to load change requests</h2>
              <p className="mt-2 max-w-2xl text-sm text-red-100/85">{loadError}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={retryFetchChangeRequests}>
                Try again
              </Button>
              <Button variant="secondary" size="sm" onClick={() => fetchStats()}>
                Retry summary cards
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {loadError && changeRequests.length > 0 ? (
        <div
          className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 px-4 py-3 text-sm text-yellow-100"
          role="alert"
        >
          {loadError}
        </div>
      ) : null}

      {/* Stats & Actions */}
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-6 items-stretch">
          <div className="xl:col-span-2 p-4 sm:p-5">
            <div className="space-y-3">
              {stats.topLikedOpen.length > 0 ? (
                stats.topLikedOpen.map((request, index) => (
                  <Link
                    key={request.id}
                    href={`/admin/changes/${request.routeId}?returnTo=${encodeURIComponent(
                      getChangeListReturnTo()
                    )}`}
                    aria-label={`Open change request ranked ${index + 1}: ${request.title}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-dark-700/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-300 truncate">
                        <span className="mr-2">#{index + 1}</span>
                        {request.title}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm text-gray-300 whitespace-nowrap">
                      {request.likeCount} likes, {formatAverageVoteShort(request.averageLike)}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-sm text-gray-500">No open change requests yet.</div>
              )}
            </div>
          </div>
          <StatsCard icon={CheckCircle2} value={formatNumber(stats.completed)} label="Completed" />
          <StatsCard icon={AlertCircle} value={formatNumber(stats.active)} label="Active" />
          <StatsCard
            icon={Clock}
            value={formatMinutesToHoursMinutes(stats.actualTime)}
            label="Actual"
          />
        </div>
        {statsError ? (
          <div
            className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-900/10 px-4 py-3 text-sm text-yellow-100"
            role="status"
          >
            {statsError}
          </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start md:justify-end gap-3">
        <button
          onClick={() => handleGitSync(10)}
          disabled={isSyncing}
          className="btn-secondary flex items-center space-x-2"
          title="Sync up to 10 commits from Git (for testing)"
        >
          <GitBranch className={`h-5 w-5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Sync from Git"}</span>
        </button>
        <button
          onClick={() => router.push("/admin/changes/new")}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create change request</span>
        </button>
      </div>

      {/* Git Sync Progress Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary-400" />
                Syncing Git History
              </h2>
              {!isSyncing && (
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {syncProgress?.type === "error" ? (
              <div className="text-center py-4">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-400">{syncProgress.error}</p>
              </div>
            ) : syncProgress?.type === "no_changes" ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-primary-400 mx-auto mb-3" />
                <p className="text-primary-400 font-medium">Everything is synced</p>
                <p className="text-gray-400 text-sm mt-2">{syncProgress.message}</p>
              </div>
            ) : syncProgress?.type === "complete" ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-400">{syncProgress.message}</p>
                <p className="text-gray-400 text-sm mt-2">
                  {syncProgress.processed} commits processed
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Progress Bar */}
                {syncProgress?.total && syncProgress?.processed !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>
                        Batch {syncProgress.batch || 1} of {syncProgress.batches || 1}
                      </span>
                      <span>
                        {Math.round((syncProgress.processed / syncProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-dark-600 rounded-full h-3">
                      <div
                        className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${(syncProgress.processed / syncProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {syncProgress.processed} of {syncProgress.total} commits processed
                    </p>
                  </div>
                )}

                {/* Current Commits */}
                {syncProgress?.commits && syncProgress.commits.length > 0 && (
                  <div className="bg-dark-700 rounded p-3 max-h-32 overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-2">Processing:</p>
                    {syncProgress.commits.map((commit, i) => (
                      <p key={i} className="text-xs text-gray-300 truncate">
                        • {commit}...
                      </p>
                    ))}
                  </div>
                )}

                {/* Loading State */}
                {syncProgress?.type === "starting" && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-8 w-8 text-primary-400 animate-spin" />
                    <span className="ml-3 text-gray-400">Starting sync...</span>
                  </div>
                )}
              </div>
            )}

            {!isSyncing && (
              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowSyncModal(false)} className="btn-secondary">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card relative">
        {/* Filtering Overlay */}
        {filtering && (
          <div className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="flex items-center gap-3 text-primary-400">
              <LoadingSpinner size="sm" />
              <span className="text-sm font-medium">Filtering...</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <SearchInput
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              placeholder="Search by ticket number, title, description, or creator..."
              disabled={filtering}
            />

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={filtering}
                className="input-field pl-10 w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="relative">
              <GitBranch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={filtering}
                className="input-field pl-10 w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info and Clear Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
            <div className="text-xs text-gray-400">
              {filtering ? (
                <span className="text-primary-400">Searching...</span>
              ) : (
                <>
                  <span className="font-medium text-gray-300">{totalCount}</span>{" "}
                  {totalCount === 1 ? "result" : "results"}
                  {totalCount > pageSize && (
                    <>
                      {" "}
                      • Page {currentPage} of {totalPages}
                    </>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setDebouncedSearchTerm("");
                setStatusFilter("ALL");
                setSourceFilter("ALL");
                setCurrentPage(1);
              }}
              disabled={
                filtering || (!searchTerm && statusFilter === "ALL" && sourceFilter === "ALL")
              }
              className="text-xs text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Change Requests List */}
      {changeRequests.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Pencil className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">No change requests yet</h2>
            <p className="text-gray-500 text-sm sm:text-base">
              {debouncedSearchTerm || statusFilter !== "ALL" || sourceFilter !== "ALL"
                ? "No change requests match your filters. Clear filters or change your search and try again."
                : "Create your first change request to get started."}
            </p>
            {(debouncedSearchTerm || statusFilter !== "ALL" || sourceFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearchTerm("");
                  setStatusFilter("ALL");
                  setSourceFilter("ALL");
                  setCurrentPage(1);
                }}
                className="btn-secondary mt-4"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block card">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[54%]" />
                <col className="w-[28%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-dark-600">
                  <SortableTableHeader
                    label="Ticket & Likes"
                    field="createdAt"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    align="left"
                  />
                  <SortableTableHeader
                    label="Subject"
                    field="title"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    align="left"
                  />
                  <SortableTableHeader
                    label="Type & Priority"
                    field="type"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    align="left"
                  />
                </tr>
              </thead>
              <tbody>
                {changeRequests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => {
                      router.push(getChangeRequestHref(request));
                    }}
                    className="border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer"
                  >
                    {/* Column 1: Likes, Ticket, Date */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-3">
                        <div className="text-sm text-gray-300">
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3 w-3 fill-current" />
                            {request.voteSummary?.totalVotes ?? 0} likes,{" "}
                            {formatAverageVote(request.voteSummary?.averageVote)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-primary-300 font-mono">
                            {request.ticketNumber || request.id}
                          </span>
                          <button
                            type="button"
                            aria-label={`Copy ticket number ${request.ticketNumber || request.id}`}
                            onClick={(e) => handleCopyTicket(e, request)}
                            className="text-gray-500 hover:text-primary-300 transition-colors"
                          >
                            {copiedTicketId === request.id ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateYmd(request.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Column 2: Subject, Description, Creator */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-3">
                        {/* Row 1: Subject */}
                        <div className="flex items-center gap-2">
                          {request.isFromGit && (
                            <GitBranch className="h-4 w-4 text-primary-400 shrink-0" />
                          )}
                          <span className="font-medium text-white truncate">{request.title}</span>
                        </div>
                        {/* Row 2: Description */}
                        <span className="text-sm text-gray-400 line-clamp-1">
                          {request.description}
                        </span>
                        {/* Row 3: Creator Name */}
                        <span className="text-sm text-gray-400 line-clamp-1">
                          {request.createdBy.displayName}
                        </span>
                      </div>
                    </td>

                    {/* Column 3: Type, Priority, and Status */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-2">
                        {/* Row 1: Type */}
                        <Badge
                          variant={getBadgeVariant(request.type, "type")}
                          className="text-xs w-full justify-start"
                        >
                          {getOptionLabel(request.type, CHANGE_REQUEST_TYPES)}
                        </Badge>
                        {/* Row 2: Priority */}
                        <Badge
                          variant={getBadgeVariant(request.priority, "priority")}
                          className="text-xs w-full justify-start"
                        >
                          {getOptionLabel(request.priority, PRIORITY_OPTIONS)}
                        </Badge>
                        {/* Row 3: Status */}
                        <Badge
                          variant={getBadgeVariant(request.status, "status")}
                          className="text-xs w-full justify-start"
                        >
                          {getOptionLabel(request.status, STATUS_OPTIONS)}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {changeRequests.map((request) => (
              <div
                key={request.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  router.push(getChangeRequestHref(request));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(getChangeRequestHref(request));
                  }
                }}
                className="bg-dark-800 border border-dark-600 rounded-lg p-4 cursor-pointer hover:bg-dark-750 transition-colors"
              >
                {/* Header with Priority and Status Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {request.isFromGit && (
                    <Badge variant="default">
                      <GitBranch className="h-3 w-3 mr-1" />
                      Git
                    </Badge>
                  )}
                  <Badge variant={getBadgeVariant(request.priority, "priority")}>
                    {getOptionLabel(request.priority, PRIORITY_OPTIONS)}
                  </Badge>
                  <Badge variant={getBadgeVariant(request.status, "status")}>
                    {getOptionLabel(request.status, STATUS_OPTIONS)}
                  </Badge>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-2">{request.title}</h2>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{request.description}</p>

                {/* Footer with Date, Creator, Type */}
                <div className="flex flex-col gap-2 text-xs pt-3 border-t border-dark-600">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="mt-2 text-sm text-gray-300">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-current" />
                          {request.voteSummary?.totalVotes ?? 0} likes,{" "}
                          {formatAverageVote(request.voteSummary?.averageVote)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-primary-300 font-mono">
                          {request.ticketNumber || request.id}
                        </span>
                        <button
                          type="button"
                          aria-label={`Copy ticket number ${request.ticketNumber || request.id}`}
                          onClick={(e) => handleCopyTicket(e, request)}
                          className="text-gray-500 hover:text-primary-300 transition-colors"
                        >
                          {copiedTicketId === request.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="mt-2 text-xs text-gray-500">
                        {formatDateYmd(request.createdAt)}
                      </span>
                    </div>
                    {(request._count?.attachments ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Paperclip className="h-3 w-3" />
                        <span>{request._count?.attachments}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-white">{request.createdBy.displayName}</span>
                    </div>
                    <Badge
                      variant={getBadgeVariant(request.type, "type")}
                      className="text-xs w-full justify-center"
                    >
                      {getOptionLabel(request.type, CHANGE_REQUEST_TYPES)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            itemName="changes"
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </>
      )}
    </div>
  );
}
