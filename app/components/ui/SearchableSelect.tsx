"use client";

import { useEffect, useState, useRef, useMemo, useId, memo } from "react";
import { ChevronDown, X, Search, Loader2 } from "lucide-react";

interface Option {
  id: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  id?: string;
  showClearButton?: boolean;
}

function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  error,
  disabled = false,
  loading = false,
  required = false,
  id,
  showClearButton = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const fieldId = id || `searchable-select-${generatedId}`;
  const labelId = `${fieldId}-label`;
  const listboxId = `${fieldId}-listbox`;

  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Focus search input when dropdown opens
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Find the "ALL" option if it exists, otherwise use empty string
    const allOption = options.find((opt) => opt.id === "ALL");
    onChange(allOption ? "ALL" : "");
    setSearchTerm("");
  };

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;

    const searchLower = searchTerm.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.subtitle?.toLowerCase().includes(searchLower),
    );
  }, [options, searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const firstOption = document.getElementById(`${listboxId}-option-0`);
      firstOption?.focus();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          id={labelId}
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-400"
        >
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          id={fieldId}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-labelledby={label ? labelId : undefined}
          aria-label={!label ? placeholder : undefined}
          style={{ backgroundColor: isOpen ? "#252525" : "#1a1a1a" }}
          className={`
            w-full px-3 py-1.5 sm:px-4 sm:py-2 text-left
            border rounded-lg
            flex items-center justify-between
            transition-all duration-150
            ${
              disabled || loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-dark-600 cursor-pointer"
            }
            ${error ? "border-red-500 focus:ring-red-500" : "border-dark-700"}
            ${isOpen ? "ring-2 ring-primary-500/50 border-primary-500" : ""}
            ${selectedOption && !disabled && !loading && showClearButton ? "pr-20" : ""}
          `}
        >
          {loading ? (
            <span className="flex items-center text-gray-400">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </span>
          ) : selectedOption ? (
            <div className="flex flex-col min-h-6">
              <span
                className={
                  selectedOption.id === "ALL" || selectedOption.id === ""
                    ? "text-gray-500"
                    : "text-white"
                }
              >
                {selectedOption.label}
              </span>
              {selectedOption.subtitle && (
                <span className="text-xs text-gray-400">
                  {selectedOption.subtitle}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>
        {selectedOption && !disabled && !loading && showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={`Clear selection: ${selectedOption.label}`}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-3 hover:bg-dark-500 rounded transition-colors cursor-pointer z-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <X className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </button>
        )}

        {isOpen && !loading && (
          <div className="absolute z-40 w-full mt-1 bg-dark-950 border border-dark-700 rounded-lg shadow-xl max-h-[min(400px,60vh)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search input */}
            <div className="sticky top-0 p-3 bg-dark-950/95 backdrop-blur-sm border-b border-dark-700 z-10">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500"
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label="Search options"
                  className="w-full pl-9 pr-3 py-2 sm:pl-10 sm:pr-4 bg-dark-950 border border-dark-700 rounded-lg text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Options list */}
            <div
              id={listboxId}
              role="listbox"
              aria-labelledby={label ? labelId : undefined}
              aria-label={!label ? "Options list" : undefined}
              className="overflow-y-auto max-h-[min(320px,50vh)] bg-dark-950 relative"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#4a4a4a #1a1a1a",
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  {searchTerm
                    ? `No matches for "${searchTerm}"`
                    : "No options available"}
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = value === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      id={`${listboxId}-option-${index}`}
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option.id)}
                      title={option.label}
                      className={`
                        w-full px-3 py-3 sm:px-4 text-left hover:bg-[#252525]
                        focus:outline-none focus:bg-[#252525] focus:ring-inset focus:ring-2 focus:ring-primary-500/50
                        transition-colors duration-100 border-b border-dark-800/30
                        ${
                          isSelected
                            ? "bg-primary-900/40 text-primary-300 font-medium"
                            : "text-gray-200"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="line-clamp-1 sm:line-clamp-2">
                            {option.label}
                          </div>
                          {option.subtitle && (
                            <div
                              className="text-xs text-gray-500 mt-0.5 line-clamp-1"
                              title={option.subtitle}
                            >
                              {option.subtitle}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-xs text-primary-400 w-4 shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default memo(SearchableSelect);
