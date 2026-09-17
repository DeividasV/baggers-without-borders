"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { formatDateYMD } from "@/src/lib/utils";
import { User } from "@/src/types/user-management";
import SortableTableHeader from "@/ui/SortableTableHeader";

interface UserTableProps {
  users: User[];
  currentParams: URLSearchParams;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}

export default function UserTable({
  users,
  currentParams,
  sortBy,
  sortOrder,
  onSort,
}: UserTableProps) {
  const router = useRouter();
  const [showScrollShadow, setShowScrollShadow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if table needs horizontal scrolling
  useEffect(() => {
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (container) {
        const needsScroll = container.scrollWidth > container.clientWidth;
        setShowScrollShadow(needsScroll);
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [users]);

  const handleRowClick = (userId: string) => {
    router.push(
      `/admin/members/${userId}?returnTo=${encodeURIComponent(
        "/admin/members?" + currentParams.toString(),
      )}`,
    );
  };

  return (
    <div className="hidden md:block card relative">
      {/* Scroll shadow indicator - only visible when scrolling is needed */}
      {showScrollShadow && (
        <div className="absolute top-0 right-0 bottom-0 w-12 bg-linear-to-l from-dark-900 via-dark-900/80 to-transparent pointer-events-none z-10 rounded-r-lg shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.6)]" />
      )}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800"
      >
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
            <col className="w-[12%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-dark-600">
              <SortableTableHeader
                label="Given Name"
                field="givenName"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                align="left"
              />
              <SortableTableHeader
                label="Family Name"
                field="familyName"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                align="left"
              />
              <SortableTableHeader
                label="Email"
                field="email"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                align="left"
              />
              <SortableTableHeader
                label="Residence"
                field="residenceCountry"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                align="left"
              />
              <SortableTableHeader
                label="Since"
                field="forumJoinDate"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                align="left"
              />
              <SortableTableHeader
                label="Status"
                field="status"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                align="left"
              />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => handleRowClick(user.id)}
                className="border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <td className="py-4 px-4">
                  <span className="text-white truncate block">
                    {user.givenName || "—"}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-white truncate block">
                    {user.familyName || "—"}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-400 truncate block">
                    {user.email || "—"}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-400 truncate block">
                    {user.residenceCountry?.code || "—"}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-400 truncate block">
                    {user.forumJoinDate
                      ? formatDateYMD(user.forumJoinDate)
                      : "—"}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === "ACTIVE"
                        ? "bg-green-900/30 text-green-400 border border-green-700/30"
                        : user.status === "NEW"
                          ? "bg-blue-900/30 text-blue-400 border border-blue-700/30"
                          : "bg-gray-900/30 text-gray-400 border border-gray-700/30"
                    }`}
                  >
                    {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>{" "}
      </div>{" "}
    </div>
  );
}
