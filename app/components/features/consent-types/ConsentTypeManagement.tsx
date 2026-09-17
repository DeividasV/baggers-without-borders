"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Filter,
  Paperclip,
  CheckCircle2,
  XCircle,
  Users,
  X,
} from "lucide-react";
import SearchInput from "@/ui/SearchInput";
import StatsCard from "@/ui/StatsCard";
import { formatNumber, formatDateYMD } from "@/src/lib/utils";

type ConsentType = {
  id: string;
  title: string;
  description: string;
  internalNotes?: string | null;
  status: string;
  dateIntroduced: string;
  createdAt: string;
  updatedAt: string;
  attachments: any[];
  _count: {
    attachments: number;
    userConsents: number;
  };
};

export default function ConsentTypeManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [consentTypes, setConsentTypes] = useState<ConsentType[]>([]);
  const [filteredConsentTypes, setFilteredConsentTypes] = useState<
    ConsentType[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "ALL"
  );
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (!session) return;
    if (session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    fetchConsentTypes();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    filterConsentTypes();
    updateURL();
  }, [consentTypes, searchTerm, statusFilter]);

  const updateURL = () => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    }

    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }

    const newUrl = params.toString()
      ? `?${params.toString()}`
      : "/admin/consent-types";
    router.replace(newUrl, { scroll: false });
  };

  const fetchConsentTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/consent-types");
      if (response.ok) {
        const data = await response.json();
        setConsentTypes(data.consentTypes || []);
      }
    } catch (error) {
      console.error("Error fetching consent types:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterConsentTypes = () => {
    let filtered = [...consentTypes];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ct) =>
          ct.title.toLowerCase().includes(lowerSearch) ||
          ct.description.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((ct) => ct.status === statusFilter);
    }

    setFilteredConsentTypes(filtered);
  };

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primary-400">Loading consent types...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-400">
          Consent Types Management
        </h1>
        <p className="text-gray-400 mt-1">
          Manage consent types and their documentation
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            icon={FileText}
            value={formatNumber(consentTypes.length)}
            label="Total"
          />
          <StatsCard
            icon={CheckCircle2}
            value={formatNumber(
              consentTypes.filter((ct) => ct.status === "ACTIVE").length
            )}
            label="Active"
          />
          <StatsCard
            icon={XCircle}
            value={formatNumber(
              consentTypes.filter((ct) => ct.status === "INACTIVE").length
            )}
            label="Inactive"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start md:justify-end">
        <button
          onClick={() => router.push("/admin/consent-types/new")}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Consent Type</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description..."
            />

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field pl-10 w-full"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Info and Clear Button */}
          <div className="flex justify-between items-center gap-2 pt-2">
            <div className="text-xs text-gray-400">
              <span className="font-medium text-gray-300">
                {filteredConsentTypes.length}
              </span>{" "}
              {filteredConsentTypes.length === 1 ? "record" : "records"} •{" "}
              <span className="font-medium text-gray-300">
                {filteredConsentTypes.length}
              </span>{" "}
              displayed
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              disabled={!searchTerm && statusFilter === "ALL"}
              className="text-xs text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Consent Types List */}
      {filteredConsentTypes.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">
              No consent types found
            </h2>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your filters"
                : "Create your first consent type to get started"}
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Title
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Date Introduced
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Attachments
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Users
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsentTypes.map((consentType) => (
                    <tr
                      key={consentType.id}
                      onClick={() => {
                        const currentParams = new URLSearchParams(
                          window.location.search
                        );
                        router.push(
                          `/admin/consent-types/${
                            consentType.id
                          }?returnTo=${encodeURIComponent(
                            "/admin/consent-types?" + currentParams.toString()
                          )}`
                        );
                      }}
                      className="border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">
                            {consentType.title}
                          </span>
                          <span className="text-sm text-gray-400 line-clamp-1">
                            {consentType.description}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {consentType.status === "ACTIVE" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900/30 text-gray-400 border border-gray-700/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {formatDateYMD(consentType.dateIntroduced)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {consentType._count.attachments > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
                            <Paperclip className="h-3 w-3 mr-1" />
                            {consentType._count.attachments}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {consentType._count.userConsents > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700/30">
                            <Users className="h-3 w-3 mr-1" />
                            {consentType._count.userConsents}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredConsentTypes.map((consentType) => (
              <div
                key={consentType.id}
                onClick={() => {
                  const currentParams = new URLSearchParams(
                    window.location.search
                  );
                  router.push(
                    `/admin/consent-types/${
                      consentType.id
                    }?returnTo=${encodeURIComponent(
                      "/admin/consent-types?" + currentParams.toString()
                    )}`
                  );
                }}
                className="bg-dark-800 border border-dark-600 rounded-lg p-4 cursor-pointer hover:bg-dark-750 transition-colors"
              >
                {/* Header with Status and Date */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">
                    {formatDateYMD(consentType.dateIntroduced)}
                  </span>
                  {consentType.status === "ACTIVE" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900/30 text-gray-400 border border-gray-700/30">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-2">
                  {consentType.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {consentType.description}
                </p>

                {/* Footer with Attachments and Users */}
                <div className="flex items-center justify-between">
                  <div>
                    {consentType._count.attachments > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
                        <Paperclip className="h-3 w-3 mr-1" />
                        {consentType._count.attachments}{" "}
                        {consentType._count.attachments === 1
                          ? "file"
                          : "files"}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        No attachments
                      </span>
                    )}
                  </div>
                  <div>
                    {consentType._count.userConsents > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700/30">
                        <Users className="h-3 w-3 mr-1" />
                        {consentType._count.userConsents}{" "}
                        {consentType._count.userConsents === 1
                          ? "user"
                          : "users"}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        No users yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
