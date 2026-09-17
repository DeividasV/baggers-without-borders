"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  GripVertical,
  X,
  Lock,
  Unlock,
} from "lucide-react";
import SearchInput from "@/ui/SearchInput";
import StatsCard from "@/ui/StatsCard";
import { formatNumber } from "@/src/lib/utils";

type HallOfFame = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  allowManualEntry: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  progressRegisterExcludeRetired?: boolean;
  progressRegisterExcludeDeceased?: boolean;
  progressRegisterExcludeInactive?: boolean;
  progressRegisterInactivityYears?: number;
};

export default function HofManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hofs, setHofs] = useState<HallOfFame[]>([]);
  const [filteredHofs, setFilteredHofs] = useState<HallOfFame[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "ALL"
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    fetchHofs();
  }, []);

  useEffect(() => {
    // Don't re-filter while we're updating the order
    if (!isUpdatingOrder) {
      filterHofs();
    }
    updateURL();
  }, [hofs, searchTerm, statusFilter, isUpdatingOrder]);

  const updateURL = () => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    }

    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/hofs";
    router.replace(newUrl, { scroll: false });
  };

  const fetchHofs = async () => {
    // Only fetch once on initial mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      setLoading(true);
      const response = await fetch("/api/hofs");
      if (response.ok) {
        const data = await response.json();
        setHofs(data);
      }
    } catch (error) {
      console.error("Error fetching hofs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterHofs = () => {
    let filtered = [...hofs];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (hof) =>
          hof.code.toLowerCase().includes(lowerSearch) ||
          hof.title.toLowerCase().includes(lowerSearch) ||
          hof.description?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply status filter
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((hof) => hof.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((hof) => !hof.isActive);
    }

    setFilteredHofs(filtered);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newHofs = [...filteredHofs];
    const draggedItem = newHofs[draggedIndex];
    newHofs.splice(draggedIndex, 1);
    newHofs.splice(index, 0, draggedItem);

    // Update display order
    const updatedHofs = newHofs.map((hof, idx) => ({
      ...hof,
      displayOrder: idx,
    }));

    setFilteredHofs(updatedHofs);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    setIsDragging(false);
    setDraggedIndex(null);
    setIsUpdatingOrder(true);

    // Save the new order to the backend
    try {
      const updatePromises = filteredHofs.map((hof) =>
        fetch(`/api/hofs/${hof.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: hof.code,
            title: hof.title,
            description: hof.description,
            isActive: hof.isActive,
            allowManualEntry: hof.allowManualEntry,
            displayOrder: hof.displayOrder,
          }),
        })
      );

      await Promise.all(updatePromises);

      // Update the main hofs array with the new displayOrder values
      setHofs((prevHofs) =>
        prevHofs
          .map((hof) => {
            const updatedHof = filteredHofs.find((fh) => fh.id === hof.id);
            return updatedHof
              ? { ...hof, displayOrder: updatedHof.displayOrder }
              : hof;
          })
          .sort((a, b) => a.displayOrder - b.displayOrder)
      );
    } catch (error) {
      console.error("Error updating order:", error);
      // If update fails, refresh from server
      await fetchHofs();
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primary-400">Loading hofs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-400">
          Hall of Fame Management
        </h1>
        <p className="text-gray-400 mt-1">
          Manage prominence and achievement halls of fame
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            icon={Trophy}
            value={formatNumber(hofs.length)}
            label="Total"
          />
          <StatsCard
            icon={CheckCircle2}
            value={formatNumber(hofs.filter((l) => l.isActive).length)}
            label="Active"
          />
          <StatsCard
            icon={XCircle}
            value={formatNumber(hofs.filter((l) => !l.isActive).length)}
            label="Inactive"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start md:justify-end">
        <button
          onClick={() => router.push("/admin/hofs/new")}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Hall of Fame</span>
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
              placeholder="Search by code, title, or description..."
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
                {filteredHofs.length}
              </span>{" "}
              {filteredHofs.length === 1 ? "record" : "records"} •{" "}
              <span className="font-medium text-gray-300">
                {filteredHofs.length}
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

      {/* Hofs List */}
      {filteredHofs.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">
              No halls of fame yet
            </h2>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "ALL"
                ? "No halls of fame match your filters. Try adjusting your search."
                : "Create your first hall of fame to start tracking climbing achievements."}
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
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400 w-16">
                      Order
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Code
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Title
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Manual Entry
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHofs.map((hof, index) => {
                    const canDrag = !searchTerm && statusFilter === "ALL";

                    return (
                      <tr
                        key={hof.id}
                        draggable={canDrag}
                        onDragStart={(e) =>
                          canDrag && handleDragStart(e, index)
                        }
                        onDragOver={(e) => canDrag && handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          if (!isDragging) {
                            const currentParams = new URLSearchParams(
                              window.location.search
                            );
                            router.push(
                              `/admin/hofs/${
                                hof.id
                              }/edit?returnTo=${encodeURIComponent(
                                "/admin/hofs?" + currentParams.toString()
                              )}`
                            );
                          }
                        }}
                        className={`border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer ${
                          draggedIndex === index ? "opacity-50" : ""
                        }`}
                      >
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canDrag && (
                              <GripVertical className="h-4 w-4 text-gray-500 cursor-grab active:cursor-grabbing" />
                            )}
                            <span className="text-gray-300">
                              {hof.displayOrder}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono font-medium text-primary-400">
                            {hof.code}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-medium text-white">
                              {hof.title}
                            </span>
                            {hof.description && (
                              <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">
                                {hof.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {hof.isActive ? (
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
                        <td className="py-4 px-4 text-center">
                          {hof.allowManualEntry ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
                              <Unlock className="h-3 w-3 mr-1" />
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/30">
                              <Lock className="h-3 w-3 mr-1" />
                              Disabled
                            </span>
                          )}
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
            {filteredHofs.map((hof, index) => {
              const canDrag = !searchTerm && statusFilter === "ALL";

              return (
                <div
                  key={hof.id}
                  draggable={canDrag}
                  onDragStart={(e) => canDrag && handleDragStart(e, index)}
                  onDragOver={(e) => canDrag && handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    if (!isDragging) {
                      const currentParams = new URLSearchParams(
                        window.location.search
                      );
                      router.push(
                        `/admin/hofs/${
                          hof.id
                        }/edit?returnTo=${encodeURIComponent(
                          "/admin/hofs?" + currentParams.toString()
                        )}`
                      );
                    }
                  }}
                  className={`bg-dark-800 border border-dark-600 rounded-lg p-4 cursor-pointer hover:bg-dark-750 transition-colors ${
                    draggedIndex === index ? "opacity-50" : ""
                  }`}
                >
                  {/* Header with Order and Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {canDrag && (
                        <GripVertical className="h-4 w-4 text-gray-500 cursor-grab active:cursor-grabbing" />
                      )}
                      <span className="text-sm font-medium text-gray-400">
                        Order: {hof.displayOrder}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hof.isActive ? (
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
                  </div>

                  {/* Code and Title */}
                  <div className="mb-2">
                    <span className="font-mono text-sm font-medium text-primary-400">
                      {hof.code}
                    </span>
                    <h2 className="text-xl font-bold text-white">
                      {hof.title}
                    </h2>
                  </div>

                  {/* Description */}
                  {hof.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {hof.description}
                    </p>
                  )}

                  {/* Manual Entry Status */}
                  <div className="flex items-center gap-2 pt-2 border-t border-dark-700">
                    <span className="text-xs text-gray-500">Manual Entry:</span>
                    {hof.allowManualEntry ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
                        <Unlock className="h-3 w-3 mr-1" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/30">
                        <Lock className="h-3 w-3 mr-1" />
                        Disabled
                      </span>
                    )}
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
