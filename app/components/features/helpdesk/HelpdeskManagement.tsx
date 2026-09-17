"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Inbox, Calendar, User, Paperclip, Sparkles } from "lucide-react";
import {
  LoadingSpinner,
  Pagination,
  StatsCard,
  Input,
  SearchableSelect,
  EmptyState,
} from "@/app/components/ui";
import { formatDateShort } from "@/src/lib/utils";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_STATUSES,
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
} from "@/src/lib/support-request-constants";
import {
  isNewTicket,
  isUserTicket,
  getMostRecentTicketDate,
  normalizeMessageText,
} from "@/src/utils/support-request-helpers";
import type { SupportRequest } from "@/src/types/support-request";

/**
 * Filter state for ticket list management
 * @interface FilterState
 */
type FilterState = {
  /** Search query (searches name, email, subject, message) */
  search: string;
  /** Category filter (empty = all categories) */
  category: string;
  /** Status filter (empty = all statuses) */
  status: string;
  /** Current page number (1-indexed) */
  page: number;
};

/**
 * Admin helpdesk management interface with ticket list, filtering, and stats.
 *
 * Features:
 * - Real-time search with 300ms debounce
 * - Multi-filter support (status, category, search query)
 * - Pagination (20 tickets per page)
 * - Stats cards (user tickets, open tickets, total count)
 * - Badge indicators for new tickets, user-submitted tickets, recent activity
 * - Sort by most recent activity
 * - Empty state with helpful message
 *
 * @component
 *
 * @example
 * ```tsx
 * <HelpdeskManagement />
 * ```
 *
 * @accessibility
 * - Debounced search prevents excessive API calls
 * - Loading states with spinners
 * - Empty state with meaningful context
 *
 * @see {@link docs/HELPDESK_SYSTEM.md} for architecture details
 */
export default function HelpdeskManagement() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [userTicketsCount, setUserTicketsCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [searchDebounceTimer, setSearchDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    status: "OPEN",
    page: 1,
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", filters.page.toString());
      params.set("limit", "20");

      if (filters.search) params.set("search", filters.search);
      if (filters.category) params.set("category", filters.category);
      if (filters.status) params.set("status", filters.status);

      const response = await fetch(`/api/support-requests?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to fetch tickets");
      }

      const result = await response.json();
      setTickets(result.data);
      setTotal(result.total);
      setPages(result.pages);

      // Count user's own tickets
      if (session?.user?.email) {
        const userCount = result.data.filter(
          (t: SupportRequest) =>
            t.email.toLowerCase() === session.user.email!.toLowerCase(),
        ).length;
        setUserTicketsCount(userCount);
      }

      // Count open tickets (OPEN or IN_PROGRESS)
      const openCount = result.data.filter(
        (t: SupportRequest) =>
          t.status === "OPEN" || t.status === "IN_PROGRESS",
      ).length;
      setOpenTicketsCount(openCount);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, session?.user?.email]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearchChange = (value: string) => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 500);

    setSearchDebounceTimer(timer);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleTicketClick = (ticketId: string) => {
    router.push(`/admin/helpdesk/${ticketId}`);
  };

  // Get most recent ticket date
  const mostRecentDate = getMostRecentTicketDate(tickets);

  // Memoize enhanced ticket data to avoid recomputing on every render
  const enhancedTickets = useMemo(() => {
    return tickets.map((ticket) => ({
      ...ticket,
      // Pre-compute expensive operations
      displayMessage: normalizeMessageText(ticket.message),
      isNew: isNewTicket(ticket.createdAt),
      isOwn: isUserTicket(ticket, session?.user?.email),
      categoryLabel: getCategoryLabel(ticket.category),
      statusLabel: getStatusLabel(ticket.status),
      statusColor: getStatusColor(ticket.status),
    }));
  }, [tickets, session?.user?.email]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Helpdesk</h1>
        <p className="text-gray-400">
          Manage and track helpdesk tickets from users
        </p>
      </div>

      {/* Stats Cards */}
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            icon={Inbox}
            value={openTicketsCount}
            label="Open Tickets"
          />
          <StatsCard
            icon={User}
            value={userTicketsCount}
            label="Assigned to You"
          />
          <StatsCard
            icon={Calendar}
            value={mostRecentDate ? formatDateShort(mostRecentDate) : "—"}
            label="Last Ticket"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label
              htmlFor="helpdesk-search"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Search Tickets
            </label>
            <Input
              id="helpdesk-search"
              placeholder="Search by name, email, or subject"
              defaultValue={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search tickets by name, email, or subject"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label
              htmlFor="helpdesk-category"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Category
            </label>
            <SearchableSelect
              id="helpdesk-category"
              options={SUPPORT_CATEGORIES as any}
              value={filters.category}
              onChange={(value) => handleFilterChange("category", value)}
              placeholder="All categories"
              aria-label="Filter tickets by category"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="helpdesk-status"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Status
            </label>
            <SearchableSelect
              id="helpdesk-status"
              options={SUPPORT_STATUSES as any}
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              placeholder="All statuses"
              aria-label="Filter tickets by status"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div
            className="flex justify-center py-12"
            role="status"
            aria-live="polite"
            aria-label="Loading tickets"
          >
            <LoadingSpinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No tickets found"
            description="No tickets match your current filters. Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                      Date / Category
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                      Subject
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                      From
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enhancedTickets.map((ticket, index) => (
                    <tr
                      key={ticket.id}
                      onClick={() => handleTicketClick(ticket.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleTicketClick(ticket.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ticket: ${ticket.subject} from ${ticket.name}`}
                      className={`border-b border-dark-600 cursor-pointer hover:bg-dark-700/50 focus:ring-2 focus:ring-primary-500 focus:ring-inset focus:outline-none transition-colors ${
                        index % 2 === 0 ? "bg-dark-800/30" : "bg-dark-900/30"
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {formatDateShort(ticket.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {ticket.categoryLabel}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-sm ${ticket.statusColor}`}>
                          {ticket.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white truncate max-w-xs">
                            {ticket.subject}
                          </span>
                          {ticket.attachments.length > 0 && (
                            <Paperclip
                              className="h-3.5 w-3.5 text-gray-400"
                              aria-label="Has attachments"
                            />
                          )}
                          {ticket.isNew && (
                            <span className="flex items-center gap-1 text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50 whitespace-nowrap">
                              <Sparkles
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                              New
                            </span>
                          )}
                          {ticket.isOwn && (
                            <span
                              className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50 whitespace-nowrap"
                              aria-label="This is your ticket"
                            >
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {ticket.displayMessage}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-300">
                          {ticket.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.email}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {enhancedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleTicketClick(ticket.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ticket: ${ticket.subject} from ${ticket.name}`}
                  className="card bg-dark-800/50 border border-dark-600 p-5 cursor-pointer hover:border-primary-500/50 focus:ring-2 focus:ring-primary-500 focus:ring-inset focus:outline-none transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                          {ticket.subject}
                        </h2>
                        {ticket.attachments.length > 0 && (
                          <Paperclip
                            className="h-3.5 w-3.5 text-gray-400"
                            aria-label="Has attachments"
                          />
                        )}
                        {ticket.isNew && (
                          <span className="flex items-center gap-1 text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50">
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                            New
                          </span>
                        )}
                        {ticket.isOwn && (
                          <span
                            className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50"
                            aria-label="This is your ticket"
                          >
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 sm:line-clamp-1">
                        {ticket.displayMessage}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User
                        className="h-3.5 w-3.5 text-gray-600"
                        aria-hidden="true"
                      />
                      <span className="truncate">{ticket.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        className="h-3.5 w-3.5 text-gray-600"
                        aria-hidden="true"
                      />
                      <span>{formatDateShort(ticket.createdAt)}</span>
                    </div>
                    <div className="truncate">{ticket.categoryLabel}</div>
                    <div className="text-right">
                      <span className={ticket.statusColor}>
                        {ticket.statusLabel}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={filters.page}
                  totalPages={pages}
                  totalCount={total}
                  pageSize={20}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
