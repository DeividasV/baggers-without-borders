"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, X, Search, Loader2 } from "lucide-react";

interface Country {
  id: string;
  code: string;
  code3: string;
  name: string;
  nativeName: string | null;
  numericCode: string | null;
  continent: string;
  currency: string | null;
  languages: string | null;
  hasRegions: boolean;
}

interface CountryMultiSelectProps {
  label?: string;
  value?: string[]; // Array of country codes (for backward compatibility)
  selectedCountryIds?: string[]; // Array of country IDs (alternative API)
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  showAllOption?: boolean; // Show "All" option (only for code-based API)
  useIds?: boolean; // If true, work with IDs instead of codes
}

export default function CountryMultiSelect({
  label,
  value,
  selectedCountryIds,
  onChange,
  placeholder = "Select countries",
  error,
  disabled = false,
  showAllOption = true,
  useIds = false,
}: CountryMultiSelectProps) {
  // Support both APIs: code-based (value) and ID-based (selectedCountryIds)
  const actualValue = useIds ? selectedCountryIds || [] : value || [];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [groupedCountries, setGroupedCountries] = useState<
    Record<string, Country[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedCountries = useRef(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    // Update selected countries when value changes
    if (countries.length > 0) {
      if (actualValue.length === 0) {
        setSelectedCountries([]);
      } else {
        const selected = countries.filter((c) =>
          useIds ? actualValue.includes(c.id) : actualValue.includes(c.code)
        );
        setSelectedCountries(selected);
      }
    }
  }, [value, selectedCountryIds, countries, useIds, actualValue]);

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

  const fetchCountries = async () => {
    // Only fetch countries once
    if (hasInitializedCountries.current) return;
    hasInitializedCountries.current = true;

    try {
      const response = await fetch("/api/countries");
      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries);
        setGroupedCountries(data.grouped);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCountry = (country: Country) => {
    const identifier = useIds ? country.id : country.code;
    const isSelected = actualValue.includes(identifier);
    if (isSelected) {
      // Remove from selection
      const newValue = actualValue.filter((id) => id !== identifier);
      onChange(newValue);
    } else {
      // Add to selection
      onChange([...actualValue, identifier]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setSearchTerm("");
  };

  const handleRemoveCountry = (e: React.MouseEvent, country: Country) => {
    e.stopPropagation();
    const identifier = useIds ? country.id : country.code;
    const newValue = actualValue.filter((id) => id !== identifier);
    onChange(newValue);
  };

  const filteredGroupedCountries = Object.entries(groupedCountries).reduce(
    (acc, [continent, countriesList]) => {
      const filtered = countriesList.filter((country) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          country.name.toLowerCase().includes(searchLower) ||
          country.code.toLowerCase().includes(searchLower) ||
          country.code3.toLowerCase().includes(searchLower) ||
          country.nativeName?.toLowerCase().includes(searchLower) ||
          country.numericCode?.toLowerCase().includes(searchLower) ||
          country.currency?.toLowerCase().includes(searchLower) ||
          country.languages?.toLowerCase().includes(searchLower)
        );
      });
      if (filtered.length > 0) {
        acc[continent] = filtered;
      }
      return acc;
    },
    {} as Record<string, Country[]>
  );

  const continentOrder = [
    "Africa",
    "Antarctica",
    "Asia",
    "Europe",
    "North America",
    "Oceania",
    "South America",
  ];

  const isAllSelected = actualValue.length === 0;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-400">
            {label}
          </label>
          {useIds && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onChange(countries.map((c) => c.id))}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                disabled={disabled}
              >
                Select All
              </button>
              <span className="text-gray-600">|</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                disabled={disabled}
              >
                Deselect All
              </button>
            </div>
          )}
        </div>
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
              Loading countries...
            </span>
          ) : isAllSelected ? (
            <span className="text-gray-500">All</span>
          ) : selectedCountries.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap min-h-[24px]">
              {selectedCountries.slice(0, 3).map((country) => (
                <span
                  key={country.code}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-900/40 text-primary-300 text-xs rounded-md"
                >
                  {country.name}
                  <span
                    onClick={(e) => handleRemoveCountry(e, country)}
                    className="hover:bg-primary-900/60 rounded-sm p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))}
              {selectedCountries.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{selectedCountries.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <div className="flex items-center space-x-1">
            {selectedCountries.length > 0 && !disabled && (
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
          <div className="absolute z-40 w-full mt-1 bg-[#1a1a1a] border border-dark-700 rounded-lg shadow-xl max-h-[400px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search input */}
            <div className="sticky top-0 p-3 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-dark-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search countries..."
                  className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-dark-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Countries list grouped by continent */}
            <div className="overflow-y-auto max-h-[320px] bg-[#1a1a1a]">
              {Object.keys(filteredGroupedCountries).length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No countries found
                </div>
              ) : (
                continentOrder
                  .filter((continent) => filteredGroupedCountries[continent])
                  .map((continent) => (
                    <div key={continent}>
                      <div className="sticky top-0 px-4 py-2 bg-[#252525]/90 backdrop-blur-sm text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-700/50">
                        {continent}
                      </div>
                      {filteredGroupedCountries[continent].map((country) => {
                        const identifier = useIds ? country.id : country.code;
                        const isSelected = actualValue.includes(identifier);
                        return (
                          <button
                            key={country.id}
                            type="button"
                            onClick={() => handleToggleCountry(country)}
                            className={`
                              w-full pl-6 pr-4 py-2 text-left hover:bg-[#252525]
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
                                {country.name}
                              </span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-gray-500 min-w-[2rem] text-right font-mono">
                                  {country.code}
                                </span>
                                {isSelected && (
                                  <span className="text-xs text-primary-400 w-4">
                                    ✓
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  );
}
