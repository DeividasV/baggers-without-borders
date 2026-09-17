"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Heart,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Users,
  GripVertical,
  X,
} from "lucide-react";
import SearchInput from "@/ui/SearchInput";
import StatsCard from "@/ui/StatsCard";
import { formatNumber } from "@/src/lib/utils";

type Interest = {
  id: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    userInterests: number;
  };
};

export default function InterestManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [filteredInterests, setFilteredInterests] = useState<Interest[]>([]);
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
    // Only run once on mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (!session) return;
    if (session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    fetchInterests();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Don't re-filter while we're updating the order
    if (!isUpdatingOrder) {
      filterInterests();
    }
    updateURL();
  }, [interests, searchTerm, statusFilter, isUpdatingOrder]);

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
      : "/admin/interests";
    router.replace(newUrl, { scroll: false });
  };

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/interests");
      if (response.ok) {
        const data = await response.json();
        setInterests(data);
      }
    } catch (error) {
      console.error("Error fetching interests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterInterests = () => {
    let filtered = [...interests];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (interest) =>
          interest.name.toLowerCase().includes(lowerSearch) ||
          interest.description?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply status filter
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((interest) => interest.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((interest) => !interest.isActive);
    }

    setFilteredInterests(filtered);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newInterests = [...filteredInterests];
    const draggedItem = newInterests[draggedIndex];
    newInterests.splice(draggedIndex, 1);
    newInterests.splice(index, 0, draggedItem);

    // Update display order
    const updatedInterests = newInterests.map((interest, idx) => ({
      ...interest,
      displayOrder: idx,
    }));

    setFilteredInterests(updatedInterests);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    setIsDragging(false);
    setDraggedIndex(null);
    setIsUpdatingOrder(true);

    // Save the new order to the backend
    try {
      const updatePromises = filteredInterests.map((interest) =>
        fetch(`/api/interests/${interest.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: interest.name,
            description: interest.description,
            displayOrder: interest.displayOrder,
            isActive: interest.isActive,
          }),
        })
      );

      await Promise.all(updatePromises);

      // Update the main interests array with the new displayOrder values
      setInterests((prevInterests) =>
        prevInterests
          .map((interest) => {
            const updatedInterest = filteredInterests.find(
              (fi) => fi.id === interest.id
            );
            return updatedInterest
              ? { ...interest, displayOrder: updatedInterest.displayOrder }
              : interest;
          })
          .sort((a, b) => a.displayOrder - b.displayOrder)
      );
    } catch (error) {
      console.error("Error updating order:", error);
      // If update fails, refresh from server
      await fetchInterests();
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primary-400">Loading interests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-400">
          Interest Management
        </h1>
        <p className="text-gray-400 mt-1">
          Manage user interests and activities
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            icon={Heart}
            value={formatNumber(interests.length)}
            label="Total"
          />
          <StatsCard
            icon={CheckCircle2}
            value={formatNumber(interests.filter((i) => i.isActive).length)}
            label="Active"
          />
          <StatsCard
            icon={XCircle}
            value={formatNumber(interests.filter((i) => !i.isActive).length)}
            label="Inactive"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start md:justify-end">
        <button
          onClick={() => router.push("/admin/interests/new")}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Interest</span>
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
              placeholder="Search by name or description..."
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
                {filteredInterests.length}
              </span>{" "}
              {filteredInterests.length === 1 ? "record" : "records"} •{" "}
              <span className="font-medium text-gray-300">
                {filteredInterests.length}
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

      {/* Interests List */}
      {filteredInterests.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">
              No interests found
            </h2>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your filters"
                : "Create your first interest to get started"}
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
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Users
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterests.map((interest, index) => {
                    const canDrag = !searchTerm && statusFilter === "ALL";

                    return (
                      <tr
                        key={interest.id}
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
                              `/admin/interests/${
                                interest.id
                              }/edit?returnTo=${encodeURIComponent(
                                "/admin/interests?" + currentParams.toString()
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
                              {interest.displayOrder}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-white">
                            {interest.name}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-400 line-clamp-1">
                            {interest.description || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {interest.isActive ? (
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
                          {interest._count.userInterests > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
                              <Users className="h-3 w-3 mr-1" />
                              {interest._count.userInterests}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredInterests.map((interest, index) => {
                const canDrag = !searchTerm && statusFilter === "ALL";

                return (
                  <div
                    key={interest.id}
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
                          `/admin/interests/${
                            interest.id
                          }/edit?returnTo=${encodeURIComponent(
                            "/admin/interests?" + currentParams.toString()
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
                          Order: {interest.displayOrder}
                        </span>
                      </div>
                      {interest.isActive ? (
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

                    {/* Name */}
                    <h2 className="text-xl font-bold text-white mb-2">
                      {interest.name}
                    </h2>

                    {/* Description */}
                    {interest.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {interest.description}
                      </p>
                    )}

                    {/* Users Count */}
                    <div className="flex items-center justify-end">
                      {interest._count.userInterests > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
                          <Users className="h-3 w-3 mr-1" />
                          {interest._count.userInterests}{" "}
                          {interest._count.userInterests === 1
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
                );
              })}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredInterests.map((interest, index) => {
              const canDrag = !searchTerm && statusFilter === "ALL";

              return (
                <div
                  key={interest.id}
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
                        `/admin/interests/${
                          interest.id
                        }/edit?returnTo=${encodeURIComponent(
                          "/admin/interests?" + currentParams.toString()
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
                        Order: {interest.displayOrder}
                      </span>
                    </div>
                    {interest.isActive ? (
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

                  {/* Name */}
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {interest.name}
                  </h3>

                  {/* Description */}
                  {interest.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {interest.description}
                    </p>
                  )}

                  {/* Users Count */}
                  <div className="flex items-center justify-end">
                    {interest._count.userInterests > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
                        <Users className="h-3 w-3 mr-1" />
                        {interest._count.userInterests}{" "}
                        {interest._count.userInterests === 1 ? "user" : "users"}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        No users yet
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
