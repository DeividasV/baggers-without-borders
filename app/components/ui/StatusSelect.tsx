"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, User } from "lucide-react";

interface StatusSelectProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "NEW", label: "New" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function StatusSelect({
  label,
  value,
  onChange,
  placeholder = "Select status",
  required = false,
  error,
}: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === value);

  // Filter statuses based on search
  const filteredStatuses = searchTerm
    ? STATUS_OPTIONS.filter((status) =>
        status.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : STATUS_OPTIONS;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusSelect = (statusValue: string) => {
    onChange(statusValue);
    setSearchTerm("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && filteredStatuses.length > 0) {
      handleStatusSelect(filteredStatuses[0].value);
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
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
        <input
          ref={inputRef}
          type="text"
          value={searchTerm || (selectedStatus ? selectedStatus.label : "")}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          readOnly={!isOpen}
          className={`
            w-full px-4 py-2 pr-20
            bg-[#1a1a1a] border rounded-lg
            placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all cursor-pointer
            ${error ? "border-red-500" : "border-[#4f4f4f]"}
            ${
              selectedStatus && selectedStatus.value !== ""
                ? "text-gray-200"
                : "text-gray-500"
            }
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
          aria-label={isOpen ? "Close status picker" : "Open status picker"}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-40 w-full mt-1 bg-[#1a1a1a] border border-dark-700 rounded-lg shadow-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {filteredStatuses.length > 0 ? (
                <div className="py-1">
                  {filteredStatuses.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => handleStatusSelect(status.value)}
                      className={`
                        w-full px-4 py-2 text-left transition-colors flex items-center space-x-2
                        border-b border-dark-800/30
                        ${
                          status.value === value
                            ? "bg-primary-900/40 text-primary-300 font-medium"
                            : "text-gray-200 hover:bg-[#252525]"
                        }
                      `}
                    >
                      <span>{status.label}</span>
                      {status.value === value && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No statuses found
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
