"use client";

import { ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useId } from "react";

interface SortOption {
  label: string;
  field: string;
}

interface MultiValueTableHeaderProps {
  label: string;
  options: SortOption[];
  currentSortBy: string;
  currentSortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  align?: "left" | "center" | "right";
}

export default function MultiValueTableHeader({
  label,
  options,
  currentSortBy,
  currentSortOrder,
  onSort,
  align = "center",
}: MultiValueTableHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Check if any of the options is currently active
  const activeOption = options.find((opt) => opt.field === currentSortBy);
  const isActive = !!activeOption;

  const textAlign =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = (field: string) => {
    onSort(field);
    setIsOpen(false);
  };

  return (
    <th className={`py-3 px-4 text-sm font-medium ${textAlign} relative`}>
      <div ref={dropdownRef} className="relative inline-block">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-1.5 hover:text-primary-400 transition-colors cursor-pointer select-none ${
            isActive ? "text-primary-400" : "text-gray-400"
          }`}
          aria-label={`Sort by ${label}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
        >
          <span>{label}</span>
          <span className="shrink-0 flex items-center gap-0.5">
            {isActive && (
              <>
                {currentSortOrder === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </>
            )}
            <ChevronDown className="h-3 w-3" />
          </span>
        </button>

        {isOpen && (
          <div
            id={menuId}
            role="menu"
            aria-label={`${label} sort options`}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg py-1 z-50 min-w-40"
          >
            {options.map((option) => (
              <button
                key={option.field}
                type="button"
                onClick={() => handleOptionClick(option.field)}
                role="menuitemradio"
                aria-checked={currentSortBy === option.field}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-dark-700 transition-colors ${
                  currentSortBy === option.field
                    ? "text-primary-400 bg-dark-750"
                    : "text-gray-300"
                }`}
              >
                {option.label}
                {currentSortBy === option.field && (
                  <span className="ml-2 text-xs">
                    {currentSortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </th>
  );
}
