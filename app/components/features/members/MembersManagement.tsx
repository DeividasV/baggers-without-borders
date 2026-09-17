"use client";

import { useState } from "react";
import { Users, Plus, X } from "lucide-react";
import Button from "@/ui/Button";
import EmptyState from "@/ui/EmptyState";
import { Pagination } from "@/ui/Pagination";
import { useUsers } from "@/src/lib/hooks/useUserManagement";
import UserStats from "./UserStats";
import SearchControls from "./SearchControls";
import UserTable from "./UserTable";
import UserCardList from "./UserCardList";
import CreateUserModal from "./CreateUserModal";

export default function MembersManagement() {
  const [showAddModal, setShowAddModal] = useState(false);

  const {
    users,
    loading,
    filtering,
    pagination,
    stats,
    searchMode,
    basicSearch,
    advancedFilters,
    setSearchMode,
    setBasicSearch,
    setAdvancedFilters,
    setPagination,
    refetchUsers,
    handleSort,
  } = useUsers();

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize, page: 1 }));
  };

  const handleBasicSearchChange = (value: string) => {
    setBasicSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAdvancedFilterChange = (
    updates: Partial<typeof advancedFilters>
  ) => {
    setAdvancedFilters((prev) => ({ ...prev, ...updates }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchModeChange = (mode: typeof searchMode) => {
    if (mode === searchMode) return;
    setSearchMode(mode);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      givenName: "",
      familyName: "",
      email: "",
      gender: "",
      birthYearMin: "",
      birthYearMax: "",
      birthCountry: [],
      residenceCountry: [],
      role: "",
      status: "",
      forumNickname: "",
      notes: "",
      createdDateFrom: "",
      createdDateTo: "",
      updatedDateFrom: "",
      updatedDateTo: "",
      sortBy: "givenName",
      sortOrder: "asc",
      showRetired: false,
      showDeceased: false,
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const currentParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-400">
          Members Management
        </h1>
        <p className="text-gray-400 mt-1">Manage members and their profiles</p>
      </div>

      {/* Stats & Actions */}
      <UserStats
        totalCount={pagination.totalCount}
        stats={stats}
        onCreateClick={() => setShowAddModal(true)}
      />

      {/* Search Controls */}
      <SearchControls
        searchMode={searchMode}
        basicSearch={basicSearch}
        advancedFilters={advancedFilters}
        pagination={pagination}
        filtering={filtering}
        displayedCount={users.length}
        onSearchModeChange={handleSearchModeChange}
        onBasicSearchChange={handleBasicSearchChange}
        onAdvancedFilterChange={handleAdvancedFilterChange}
        onClearBasicSearch={() => {
          handleBasicSearchChange("");
          clearAdvancedFilters();
        }}
        onClearAdvancedFilters={clearAdvancedFilters}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Members List */}
      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            pagination.totalCount === 0
              ? "No members yet"
              : "No matching members"
          }
          description={
            pagination.totalCount === 0
              ? "Add your first member to get started."
              : "Try adjusting your filters to see more results."
          }
          action={
            pagination.totalCount === 0 ? (
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Add Member
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  if (searchMode === "simple") {
                    handleBasicSearchChange("");
                  } else {
                    clearAdvancedFilters();
                  }
                }}
                icon={<X className="h-4 w-4" />}
              >
                Clear {searchMode === "simple" ? "Search" : "Filters"}
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <UserTable
            users={users}
            currentParams={currentParams}
            sortBy={advancedFilters.sortBy}
            sortOrder={advancedFilters.sortOrder as "asc" | "desc"}
            onSort={handleSort}
          />

          {/* Mobile Card View */}
          <UserCardList
            users={users}
            currentParams={currentParams}
            sortBy={advancedFilters.sortBy}
            sortOrder={advancedFilters.sortOrder as "asc" | "desc"}
            onSort={handleSort}
          />

          {/* Pagination Controls */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            pageSize={pagination.limit}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            itemName="members"
          />
        </>
      )}

      {/* Create Member Modal */}
      <CreateUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetchUsers}
      />
    </div>
  );
}
