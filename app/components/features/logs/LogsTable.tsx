"use client";

import React, { useState } from "react";
import { AuditLog } from "./LogsManagement";
import Link from "next/link";
import SortableTableHeader from "@/ui/SortableTableHeader";

interface LogsTableProps {
  logs: AuditLog[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}

export default function LogsTable({
  logs,
  sortBy,
  sortOrder,
  onSort,
}: LogsTableProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Event category colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "AUTH":
        return "bg-blue-500/20 text-blue-300";
      case "ADMIN":
        return "bg-purple-500/20 text-purple-300";
      case "USER":
        return "bg-green-500/20 text-green-300";
      default:
        return "bg-dark-600 text-dark-300";
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    if (status === "SUCCESS") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-green-500/20 text-green-300">
          Success
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded bg-red-500/20 text-red-300">
        Failure
      </span>
    );
  };

  // Country flag emoji
  const getFlagEmoji = (countryCode: string | null): string => {
    if (!countryCode || countryCode === "XX") return "🌐";
    if (countryCode === "T1") return "🧅"; // Tor

    try {
      const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return "🌐";
    }
  };

  // Format event type for display
  const formatEventType = (type: string): string => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Toggle expanded details
  const toggleExpanded = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  // Parse action details JSON
  const parseActionDetails = (details: string | null): any => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  return (
    <div className="card bg-dark-800 border border-dark-600 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-700 border-b border-dark-600">
            <tr>
              <SortableTableHeader
                label="Timestamp"
                field="createdAt"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
              <SortableTableHeader
                label="User"
                field="userId"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
              <SortableTableHeader
                label="Event"
                field="eventType"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
              <SortableTableHeader
                label="Status"
                field="status"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
              <SortableTableHeader
                label="Country"
                field="ipCountry"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {logs.map((log) => (
              <React.Fragment key={log.id}>
                <tr className="hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-200">
                    {formatTimestamp(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.user ? (
                      <Link
                        href={`/admin/members/${log.user.id}`}
                        className="text-primary-400 hover:text-primary-300 hover:underline"
                      >
                        {log.user.displayName}
                      </Link>
                    ) : (
                      <span className="text-dark-500">Anonymous</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(
                        log.eventCategory
                      )}`}
                    >
                      {formatEventType(log.eventType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span title={log.ipCountry || "Unknown"}>
                      {getFlagEmoji(log.ipCountry)} {log.ipCountry || "XX"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => toggleExpanded(log.id)}
                      className="text-primary-400 hover:text-primary-300 hover:underline"
                    >
                      {expandedLogId === log.id ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
                {expandedLogId === log.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-dark-900">
                      <div className="space-y-3 text-sm">
                        {/* Log ID */}
                        <div className="pb-2 border-b border-dark-700">
                          <span className="text-dark-400 font-medium">
                            Log ID:
                          </span>
                          <span className="ml-2 text-dark-200 font-mono text-xs">
                            {log.id}
                          </span>
                        </div>

                        {/* Primary Information Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-dark-400">Event Type:</span>
                            <span className="ml-2 text-dark-200">
                              {formatEventType(log.eventType)}
                            </span>
                          </div>
                          <div>
                            <span className="text-dark-400">
                              Event Category:
                            </span>
                            <span className="ml-2 text-dark-200">
                              {log.eventCategory}
                            </span>
                          </div>
                          <div>
                            <span className="text-dark-400">Status:</span>
                            <span className="ml-2">
                              {getStatusBadge(log.status)}
                            </span>
                          </div>
                          <div>
                            <span className="text-dark-400">Timestamp:</span>
                            <span className="ml-2 text-dark-200">
                              {formatTimestamp(log.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Network Information */}
                        <div className="pt-2 border-t border-dark-700">
                          <h4 className="text-dark-300 font-medium mb-2">
                            Network Information
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-dark-400">
                                IP Hash (Full):
                              </span>
                              <div className="mt-1 text-dark-200 font-mono text-xs break-all">
                                {log.ipAddressHash}
                              </div>
                            </div>
                            <div>
                              <span className="text-dark-400">Country:</span>
                              <span className="ml-2 text-dark-200">
                                {getFlagEmoji(log.ipCountry)}{" "}
                                {log.ipCountry || "Unknown"}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-dark-400">User Agent:</span>
                            <div className="mt-1 text-dark-200 text-xs break-all">
                              {log.userAgent || "N/A"}
                            </div>
                          </div>
                        </div>

                        {/* Resource Information */}
                        {(log.resourceType || log.resourceId) && (
                          <div className="pt-2 border-t border-dark-700">
                            <h4 className="text-dark-300 font-medium mb-2">
                              Resource Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              {log.resourceType && (
                                <div>
                                  <span className="text-dark-400">
                                    Resource Type:
                                  </span>
                                  <span className="ml-2 text-dark-200">
                                    {log.resourceType}
                                  </span>
                                </div>
                              )}
                              {log.resourceId && (
                                <div>
                                  <span className="text-dark-400">
                                    Resource ID:
                                  </span>
                                  <span className="ml-2 text-dark-200 font-mono text-xs">
                                    {log.resourceId}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Error Information */}
                        {log.errorMessage && (
                          <div className="pt-2 border-t border-dark-700">
                            <h4 className="text-red-400 font-medium mb-2">
                              Error Information
                            </h4>
                            <div className="text-red-300 text-xs">
                              {log.errorMessage}
                            </div>
                          </div>
                        )}

                        {/* Action Details */}
                        {log.actionDetails && (
                          <div className="pt-2 border-t border-dark-700">
                            <h4 className="text-dark-300 font-medium mb-2">
                              Action Details
                            </h4>
                            <pre className="p-3 bg-dark-800 rounded text-xs text-dark-200 overflow-x-auto">
                              {JSON.stringify(
                                parseActionDetails(log.actionDetails),
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 p-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-dark-700 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${getCategoryColor(
                    log.eventCategory
                  )}`}
                >
                  {formatEventType(log.eventType)}
                </span>
                <p className="mt-1 text-xs text-dark-400">
                  {formatTimestamp(log.createdAt)}
                </p>
              </div>
              {getStatusBadge(log.status)}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-dark-400">User:</span>
                {log.user ? (
                  <Link
                    href={`/admin/members/${log.user.id}`}
                    className="text-primary-400 hover:text-primary-300"
                  >
                    {log.user.displayName}
                  </Link>
                ) : (
                  <span className="text-dark-500">Anonymous</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-dark-400">Country:</span>
                <span>
                  {getFlagEmoji(log.ipCountry)} {log.ipCountry || "XX"}
                </span>
              </div>
            </div>

            <button
              onClick={() => toggleExpanded(log.id)}
              className="w-full text-center text-sm text-primary-400 hover:text-primary-300 py-2 border-t border-dark-600"
            >
              {expandedLogId === log.id ? "Hide Details" : "Show Details"}
            </button>

            {expandedLogId === log.id && (
              <div className="space-y-3 text-sm pt-3 border-t border-dark-600">
                {/* Log ID */}
                <div className="pb-2 border-b border-dark-600">
                  <span className="text-dark-400 font-medium">Log ID:</span>
                  <div className="text-dark-200 font-mono text-xs mt-1 break-all">
                    {log.id}
                  </div>
                </div>

                {/* Primary Information */}
                <div>
                  <span className="text-dark-400 font-medium">
                    Event Details
                  </span>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-dark-400">Type:</span>
                      <span className="ml-2 text-dark-200">
                        {formatEventType(log.eventType)}
                      </span>
                    </div>
                    <div>
                      <span className="text-dark-400">Category:</span>
                      <span className="ml-2 text-dark-200">
                        {log.eventCategory}
                      </span>
                    </div>
                    <div>
                      <span className="text-dark-400">Timestamp:</span>
                      <div className="text-dark-200 text-xs mt-1">
                        {formatTimestamp(log.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network Information */}
                <div className="pt-2 border-t border-dark-600">
                  <span className="text-dark-400 font-medium">
                    Network Information
                  </span>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-dark-400">IP Hash:</span>
                      <div className="text-dark-200 font-mono text-xs mt-1 break-all">
                        {log.ipAddressHash}
                      </div>
                    </div>
                    <div>
                      <span className="text-dark-400">User Agent:</span>
                      <div className="text-dark-200 text-xs mt-1 break-all">
                        {log.userAgent || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resource Information */}
                {(log.resourceType || log.resourceId) && (
                  <div className="pt-2 border-t border-dark-600">
                    <span className="text-dark-400 font-medium">
                      Resource Information
                    </span>
                    <div className="mt-2 space-y-2">
                      {log.resourceType && (
                        <div>
                          <span className="text-dark-400">Type:</span>
                          <span className="ml-2 text-dark-200">
                            {log.resourceType}
                          </span>
                        </div>
                      )}
                      {log.resourceId && (
                        <div>
                          <span className="text-dark-400">ID:</span>
                          <div className="text-dark-200 font-mono text-xs mt-1 break-all">
                            {log.resourceId}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Information */}
                {log.errorMessage && (
                  <div className="pt-2 border-t border-dark-600">
                    <span className="text-red-400 font-medium">Error</span>
                    <div className="text-red-300 text-xs mt-1">
                      {log.errorMessage}
                    </div>
                  </div>
                )}

                {/* Action Details */}
                {log.actionDetails && (
                  <div className="pt-2 border-t border-dark-600">
                    <span className="text-dark-400 font-medium">
                      Action Details
                    </span>
                    <pre className="mt-2 p-2 bg-dark-800 rounded text-xs text-dark-200 overflow-x-auto">
                      {JSON.stringify(
                        parseActionDetails(log.actionDetails),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
