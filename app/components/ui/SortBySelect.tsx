"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface SortBySelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const OPTIONS = [
  { value: "givenName", label: "Given Name" },
  { value: "familyName", label: "Family Name" },
  { value: "email", label: "Email" },
  { value: "residenceCountry", label: "Residence" },
  { value: "forumJoinDate", label: "Member Since" },
  { value: "status", label: "Status" },
  { value: "createdAt", label: "Creation Date" },
  { value: "updatedAt", label: "Update Date" },
];

export default function SortBySelect({
  label,
  value,
  onChange,
  disabled = false,
}: SortBySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    OPTIONS.find((opt) => opt.value === value) || OPTIONS[0],
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const option = OPTIONS.find((opt) => opt.value === value);
    if (option) {
      setSelectedOption(option);
    } else {
      setSelectedOption(OPTIONS[0]); // Default to "Given Name"
    }
  }, [value]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: (typeof OPTIONS)[0]) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
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
          onClick={() => setIsOpen(!isOpen)}
          style={{ backgroundColor: isOpen ? "#252525" : "#1a1a1a" }}
          className={`
            w-full px-4 py-2 text-left
            border rounded-lg
            flex items-center justify-between
            transition-all duration-150
            hover:border-dark-600 cursor-pointer
            border-dark-700
            ${isOpen ? "ring-2 ring-primary-500/50 border-primary-500" : ""}
          `}
        >
          <span
            className={
              selectedOption.value === "givenName"
                ? "text-gray-500"
                : "text-gray-200"
            }
          >
            {selectedOption.label}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-40 w-full mt-1 bg-[#1a1a1a] border border-dark-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="overflow-y-auto max-h-[240px]">
              {OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full px-4 py-2 text-left hover:bg-[#252525]
                    transition-colors duration-100 border-b border-dark-800/30
                    ${
                      value === option.value
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
    </div>
  );
}
