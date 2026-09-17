"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, X, Search, Loader2 } from "lucide-react";

interface Interest {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface InterestMultiSelectProps {
  label?: string;
  value: string[]; // Array of interest IDs
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export default function InterestMultiSelect({
  label,
  value = [],
  onChange,
  placeholder = "Select interests",
  error,
  disabled = false,
}: InterestMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedInterests = useRef(false);

  useEffect(() => {
    fetchInterests();
  }, []);

  useEffect(() => {
    // Update selected interests when value changes
    if (interests.length > 0) {
      if (value.length === 0) {
        setSelectedInterests([]);
      } else {
        const selected = interests.filter((i) => value.includes(i.id));
        setSelectedInterests(selected);
      }
    }
  }, [value, interests]);

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

  const fetchInterests = async () => {
    // Only fetch interests once
    if (hasInitializedInterests.current) return;
    hasInitializedInterests.current = true;

    try {
      const response = await fetch("/api/interests");
      if (response.ok) {
        const data = await response.json();
        // Filter only active interests and sort by displayOrder
        const activeInterests = data
          .filter((i: Interest) => i.isActive)
          .sort((a: Interest, b: Interest) => a.displayOrder - b.displayOrder);
        setInterests(activeInterests);
      }
    } catch (error) {
      console.error("Error fetching interests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInterest = (interest: Interest) => {
    const isSelected = value.includes(interest.id);
    if (isSelected) {
      // Remove from selection
      const newValue = value.filter((id) => id !== interest.id);
      onChange(newValue);
    } else {
      // Add to selection
      onChange([...value, interest.id]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setSearchTerm("");
  };

  const handleRemoveInterest = (e: React.MouseEvent, interestId: string) => {
    e.stopPropagation();
    const newValue = value.filter((id) => id !== interestId);
    onChange(newValue);
  };

  const filteredInterests = searchTerm
    ? interests.filter((interest) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          interest.name.toLowerCase().includes(searchLower) ||
          interest.description?.toLowerCase().includes(searchLower)
        );
      })
    : interests; // Show all interests when no search term

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
          {loading ? (
            <span className="flex items-center text-gray-400">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading interests...
            </span>
          ) : selectedInterests.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap min-h-[24px]">
              {selectedInterests.slice(0, 3).map((interest) => (
                <span
                  key={interest.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-900/40 text-primary-300 text-xs rounded-md"
                >
                  {interest.name}
                  <span
                    onClick={(e) => handleRemoveInterest(e, interest.id)}
                    className="hover:bg-primary-900/60 rounded-sm p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))}
              {selectedInterests.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{selectedInterests.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <div className="flex items-center space-x-1">
            {selectedInterests.length > 0 && !disabled && (
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

        {isOpen && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-dark-700 rounded-lg shadow-xl max-h-[400px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search input */}
            <div className="sticky top-0 p-3 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-dark-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search interests..."
                  className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-dark-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Interests list */}
            <div className="overflow-y-auto max-h-[320px] bg-[#1a1a1a]">
              {filteredInterests.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No interests found
                </div>
              ) : (
                filteredInterests.map((interest) => {
                  const isSelected = value.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => handleToggleInterest(interest)}
                      className={`
                        w-full px-4 py-2 text-left hover:bg-[#252525]
                        transition-colors duration-100 border-b border-dark-800/30
                        ${
                          isSelected
                            ? "bg-primary-900/40 text-primary-300 font-medium"
                            : "text-gray-200"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex-1 line-clamp-2 min-w-0">
                          {interest.name}
                        </span>
                        {isSelected && (
                          <span className="text-xs text-primary-400 w-4 flex-shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      {interest.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {interest.description}
                        </div>
                      )}
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
