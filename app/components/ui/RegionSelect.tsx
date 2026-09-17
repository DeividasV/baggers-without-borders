"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, X, Search, Loader2 } from "lucide-react";

interface Region {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface RegionSelectProps {
  label?: string;
  value?: string;
  onChange: (value: string, region?: Region) => void;
  countryCode?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export default function RegionSelect({
  label,
  value = "",
  onChange,
  countryCode,
  placeholder = "Select a region",
  error,
  disabled = false,
}: RegionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastCountryCodeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (countryCode) {
      fetchRegions(countryCode);
    } else {
      setRegions([]);
      setSelectedRegion(null);
    }
  }, [countryCode]);

  useEffect(() => {
    // Update selected region when value changes
    if (value && regions.length > 0) {
      const region = regions.find((r) => r.id === value || r.code === value);
      setSelectedRegion(region || null);
    } else {
      setSelectedRegion(null);
    }
  }, [value, regions]);

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

  const fetchRegions = async (code: string) => {
    // Prevent duplicate fetches for the same country code
    if (lastCountryCodeRef.current === code) return;
    lastCountryCodeRef.current = code;

    setLoading(true);
    try {
      const response = await fetch(`/api/regions?countryCode=${code}`);
      if (response.ok) {
        const data = await response.json();
        setRegions(data.regions || []);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
      setRegions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (region: Region) => {
    setSelectedRegion(region);
    onChange(region.id, region);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRegion(null);
    onChange("");
    setSearchTerm("");
  };

  const filteredRegions = regions.filter((region) =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isDisabled = disabled || !countryCode || loading;

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
              Loading regions...
            </span>
          ) : !countryCode ? (
            <span className="text-gray-500">Select a country first</span>
          ) : regions.length === 0 ? (
            <span className="text-gray-500">No regions available</span>
          ) : selectedRegion ? (
            <span className="text-gray-200 pr-16">{selectedRegion.name}</span>
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
        {selectedRegion && !isDisabled && (
          <button
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-dark-500 rounded transition-colors z-10"
            type="button"
            aria-label="Clear region selection"
          >
            <X className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </button>
        )}

        {isOpen && !loading && regions.length > 0 && (
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
                  placeholder="Search regions..."
                  className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-dark-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Regions list */}
            <div className="overflow-y-auto max-h-[320px] bg-[#1a1a1a]">
              {filteredRegions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No regions found
                </div>
              ) : (
                filteredRegions.map((region) => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => handleSelect(region)}
                    className={`
                      w-full px-4 py-2 text-left hover:bg-[#252525]
                      transition-colors duration-100 flex items-center justify-between
                      border-b border-dark-800/30
                      ${
                        selectedRegion?.id === region.id
                          ? "bg-primary-900/40 text-primary-300 font-medium"
                          : "text-gray-200"
                      }
                    `}
                  >
                    <span>{region.name}</span>
                    <span className="text-xs text-gray-500 capitalize">
                      {region.type}
                    </span>
                  </button>
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
