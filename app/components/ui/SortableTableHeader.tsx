"use client";

import { ArrowUp, ArrowDown } from "lucide-react";

interface SortableTableHeaderProps {
  label: string;
  field: string;
  currentSortBy: string;
  currentSortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  align?: "left" | "center" | "right";
  className?: string;
}

export default function SortableTableHeader({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  onSort,
  align = "left",
  className = "",
}: SortableTableHeaderProps) {
  const isActive = currentSortBy === field;
  const textAlign =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <th className={`py-3 px-4 text-sm font-medium ${textAlign} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1.5 hover:text-primary-400 transition-colors cursor-pointer select-none ${
          isActive ? "text-primary-400" : "text-gray-400"
        }`}
        aria-label={`Sort by ${label} ${
          isActive
            ? currentSortOrder === "asc"
              ? "descending"
              : "ascending"
            : "ascending"
        }`}
      >
        <span>{label}</span>
        {isActive && (
          <span className="shrink-0">
            {currentSortOrder === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </span>
        )}
      </button>
    </th>
  );
}
