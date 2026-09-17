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

interface CountrySelectProps {
  label?: string;
  value?: string;
  onChange: (value: string, country?: Country) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export default function CountrySelect({
  label,
  value = "",
  onChange,
  placeholder = "Select a country",
  error,
  disabled = false,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [groupedCountries, setGroupedCountries] = useState<
    Record<string, Country[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedCountries = useRef(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    // Update selected country when value changes
    if (value && countries.length > 0) {
      const country = countries.find(
        (c) => c.id === value || c.code === value || c.code3 === value
      );
      setSelectedCountry(country || null);
    } else {
      setSelectedCountry(null);
    }
  }, [value, countries]);

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

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    onChange(country.id, country);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCountry(null);
    onChange("");
    setSearchTerm("");
  };

  const filteredGroupedCountries = Object.entries(
    groupedCountries || {}
  ).reduce((acc, [continent, countriesList]) => {
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
  }, {} as Record<string, Country[]>);

  const continentOrder = [
    "Africa",
    "Antarctica",
    "Asia",
    "Europe",
    "North America",
    "Oceania",
    "South America",
  ];

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
              Loading countries...
            </span>
          ) : selectedCountry ? (
            <span className="text-gray-200 truncate block pr-16">
              {selectedCountry.name}
              <span className="text-gray-500 ml-2 font-mono text-xs">
                ({selectedCountry.code})
              </span>
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <div className="flex items-center space-x-1">
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </div>
        </button>
        {selectedCountry && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-dark-500 rounded transition-colors z-10"
            type="button"
            aria-label="Clear country selection"
          >
            <X className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </button>
        )}

        {isOpen && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-dark-950 border border-dark-700 rounded-lg shadow-xl max-h-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search input */}
            <div className="sticky top-0 p-3 bg-dark-950/95 backdrop-blur-sm border-b border-dark-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for a country"
                  className="w-full pl-10 pr-4 py-2 bg-dark-950 border border-dark-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
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
                      {filteredGroupedCountries[continent].map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleSelect(country)}
                          className={`
                            w-full pl-6 pr-4 py-2 text-left hover:bg-[#252525]
                            transition-colors duration-100 border-b border-dark-800/30
                            ${
                              selectedCountry?.code === country.code
                                ? "bg-primary-900/40 text-primary-300 font-medium"
                                : "text-gray-200"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex-1 line-clamp-1 min-w-0 truncate">
                              {country.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2 font-mono min-w-8 text-right shrink-0">
                              {country.code}
                            </span>
                          </div>
                        </button>
                      ))}
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
