"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface YearPickerProps {
  label?: string;
  value?: number;
  onChange: (year: number | null) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  required?: boolean;
  error?: string;
  isInRange?: boolean; // Indicates if this picker is part of a range
}

export default function YearPicker({
  label,
  value,
  onChange,
  placeholder = "Select year",
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  required = false,
  error,
  isInRange = false,
}: YearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState(value?.toString() || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate years in reverse order (newest first)
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  );

  // Filter years based on search
  const filteredYears = searchTerm
    ? years.filter((year) => year.toString().includes(searchTerm))
    : years;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset input to actual value if invalid
        if (value) {
          setInputValue(value.toString());
        } else {
          setInputValue("");
        }
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setSearchTerm(val);
    setIsOpen(true);

    // If input is empty, clear the value
    if (val === "") {
      onChange(null);
      return;
    }

    // If input is a valid 4-digit year in range, set it immediately
    const numVal = parseInt(val);
    if (
      val.length === 4 &&
      !isNaN(numVal) &&
      numVal >= minYear &&
      numVal <= maxYear
    ) {
      onChange(numVal);
    }
  };

  const handleYearSelect = (year: number) => {
    onChange(year);
    setInputValue(year.toString());
    setSearchTerm("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Select all text for easy replacement
    inputRef.current?.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && filteredYears.length > 0) {
      handleYearSelect(filteredYears[0]);
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    onChange(null);
    setInputValue("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-400">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`
              w-full px-4 py-2 pr-20
              bg-[#1a1a1a] border rounded-lg
              text-gray-100 placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-all
              ${error ? "border-red-500" : "border-[#4f4f4f]"}
            `}
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors p-1"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label={isOpen ? "Close year picker" : "Open year picker"}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className={`absolute z-50 mt-1 bg-[#1a1a1a] border border-dark-700 rounded-lg shadow-xl overflow-hidden ${
              isInRange ? "left-0 right-0" : "w-full"
            }`}
            style={
              isInRange
                ? {
                    left: containerRef.current?.getBoundingClientRect().left
                      ? `${
                          -containerRef.current.getBoundingClientRect().left +
                          (containerRef.current
                            .closest(".flex")
                            ?.getBoundingClientRect().left || 0)
                        }px`
                      : undefined,
                    width: containerRef.current?.closest(".flex")
                      ? `${
                          containerRef.current
                            .closest(".flex")
                            ?.getBoundingClientRect().width
                        }px`
                      : undefined,
                  }
                : undefined
            }
          >
            {/* Years grid */}
            <div className="max-h-80 overflow-y-auto bg-[#1a1a1a] p-2">
              {filteredYears.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(70px,1fr))] gap-1">
                  {filteredYears.map((year) => (
                    <button
                      key={year}
                      type="button"
                      data-year={year}
                      onClick={() => handleYearSelect(year)}
                      className={`
                        px-3 py-2 text-center transition-colors rounded
                        ${
                          year === value
                            ? "bg-primary-900/40 text-primary-300 font-medium border border-primary-500/30"
                            : "text-gray-200 hover:bg-[#252525] border border-transparent"
                        }
                      `}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No years found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
