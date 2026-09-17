"use client";

import { useRouter } from "next/navigation";
import { formatDateYMD } from "@/src/lib/utils";
import { User } from "@/src/types/user-management";
import SortBySelect from "@/ui/SortBySelect";
import SortDirectionSelect from "@/ui/SortDirectionSelect";

interface UserCardListProps {
  users: User[];
  currentParams: URLSearchParams;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}

export default function UserCardList({
  users,
  currentParams,
  sortBy,
  sortOrder,
  onSort,
}: UserCardListProps) {
  const router = useRouter();

  const handleCardClick = (userId: string) => {
    router.push(
      `/admin/members/${userId}?returnTo=${encodeURIComponent(
        "/admin/members?" + currentParams.toString()
      )}`
    );
  };

  const handleSortChange = (newSortBy: string) => {
    onSort(newSortBy);
  };

  const handleSortDirectionChange = (newSortOrder: string) => {
    // To change direction, we need to trigger sort with the same field
    // which will be picked up by handleSort in the hook
    // But we need to force the direction, so we call onSort if different
    if (newSortOrder !== sortOrder) {
      onSort(sortBy); // This will toggle the direction
    }
  };

  return (
    <div className="md:hidden space-y-4">
      {/* Mobile Sort Controls */}
      <div className="card bg-dark-800/50 border border-dark-600">
        <div className="grid grid-cols-2 gap-3">
          <SortBySelect
            label="Sort By"
            value={sortBy}
            onChange={handleSortChange}
          />
          <SortDirectionSelect
            label="Direction"
            value={sortOrder}
            onChange={handleSortDirectionChange}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => handleCardClick(user.id)}
            className="card bg-dark-800 border border-dark-600 cursor-pointer hover:bg-dark-750 transition-colors"
          >
            {/* Header with Status Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-lg font-semibold text-white">
                {[user.givenName, user.familyName].filter(Boolean).join(" ") ||
                  user.displayName}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.status === "ACTIVE"
                    ? "bg-green-900/30 text-green-400 border border-green-700/30"
                    : user.status === "NEW"
                    ? "bg-blue-900/30 text-blue-400 border border-blue-700/30"
                    : "bg-gray-900/30 text-gray-400 border border-gray-700/30"
                }`}
              >
                {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
              </span>
            </div>

            {/* Details Grid */}
            <div className="space-y-2 text-sm">
              {user.email && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 min-w-20">Email:</span>
                  <span className="text-gray-300 truncate">{user.email}</span>
                </div>
              )}
              {user.residenceCountry?.code && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 min-w-20">Residence:</span>
                  <span className="text-gray-300">
                    {user.residenceCountry.code}
                  </span>
                </div>
              )}
              {user.forumJoinDate && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 min-w-20">Since:</span>
                  <span className="text-gray-300">
                    {formatDateYMD(user.forumJoinDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
