"use client";

import { LogsFilters as FiltersType } from "./LogsManagement";
import { Button } from "@/components/ui";
import SearchableSelect from "@/ui/SearchableSelect";
import DatePicker from "@/ui/DatePicker";

interface LogFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: Partial<FiltersType>) => void;
  onClear: () => void;
  users: Array<{ id: string; displayName: string }>;
  countries: Array<{ code: string; name: string }>;
}

const EVENT_TYPES = [
  { id: "AUTH_LOGIN_SUCCESS", label: "Login Success (Auth)", subtitle: "" },
  { id: "AUTH_LOGIN_FAILED", label: "Login Failed (Auth)", subtitle: "" },
  {
    id: "AUTH_REGISTER_SUCCESS",
    label: "Registration Success (Auth)",
    subtitle: "",
  },
  {
    id: "AUTH_REGISTER_FAILED",
    label: "Registration Failed (Auth)",
    subtitle: "",
  },
  {
    id: "AUTH_PASSWORD_RESET_REQUEST_SUCCESS",
    label: "Password Reset Request (Auth)",
    subtitle: "",
  },
  {
    id: "AUTH_PASSWORD_RESET_REQUEST_FAILED",
    label: "Password Reset Failed (Auth)",
    subtitle: "",
  },
  {
    id: "AUTH_PASSWORD_RESET_COMPLETE_SUCCESS",
    label: "Password Reset Complete (Auth)",
    subtitle: "",
  },
  {
    id: "AUTH_PASSWORD_RESET_COMPLETE_FAILED",
    label: "Password Reset Completion Failed (Auth)",
    subtitle: "",
  },
  {
    id: "AUTH_EMAIL_VERIFY_SUCCESS",
    label: "Email Verification Success (Auth)",
    subtitle: "",
  },
  {
    id: "AUTH_EMAIL_VERIFY_FAILED",
    label: "Email Verification Failed (Auth)",
    subtitle: "",
  },
  {
    id: "AUTH_RESEND_VERIFY_SUCCESS",
    label: "Resend Verification Success (Auth)",
    subtitle: "",
  },
  {
    id: "AUTH_RESEND_VERIFY_FAILED",
    label: "Resend Verification Failed (Auth)",
    subtitle: "",
  },
  { id: "AUTH_PASSWORD_CHANGE", label: "Password Change (Auth)", subtitle: "" },
  { id: "AUTH_EMAIL_CHANGE", label: "Email Change (Auth)", subtitle: "" },
  { id: "USER_ROLE_ESCALATION", label: "Role Escalation (User)", subtitle: "" },
  { id: "ADMIN_USER_CREATE", label: "User Create (Admin)", subtitle: "" },
  { id: "ADMIN_USER_UPDATE", label: "User Update (Admin)", subtitle: "" },
  { id: "ADMIN_USER_DELETE", label: "User Delete (Admin)", subtitle: "" },
  {
    id: "ADMIN_DOCUMENT_CREATE",
    label: "Document Create (Admin)",
    subtitle: "",
  },
  {
    id: "ADMIN_DOCUMENT_UPDATE",
    label: "Document Update (Admin)",
    subtitle: "",
  },
  {
    id: "ADMIN_DOCUMENT_DELETE",
    label: "Document Delete (Admin)",
    subtitle: "",
  },
  {
    id: "ADMIN_DOCUMENT_UPLOAD",
    label: "Document Upload (Admin)",
    subtitle: "",
  },
  { id: "ADMIN_HOF_CREATE", label: "HoF Create (Admin)", subtitle: "" },
  { id: "ADMIN_HOF_UPDATE", label: "HoF Update (Admin)", subtitle: "" },
  { id: "ADMIN_HOF_DELETE", label: "HoF Delete (Admin)", subtitle: "" },
  { id: "ADMIN_YEAR_CREATE", label: "Year Create (Admin)", subtitle: "" },
  { id: "ADMIN_YEAR_UPDATE", label: "Year Update (Admin)", subtitle: "" },
  { id: "ADMIN_YEAR_DELETE", label: "Year Delete (Admin)", subtitle: "" },
];

export default function LogFilters({
  filters,
  onFiltersChange,
  onClear,
  users,
  countries,
}: LogFiltersProps) {
  const hasActiveFilters =
    !!filters.eventType ||
    !!filters.userId ||
    !!filters.status ||
    !!filters.ipCountry ||
    !!filters.dateFrom ||
    !!filters.dateTo;

  return (
    <div className="card bg-dark-800 border border-dark-600 p-6">
      <div className="space-y-4">
        {/* Three Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Event Type - Searchable Select */}
          <SearchableSelect
            label="Event Type"
            value={filters.eventType || ""}
            onChange={(value) => {
              onFiltersChange({ eventType: value });
            }}
            options={[{ id: "", label: "All", subtitle: "" }, ...EVENT_TYPES]}
            placeholder="All"
          />

          {/* User - Searchable Select */}
          <SearchableSelect
            label="User"
            value={filters.userId || ""}
            onChange={(value) => {
              onFiltersChange({ userId: value || "" });
            }}
            options={[
              { id: "", label: "All", subtitle: "" },
              {
                id: "anonymous",
                label: "Anonymous (Unauthenticated)",
                subtitle: "",
              },
              ...users.map((user) => ({
                id: user.id,
                label: user.displayName,
                subtitle: "",
              })),
            ]}
            placeholder="All"
          />

          {/* Status */}
          <SearchableSelect
            label="Status"
            value={filters.status || ""}
            onChange={(value) => {
              onFiltersChange({ status: value || "" });
            }}
            options={[
              { id: "", label: "All", subtitle: "" },
              { id: "SUCCESS", label: "Success", subtitle: "" },
              { id: "FAILURE", label: "Failure", subtitle: "" },
            ]}
            placeholder="All"
          />
        </div>

        {/* Three Column Grid for Country and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Country */}
          <SearchableSelect
            label="Country"
            value={filters.ipCountry || ""}
            onChange={(value) => {
              onFiltersChange({ ipCountry: value || "" });
            }}
            options={[
              { id: "", label: "All", subtitle: "" },
              { id: "XX", label: "Unknown (XX)", subtitle: "" },
              ...countries.map((country) => ({
                id: country.code,
                label: `${country.name} (${country.code})`,
                subtitle: "",
              })),
            ]}
            placeholder="All"
          />

          {/* Date From */}
          <DatePicker
            label="Date From"
            value={filters.dateFrom}
            onChange={(value) => onFiltersChange({ dateFrom: value })}
            placeholder="Select start date"
          />

          {/* Date To */}
          <DatePicker
            label="Date To"
            value={filters.dateTo}
            onChange={(value) => onFiltersChange({ dateTo: value })}
            placeholder="Select end date"
          />
        </div>

        {/* Info and Clear Button */}
        <div className="flex justify-between items-center gap-2 pt-2">
          <div className="text-xs text-gray-400">
            {hasActiveFilters && (
              <>
                <span className="font-medium text-gray-300">
                  Active filters:{" "}
                </span>
                {[
                  filters.eventType && "Event Type",
                  filters.userId && "User",
                  filters.status && "Status",
                  filters.ipCountry && "Country",
                  (filters.dateFrom || filters.dateTo) && "Date Range",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </>
            )}
          </div>
          <Button
            onClick={onClear}
            variant="secondary"
            className="text-sm"
            disabled={!hasActiveFilters}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
