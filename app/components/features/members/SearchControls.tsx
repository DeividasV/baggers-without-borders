import { X } from "lucide-react";
import Card from "@/ui/Card";
import Button from "@/ui/Button";
import Input from "@/ui/Input";
import Switch from "@/ui/Switch";
import GenderSelect from "@/ui/GenderSelect";
import YearRangePicker from "@/ui/YearRangePicker";
import CountryMultiSelect from "@/ui/CountryMultiSelect";
import DateRangePicker from "@/ui/DateRangePicker";
import RoleSelect from "@/ui/RoleSelect";
import StatusSelect from "@/ui/StatusSelect";
import ShowPerPageSelect from "@/ui/ShowPerPageSelect";
import SortBySelect from "@/ui/SortBySelect";
import SortDirectionSelect from "@/ui/SortDirectionSelect";
import SearchInput from "@/ui/SearchInput";
import {
  AdvancedFilters,
  SearchMode,
  Pagination,
} from "@/src/types/user-management";

interface SearchControlsProps {
  searchMode: SearchMode;
  basicSearch: string;
  advancedFilters: AdvancedFilters;
  pagination: Pagination;
  filtering: boolean;
  displayedCount: number;
  onSearchModeChange: (mode: SearchMode) => void;
  onBasicSearchChange: (value: string) => void;
  onAdvancedFilterChange: (updates: Partial<AdvancedFilters>) => void;
  onClearBasicSearch: () => void;
  onClearAdvancedFilters: () => void;
  onPageSizeChange: (newSize: number) => void;
}

export default function SearchControls({
  searchMode,
  basicSearch,
  advancedFilters,
  pagination,
  filtering,
  displayedCount,
  onSearchModeChange,
  onBasicSearchChange,
  onAdvancedFilterChange,
  onClearBasicSearch,
  onClearAdvancedFilters,
  onPageSizeChange,
}: SearchControlsProps) {
  const hasActiveAdvancedFilters = Object.entries(advancedFilters).some(
    ([key, value]) => {
      if (key === "sortBy" || key === "sortOrder") {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === "boolean") {
        return value === true;
      }
      return value !== "";
    },
  );

  const getSortByLabel = (sortBy: string) => {
    switch (sortBy) {
      case "givenName":
        return "Given Name";
      case "familyName":
        return "Family Name";
      case "email":
        return "Email";
      case "createdAt":
        return "Date Created";
      case "updatedAt":
        return "Date Updated";
      default:
        return sortBy;
    }
  };

  return (
    <div className="relative">
      {/* Tab Labels on Border */}
      <div className="absolute -top-4 left-4 flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={() => onSearchModeChange("simple")}
          className={`text-sm font-medium transition-all duration-200 px-4 py-1.5 rounded-full border ${
            searchMode === "simple"
              ? "bg-primary-900 text-primary-400 border-primary-700"
              : "bg-dark-800 text-gray-400 border-dark-600 hover:border-dark-500 hover:text-gray-300"
          }`}
        >
          Basic
          {searchMode === "simple" && basicSearch.trim() !== "" && (
            <span className="ml-1.5 text-xs">●</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onSearchModeChange("advanced")}
          className={`text-sm font-medium transition-all duration-200 px-4 py-1.5 rounded-full border ${
            searchMode === "advanced"
              ? "bg-primary-900 text-primary-400 border-primary-700"
              : "bg-dark-800 text-gray-400 border-dark-600 hover:border-dark-500 hover:text-gray-300"
          }`}
        >
          Advanced
          {searchMode === "advanced" && hasActiveAdvancedFilters && (
            <span className="ml-1.5 text-xs">
              (
              {
                Object.entries(advancedFilters).filter(([key, v]) =>
                  Array.isArray(v) ? v.length > 0 : v !== "",
                ).length
              }
              )
            </span>
          )}
        </button>
      </div>

      <Card className="bg-dark-800 border-dark-700">
        {/* Basic Search Mode */}
        {searchMode === "simple" && (
          <div className="space-y-3">
            <div className="relative">
              <SearchInput
                placeholder="Search by username, name, email, location, etc..."
                value={basicSearch}
                onChange={(e) => onBasicSearchChange(e.target.value)}
              />
              {filtering && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            {basicSearch.trim() !== "" && (
              <p className="text-xs text-gray-400">
                Searching across all member fields...
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center gap-2 pt-2">
              <div className="text-xs text-gray-400">
                {pagination.totalCount > 0 && (
                  <>
                    <span className="font-medium text-gray-300">
                      {pagination.totalCount}
                    </span>{" "}
                    {pagination.totalCount === 1 ? "record" : "records"} •{" "}
                    <span className="font-medium text-gray-300">
                      {displayedCount}
                    </span>{" "}
                    displayed
                    {advancedFilters.sortBy && (
                      <>
                        {" "}
                        • Sorted by:{" "}
                        <span className="font-medium text-gray-300">
                          {getSortByLabel(advancedFilters.sortBy)}
                        </span>{" "}
                        ({advancedFilters.sortOrder === "asc" ? "↑" : "↓"})
                      </>
                    )}
                  </>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClearBasicSearch}
                icon={<X className="h-4 w-4" />}
                disabled={basicSearch.trim() === ""}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Advanced Filters Mode */}
        {searchMode === "advanced" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Row 1: Given Name, Family Name, Gender */}
              <Input
                label="Given Name"
                type="text"
                placeholder="Filter by given name"
                value={advancedFilters.givenName}
                onChange={(e) =>
                  onAdvancedFilterChange({ givenName: e.target.value })
                }
              />

              <Input
                label="Family Name"
                type="text"
                placeholder="Filter by family name"
                value={advancedFilters.familyName}
                onChange={(e) =>
                  onAdvancedFilterChange({ familyName: e.target.value })
                }
              />

              <GenderSelect
                label="Gender"
                value={advancedFilters.gender}
                onChange={(value) => onAdvancedFilterChange({ gender: value })}
              />

              {/* Row 2: Residence Country, Birth Country, Birth Year */}
              <CountryMultiSelect
                label="Residence Country"
                value={advancedFilters.residenceCountry}
                onChange={(countries) =>
                  onAdvancedFilterChange({ residenceCountry: countries })
                }
                placeholder="Select residence countries"
                showAllOption={true}
              />

              <CountryMultiSelect
                label="Birth Country"
                value={advancedFilters.birthCountry}
                onChange={(countries) =>
                  onAdvancedFilterChange({ birthCountry: countries })
                }
                placeholder="Select birth countries"
                showAllOption={true}
              />

              <YearRangePicker
                label="Birth Year"
                fromValue={
                  advancedFilters.birthYearMin
                    ? parseInt(advancedFilters.birthYearMin)
                    : undefined
                }
                toValue={
                  advancedFilters.birthYearMax
                    ? parseInt(advancedFilters.birthYearMax)
                    : undefined
                }
                onFromChange={(year) =>
                  onAdvancedFilterChange({
                    birthYearMin: year?.toString() || "",
                  })
                }
                onToChange={(year) =>
                  onAdvancedFilterChange({
                    birthYearMax: year?.toString() || "",
                  })
                }
                fromPlaceholder="From (e.g., 1980)"
                toPlaceholder="To (e.g., 2000)"
                minYear={1900}
                maxYear={new Date().getFullYear()}
              />

              {/* Row 3: Email, Forum Nickname, Role */}
              <Input
                label="Email"
                type="text"
                placeholder="Filter by email"
                value={advancedFilters.email}
                onChange={(e) =>
                  onAdvancedFilterChange({ email: e.target.value })
                }
              />

              <Input
                label="Forum Nickname"
                type="text"
                placeholder="Filter by forum nickname"
                value={advancedFilters.forumNickname}
                onChange={(e) =>
                  onAdvancedFilterChange({
                    forumNickname: e.target.value,
                  })
                }
              />

              <div className="grid grid-cols-2 gap-2">
                <RoleSelect
                  label="Role"
                  value={advancedFilters.role}
                  onChange={(value) => onAdvancedFilterChange({ role: value })}
                />

                <StatusSelect
                  label="Status"
                  value={advancedFilters.status}
                  onChange={(value) =>
                    onAdvancedFilterChange({ status: value })
                  }
                />
              </div>

              {/* Row 3.5: Retired/Deceased Switches */}
              <div className="grid grid-cols-2 gap-4">
                <Switch
                  checked={advancedFilters.showRetired}
                  onChange={(checked) =>
                    onAdvancedFilterChange({ showRetired: checked })
                  }
                  label="Retired"
                />

                <Switch
                  checked={advancedFilters.showDeceased}
                  onChange={(checked) =>
                    onAdvancedFilterChange({ showDeceased: checked })
                  }
                  label="Deceased"
                />
              </div>

              {/* Row 4: Notes, Created Date Range, Updated Date Range */}
              <Input
                label="Notes"
                type="text"
                placeholder="Filter by notes content"
                value={advancedFilters.notes}
                onChange={(e) =>
                  onAdvancedFilterChange({ notes: e.target.value })
                }
              />

              <DateRangePicker
                label="Created"
                fromValue={advancedFilters.createdDateFrom}
                toValue={advancedFilters.createdDateTo}
                onFromChange={(value) =>
                  onAdvancedFilterChange({ createdDateFrom: value })
                }
                onToChange={(value) =>
                  onAdvancedFilterChange({ createdDateTo: value })
                }
                fromPlaceholder="Start date"
                toPlaceholder="End date"
              />

              <DateRangePicker
                label="Updated"
                fromValue={advancedFilters.updatedDateFrom}
                toValue={advancedFilters.updatedDateTo}
                onFromChange={(value) =>
                  onAdvancedFilterChange({ updatedDateFrom: value })
                }
                onToChange={(value) =>
                  onAdvancedFilterChange({ updatedDateTo: value })
                }
                fromPlaceholder="Start date"
                toPlaceholder="End date"
              />

              {/* Row 5: Show, Sort By + Sort Direction (combined in 1 column) */}
              <ShowPerPageSelect
                label="Show"
                value={pagination.limit}
                onChange={onPageSizeChange}
              />

              <div className="grid grid-cols-2 gap-2">
                <SortBySelect
                  label="Sort By"
                  value={advancedFilters.sortBy}
                  onChange={(value) =>
                    onAdvancedFilterChange({ sortBy: value })
                  }
                />

                <SortDirectionSelect
                  label="Sort Direction"
                  value={advancedFilters.sortOrder}
                  onChange={(value) =>
                    onAdvancedFilterChange({ sortOrder: value })
                  }
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center gap-2 pt-2">
              <div className="text-xs text-gray-400">
                {pagination.totalCount > 0 && (
                  <>
                    <span className="font-medium text-gray-300">
                      {pagination.totalCount}
                    </span>{" "}
                    {pagination.totalCount === 1 ? "record" : "records"} •{" "}
                    <span className="font-medium text-gray-300">
                      {displayedCount}
                    </span>{" "}
                    displayed
                    {advancedFilters.sortBy && (
                      <>
                        {" "}
                        • Sorted by:{" "}
                        <span className="font-medium text-gray-300">
                          {getSortByLabel(advancedFilters.sortBy)}
                        </span>{" "}
                        ({advancedFilters.sortOrder === "asc" ? "↑" : "↓"})
                      </>
                    )}
                  </>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClearAdvancedFilters}
                icon={<X className="h-4 w-4" />}
                disabled={!hasActiveAdvancedFilters}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
