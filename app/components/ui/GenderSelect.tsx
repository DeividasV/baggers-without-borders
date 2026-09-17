"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, X } from "lucide-react";

interface GenderOption {
  value: string;
  label: string;
}

interface GenderSelectProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

const GENDER_OPTIONS: GenderOption[] = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
  { value: "N", label: "Prefer not to say" },
];

export default function GenderSelect({
  label,
  value = "",
  onChange,
  placeholder = "Select gender",
  error,
  disabled = false,
}: GenderSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<GenderOption | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update selected option when value changes
    if (value) {
      const option = GENDER_OPTIONS.find((g) => g.value === value);
      setSelectedOption(option || null);
    } else {
      setSelectedOption(null);
    }
  }, [value]);

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

  const handleSelect = (option: GenderOption) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange("");
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-400">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{ backgroundColor: isOpen ? "#252525" : "#1a1a1a" }}
          className={`
            w-full px-4 py-2 text-left
            border rounded-lg
            flex items-center justify-between
            transition-all duration-150
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-dark-600 cursor-pointer"
            }
            ${error ? "border-red-500 focus:ring-red-500" : "border-dark-700"}
            ${isOpen ? "ring-2 ring-primary-500/50 border-primary-500" : ""}
          `}
        >
          {selectedOption ? (
            <span className="text-gray-200">{selectedOption.label}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <div className="flex items-center space-x-1">
            {selectedOption && !disabled && (
              <span
                onClick={handleClear}
                className="p-1 hover:bg-dark-500 rounded transition-colors cursor-pointer"
              >
                <X className="h-4 w-4 text-gray-400" />
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-dark-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="overflow-y-auto max-h-[240px]">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full px-4 py-2 text-left hover:bg-[#252525]
                    transition-colors duration-100 border-b border-dark-800/30
                    ${
                      selectedOption?.value === option.value
                        ? "bg-primary-900/40 text-primary-300 font-medium"
                        : "text-gray-200"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  );
}
