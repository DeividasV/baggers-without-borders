"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Shield } from "lucide-react";

interface RoleSelectProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

const ROLE_OPTIONS = [
  { value: "", label: "All" },
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
];

export default function RoleSelect({
  label,
  value,
  onChange,
  placeholder = "Select role",
  required = false,
  error,
}: RoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedRole = ROLE_OPTIONS.find((r) => r.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleSelect = (roleValue: string) => {
    onChange(roleValue);
    setIsOpen(false);
    inputRef.current?.blur();
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
          value={selectedRole ? selectedRole.label : ""}
          onClick={() => setIsOpen(!isOpen)}
          placeholder={placeholder}
          readOnly
          className={`
            w-full px-4 py-2 pr-10
            bg-[#1a1a1a] border rounded-lg
            placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all cursor-pointer
            ${error ? "border-red-500" : "border-[#4f4f4f]"}
            ${
              selectedRole && selectedRole.value !== ""
                ? "text-gray-200"
                : "text-gray-500"
            }
          `}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label={isOpen ? "Close role picker" : "Open role picker"}
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
            <div className="py-1">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleSelect(role.value)}
                  className={`
                    w-full px-4 py-2 text-left transition-colors flex items-center space-x-2
                    border-b border-dark-800/30
                    ${
                      role.value === value
                        ? "bg-primary-900/40 text-primary-300 font-medium"
                        : "text-gray-200 hover:bg-[#252525]"
                    }
                  `}
                >
                  <span>{role.label}</span>
                  {role.value === value && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
