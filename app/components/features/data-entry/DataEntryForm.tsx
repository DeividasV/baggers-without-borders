"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { X, Trash2, AlertTriangle, User, Settings } from "lucide-react";
import Button from "@/ui/Button";
import SearchableSelect from "@/ui/SearchableSelect";
import ConfirmationDialog from "@/ui/ConfirmationDialog";

type HofEntry = {
  id: string;
  memberId: string;
  hofId: string;
  yearId: string;
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  foreignPeaksInYear: number;
  member: {
    id: string;
    username: string;
    displayName: string;
  };
  hof: {
    id: string;
    code: string;
    title: string;
  };
  year: {
    id: string;
    code: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
};

type Member = {
  id: string;
  username: string;
  displayName: string;
};

type Hof = {
  id: string;
  code: string;
  title: string;
};

type Year = {
  id: string;
  code: string;
  title: string;
};

interface HofEntryFormProps {
  mode: "create" | "edit";
  entryId?: string;
}

export default function DataEntryForm({
  mode = "create",
  entryId,
}: HofEntryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [existingEntry, setExistingEntry] = useState<HofEntry | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [hofs, setHofs] = useState<Hof[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [formData, setFormData] = useState({
    memberId: "",
    hofId: "",
    yearId: "",
    peaksInYear: 0,
    foreignPeaksInYear: 0,
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const hasInitialized = useRef(false);

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.memberId) {
      newErrors.memberId = "Member is required.";
    }

    if (!formData.hofId) {
      newErrors.hofId = "Hall of Fame is required.";
    }

    if (!formData.yearId) {
      newErrors.yearId = "Year is required.";
    }

    if (formData.peaksInYear < 0) {
      newErrors.peaksInYear = "Peaks in year cannot be negative.";
    }

    if (formData.foreignPeaksInYear < 0) {
      newErrors.foreignPeaksInYear = "Foreign peaks cannot be negative.";
    }

    // Validate that foreign peaks don't exceed total peaks in year
    if (formData.foreignPeaksInYear > formData.peaksInYear) {
      newErrors.foreignPeaksInYear =
        "Foreign peaks cannot exceed peaks in year.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mark field as touched
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  useEffect(() => {
    // Only fetch once on mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    fetchReferenceData();
    if (mode === "edit" && entryId) {
      fetchEntry(entryId);
    }
  }, []); // Empty dependency array - only run once on mount

  const fetchReferenceData = async () => {
    try {
      // In create mode, only fetch active HOFs and Years
      // In edit mode, fetch all to display the current values even if inactive
      const activeOnlyParam = mode === "create" ? "?activeOnly=true" : "";

      const [membersRes, hofsRes, yearsRes] = await Promise.all([
        fetch("/api/users?limit=1000"), // Get all users for dropdown
        fetch(`/api/hofs${activeOnlyParam}`),
        fetch(`/api/years${activeOnlyParam}`),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        // API returns { users: [...], pagination: {...}, stats: {...} }
        setMembers(membersData.users || []);
      }

      if (hofsRes.ok) {
        const hofsData = await hofsRes.json();
        setHofs(hofsData);
      }

      if (yearsRes.ok) {
        const yearsData = await yearsRes.json();
        setYears(yearsData);
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  const fetchEntry = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hof-entries/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExistingEntry(data);
        setFormData({
          memberId: data.memberId,
          hofId: data.hofId,
          yearId: data.yearId,
          peaksInYear: data.peaksInYear,
          foreignPeaksInYear: data.foreignPeaksInYear,
        });
      } else {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/data-entry");
      }
    } catch (error) {
      console.error("Error fetching entry:", error);
      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/admin/data-entry");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      memberId: true,
      hofId: true,
      yearId: true,
      peaksInYear: true,
      foreignPeaksInYear: true,
    });

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const url =
        mode === "create" ? "/api/hof-entries" : `/api/hof-entries/${entryId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          const returnTo = searchParams.get("returnTo");
          router.push(returnTo || "/admin/data-entry");
        }, 1500);
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Failed to save entry" });
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      setErrors({ submit: "An error occurred while saving" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entryId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/hof-entries/${entryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/data-entry");
      } else {
        setErrors({ submit: "Failed to delete entry" });
        setShowDeleteConfirmation(false);
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      setErrors({ submit: "An error occurred while deleting" });
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    const returnTo = searchParams.get("returnTo");
    router.push(returnTo || "/admin/data-entry");
  };

  if (loading && mode === "edit") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primary-400">Loading entry...</div>
      </div>
    );
  }

  const pageTitle = mode === "create" ? "Create HOF Entry" : "Edit HOF Entry";
  const headerLinkButtonClasses =
    "font-medium rounded-lg transition-all duration-200 inline-flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed bg-dark-700 hover:bg-dark-600 text-gray-100 border border-dark-600 hover:border-dark-500 px-3 py-2 text-sm";

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-primary-400">
                {pageTitle}
              </h2>
              <p className="text-sm text-gray-400">
                {mode === "create"
                  ? "Add a new Hall of Fame entry"
                  : "Update entry details"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {mode === "edit" && existingEntry && (
                <>
                  <Link
                    href={`/admin/members/${
                      existingEntry.member.id
                    }?returnTo=${encodeURIComponent(
                      window.location.pathname + window.location.search,
                    )}`}
                    className={headerLinkButtonClasses}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Member</span>
                  </Link>
                  <Link
                    href={`/admin/configuration?hofId=${existingEntry.hof.id}&yearId=${existingEntry.year.id}&sortBy=hof.code&sortOrder=asc`}
                    className={headerLinkButtonClasses}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Config</span>
                  </Link>
                </>
              )}
              {mode === "edit" && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirmation(true)}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  const form = document.querySelector("form");
                  if (form) {
                    form.dispatchEvent(
                      new Event("submit", { cancelable: true, bubbles: true }),
                    );
                  }
                }}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="card bg-green-900/20 border-green-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-green-400 font-medium">
                Entry {mode === "create" ? "created" : "updated"} successfully!
                Redirecting...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="card bg-red-900/20 border-red-700/50">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <p className="text-red-400">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Member Selection */}
          {mode === "edit" && existingEntry ? (
            <div>
              <div className="block text-sm font-medium text-gray-300 mb-2">
                Member <span className="text-red-400">*</span>
              </div>
              <div className="bg-dark-700 border border-dark-600 rounded-lg p-3">
                <div className="text-white font-medium">
                  {existingEntry.member.displayName}
                </div>
                <div className="text-sm text-gray-400">
                  @{existingEntry.member.username}
                </div>
              </div>
            </div>
          ) : (
            <SearchableSelect
              label="Member"
              value={formData.memberId}
              onChange={(value) =>
                setFormData({ ...formData, memberId: value })
              }
              options={members.map((member) => ({
                id: member.id,
                label: member.displayName,
                subtitle: `@${member.username}`,
              }))}
              placeholder="Select a member"
              error={touched.memberId ? errors.memberId : undefined}
              disabled={loading}
              required
            />
          )}

          {/* HOF and Year Selection - Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mode === "edit" && existingEntry ? (
              <div>
                <div className="block text-sm font-medium text-gray-300 mb-2">
                  Hall of Fame <span className="text-red-400">*</span>
                </div>
                <div className="bg-dark-700 border border-dark-600 rounded-lg p-3">
                  <div className="text-white font-medium">
                    {existingEntry.hof.code}
                  </div>
                  <div className="text-sm text-gray-400">
                    {existingEntry.hof.title}
                  </div>
                </div>
              </div>
            ) : (
              <SearchableSelect
                label="Hall of Fame"
                value={formData.hofId}
                onChange={(value) => setFormData({ ...formData, hofId: value })}
                options={hofs.map((hof) => ({
                  id: hof.id,
                  label: hof.title,
                  subtitle: hof.code,
                }))}
                placeholder="Select a Hall of Fame"
                error={touched.hofId ? errors.hofId : undefined}
                disabled={loading}
                required
              />
            )}

            {mode === "edit" && existingEntry ? (
              <div>
                <div className="block text-sm font-medium text-gray-300 mb-2">
                  Year <span className="text-red-400">*</span>
                </div>
                <div className="bg-dark-700 border border-dark-600 rounded-lg p-3">
                  <div className="text-white font-medium">
                    {existingEntry.year.code}
                  </div>
                  <div className="text-sm text-gray-400">
                    {existingEntry.year.title}
                  </div>
                </div>
              </div>
            ) : (
              <SearchableSelect
                label="Year"
                value={formData.yearId}
                onChange={(value) =>
                  setFormData({ ...formData, yearId: value })
                }
                options={years.map((year) => ({
                  id: year.id,
                  label: year.title,
                  subtitle: year.code,
                }))}
                placeholder="Select a year"
                error={touched.yearId ? errors.yearId : undefined}
                disabled={loading}
                required
              />
            )}
          </div>

          {/* Statistics - Two columns for input, two columns for calculated */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Peaks in Year */}
            <div>
              <label
                htmlFor="peaksInYear"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Peaks in Year
              </label>
              <input
                type="number"
                id="peaksInYear"
                value={formData.peaksInYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    peaksInYear: parseInt(e.target.value) || 0,
                  })
                }
                onBlur={() => handleBlur("peaksInYear")}
                disabled={loading}
                min="0"
                className={`input-field w-full ${
                  touched.peaksInYear && errors.peaksInYear
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Peaks climbed during this specific year only
              </p>
              {touched.peaksInYear && errors.peaksInYear && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.peaksInYear}
                </p>
              )}
            </div>

            {/* Foreign Peaks in Year */}
            <div>
              <label
                htmlFor="foreignPeaksInYear"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Foreign in Year
              </label>
              <input
                type="number"
                id="foreignPeaksInYear"
                value={formData.foreignPeaksInYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    foreignPeaksInYear: parseInt(e.target.value) || 0,
                  })
                }
                onBlur={() => handleBlur("foreignPeaksInYear")}
                disabled={loading}
                min="0"
                className={`input-field w-full ${
                  touched.foreignPeaksInYear && errors.foreignPeaksInYear
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Foreign peaks climbed during this specific year only
              </p>
              {touched.foreignPeaksInYear && errors.foreignPeaksInYear && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.foreignPeaksInYear}
                </p>
              )}
            </div>

            {/* Total Peaks (Read-only) */}
            <div>
              <div className="block text-sm font-medium text-gray-300 mb-2">
                Total Peaks
              </div>
              <div className="bg-dark-700 border border-dark-600 rounded-lg p-3 h-[42px] flex items-center">
                <span className="text-white text-lg font-bold">
                  {existingEntry
                    ? existingEntry.totalPeaks
                    : "Will be calculated"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Cumulative total (calculated automatically)
              </p>
            </div>

            {/* Total Foreign Peaks (Read-only) */}
            <div>
              <div className="block text-sm font-medium text-gray-300 mb-2">
                Total Foreign Peaks
              </div>
              <div className="bg-dark-700 border border-dark-600 rounded-lg p-3 h-[42px] flex items-center">
                <span className="text-white text-lg font-bold">
                  {existingEntry
                    ? existingEntry.foreignPeaks
                    : "Will be calculated"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Cumulative foreign total (calculated automatically)
              </p>
            </div>
          </div>

          {/* Additional calculated fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Empty spacers */}
            <div></div>
            <div></div>

            {/* FPR (Read-only) - Below Total Peaks */}
            <div>
              <div className="block text-sm font-medium text-gray-300 mb-2">
                Foreign Peak Ratio (FPR)
              </div>
              <div className="bg-dark-700 border border-dark-600 rounded-lg p-3 h-[42px] flex items-center">
                <span className="text-white text-lg font-bold">
                  {formData.peaksInYear > 0
                    ? `${(
                        (formData.foreignPeaksInYear / formData.peaksInYear) *
                        100
                      ).toFixed(1)}%`
                    : "0.0%"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Foreign peaks / peaks in year
              </p>
            </div>

            {/* Domestic Peaks (Read-only) - Below Total Foreign Peaks */}
            <div>
              <div className="block text-sm font-medium text-gray-300 mb-2">
                Domestic Peaks
              </div>
              <div className="bg-dark-700 border border-dark-600 rounded-lg p-3 h-[42px] flex items-center">
                <span className="text-white text-lg font-bold">
                  {Math.max(
                    0,
                    formData.peaksInYear - formData.foreignPeaksInYear,
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Peaks in year - foreign peaks
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
