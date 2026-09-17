"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Trash2, AlertTriangle, Settings, Edit2 } from "lucide-react";
import Button from "@/ui/Button";
import MarkdownTextarea from "@/ui/MarkdownTextarea";
import ConfirmationDialog from "@/ui/ConfirmationDialog";

type HallOfFame = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  progressRegisterExcludeRetired?: boolean;
  progressRegisterExcludeDeceased?: boolean;
  progressRegisterExcludeInactive?: boolean;
  progressRegisterInactivityYears?: number;
};

type HofYearConfig = {
  id: string;
  year: {
    id: string;
    code: string;
    title: string;
    isActive: boolean;
  };
  minPeaks: number;
  minFpr: number;
};

type AwardTier = {
  id: string;
  name: string;
  minPeaks: number;
  maxPeaks: number | null;
  displayOrder: number;
};

type YearWithAwards = {
  yearCode: string;
  yearTitle: string;
  configId: string;
  tiers: AwardTier[];
};

interface HofFormProps {
  mode: "create" | "edit";
  hofId?: string;
}

export default function HofForm({ mode = "create", hofId }: HofFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [existingHof, setExistingHof] = useState<HallOfFame | null>(null);
  const [hofConfigs, setHofConfigs] = useState<HofYearConfig[]>([]);
  const [awardTiers, setAwardTiers] = useState<YearWithAwards[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    isActive: true,
    displayOrder: 0,
    allowManualEntry: true,
    progressRegisterExcludeRetired: true,
    progressRegisterExcludeDeceased: true,
    progressRegisterExcludeInactive: true,
    progressRegisterInactivityYears: 2,
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

    if (!formData.code.trim()) {
      newErrors.code = "Code is required.";
    } else if (formData.code.trim().length < 2) {
      newErrors.code = "Code must be at least 2 characters.";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required.";
    } else if (formData.title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mark field as touched
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  useEffect(() => {
    if (mode === "edit" && hofId) {
      fetchHof(hofId);
    }
  }, []);

  const fetchHof = async (id: string) => {
    // Only fetch once on initial mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      setLoading(true);
      const [hofResponse, configsResponse, tiersResponse] = await Promise.all([
        fetch(`/api/hofs/${id}`),
        fetch(`/api/hof-year-configs?hofId=${id}`),
        fetch(`/api/award-tiers?hofId=${id}`),
      ]);

      if (hofResponse.ok) {
        const data = await hofResponse.json();
        setExistingHof(data);
        setFormData({
          code: data.code,
          title: data.title,
          description: data.description || "",
          isActive: data.isActive,
          displayOrder: data.displayOrder,
          allowManualEntry: data.allowManualEntry ?? true,
          progressRegisterExcludeRetired:
            data.progressRegisterExcludeRetired ?? true,
          progressRegisterExcludeDeceased:
            data.progressRegisterExcludeDeceased ?? true,
          progressRegisterExcludeInactive:
            data.progressRegisterExcludeInactive ?? true,
          progressRegisterInactivityYears:
            data.progressRegisterInactivityYears ?? 2,
        });
      } else {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/hofs");
      }

      if (configsResponse.ok) {
        const configs = await configsResponse.json();
        setHofConfigs(configs);
      }

      if (tiersResponse.ok) {
        const tiers = await tiersResponse.json();
        setAwardTiers(tiers);
      }
    } catch (error) {
      console.error("Error fetching hall of fame:", error);
      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/admin/hofs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      code: true,
      title: true,
      description: true,
      displayOrder: true,
    });

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const url = mode === "create" ? "/api/hofs" : `/api/hofs/${hofId}`;
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
          router.push(returnTo || "/admin/hofs");
        }, 1500);
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Failed to save hall of fame" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred while saving" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!hofId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/hofs/${hofId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/hofs");
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Failed to delete hall of fame" });
        setShowDeleteConfirmation(false);
      }
    } catch (error) {
      console.error("Error deleting hall of fame:", error);
      setErrors({ submit: "An error occurred while deleting" });
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && mode === "edit") {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-primary-400">Loading hall of fame...</div>
      </div>
    );
  }

  const pageTitle =
    mode === "create" ? "Create Hall of Fame" : "Edit Hall of Fame";

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
                  ? "Add a new hall of fame"
                  : "Update hall of fame details"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {mode === "edit" && existingHof && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setShowDeleteConfirmation(true)}
                  disabled={true}
                  title="Deletion temporarily disabled"
                >
                  Delete
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const returnTo = searchParams.get("returnTo");
                  router.push(returnTo || "/admin/hofs");
                }}
              >
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
                Hall of Fame {mode === "create" ? "created" : "updated"}!
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
          {/* Code */}
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              onBlur={() => handleBlur("code")}
              className={`input-field w-full font-mono ${
                touched.code && errors.code
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }`}
              placeholder="e.g., P1000, POLY"
              disabled={loading}
            />
            {touched.code && errors.code && (
              <p className="mt-1 text-sm text-red-400">{errors.code}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Unique identifier for the hall of fame (will be converted to
              uppercase)
            </p>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              onBlur={() => handleBlur("title")}
              className={`input-field w-full ${
                touched.title && errors.title
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }`}
              placeholder="e.g., P1000 Hall of Fame"
              disabled={loading}
            />
            {touched.title && errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <MarkdownTextarea
              label="Description"
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              placeholder="Optional description of this hall of fame (Markdown supported)"
              rows={4}
              disabled={loading}
              helperText="Supports Markdown formatting"
            />
          </div>

          {/* Display Order */}
          <div className="border-t border-dark-600 pt-6">
            <label
              htmlFor="displayOrder"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Display Order
            </label>
            <input
              type="number"
              id="displayOrder"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
              className="input-field w-full"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Controls the order in which hall of fames are displayed
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-600">
            <div>
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-300 cursor-pointer"
              >
                Active Status
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Inactive hall of fames are hidden from users
              </p>
            </div>
            <div className="flex-shrink-0">
              <label
                htmlFor="isActive"
                className="relative inline-flex items-center cursor-pointer"
                aria-label="Toggle to set hall of fame active status"
              >
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* Allow Manual Entry */}
          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-600">
            <div>
              <label
                htmlFor="allowManualEntry"
                className="text-sm font-medium text-gray-300 cursor-pointer"
              >
                Allow Manual Data Entry
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Enable manual entry of member data for this hall of fame
              </p>
            </div>
            <div className="flex-shrink-0">
              <label
                htmlFor="allowManualEntry"
                className="relative inline-flex items-center cursor-pointer"
                aria-label="Toggle to enable manual data entry for this hall of fame"
              >
                <input
                  type="checkbox"
                  id="allowManualEntry"
                  checked={formData.allowManualEntry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowManualEntry: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* Progress Register Filters */}
          <div className="border-t border-dark-600 pt-6">
            <h3 className="text-lg font-semibold text-primary-400 mb-3">
              Progress Register Filters
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Control which members appear in the Progress Register (members who
              don't yet qualify for Hall of Fame)
            </p>

            <div className="space-y-4">
              {/* Hide Retired Members */}
              <div className="flex items-start sm:items-center justify-between gap-4 p-4 bg-dark-800 rounded-lg border border-dark-600">
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="progressRegisterExcludeRetired"
                    className="text-sm font-medium text-gray-300 cursor-pointer block"
                  >
                    Hide retired members
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Exclude members with a retirement year from the Progress
                    Register
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <label
                    htmlFor="progressRegisterExcludeRetired"
                    className="relative inline-flex items-center cursor-pointer"
                    aria-label="Toggle to exclude retired members from Progress Register"
                  >
                    <input
                      type="checkbox"
                      id="progressRegisterExcludeRetired"
                      checked={formData.progressRegisterExcludeRetired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          progressRegisterExcludeRetired: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                      disabled={loading}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              {/* Hide Deceased Members */}
              <div className="flex items-start sm:items-center justify-between gap-4 p-4 bg-dark-800 rounded-lg border border-dark-600">
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="progressRegisterExcludeDeceased"
                    className="text-sm font-medium text-gray-300 cursor-pointer block"
                  >
                    Hide deceased members
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Exclude members with a deceased year from the Progress
                    Register
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <label
                    htmlFor="progressRegisterExcludeDeceased"
                    className="relative inline-flex items-center cursor-pointer"
                    aria-label="Toggle to exclude deceased members from Progress Register"
                  >
                    <input
                      type="checkbox"
                      id="progressRegisterExcludeDeceased"
                      checked={formData.progressRegisterExcludeDeceased}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          progressRegisterExcludeDeceased: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                      disabled={loading}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              {/* Hide Inactive Members */}
              <div className="p-4 bg-dark-800 rounded-lg border border-dark-600 space-y-4">
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="progressRegisterExcludeInactive"
                      className="text-sm font-medium text-gray-300 cursor-pointer block"
                    >
                      Hide inactive members
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Exclude members with no activity in this HOF for the
                      specified number of years
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <label
                      htmlFor="progressRegisterExcludeInactive"
                      className="relative inline-flex items-center cursor-pointer"
                      aria-label="Toggle to exclude inactive members from Progress Register"
                    >
                      <input
                        type="checkbox"
                        id="progressRegisterExcludeInactive"
                        checked={formData.progressRegisterExcludeInactive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            progressRegisterExcludeInactive: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                        disabled={loading}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                {/* Inactivity Years Input */}
                {formData.progressRegisterExcludeInactive && (
                  <div>
                    <label
                      htmlFor="progressRegisterInactivityYears"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Years of inactivity before hiding
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="progressRegisterInactivityYears"
                      value={formData.progressRegisterInactivityYears}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 2;
                        setFormData({
                          ...formData,
                          progressRegisterInactivityYears: Math.min(
                            10,
                            Math.max(1, value),
                          ),
                        });
                      }}
                      min="1"
                      max="10"
                      className="input-field w-24 sm:w-32"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Members with no entries in this HOF during the specified
                      period will be hidden
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* HoF Year Configurations */}
        {mode === "edit" && existingHof && hofConfigs.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary-400">
                  Year Configurations
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Display settings for this hall of fame across different years
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  router.push(`/admin/configuration?hofId=${existingHof.id}`)
                }
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hofConfigs.map((config) => (
                <button
                  key={config.id}
                  onClick={() =>
                    router.push(`/admin/configuration/${config.id}`)
                  }
                  className="text-left p-3 bg-dark-800 rounded-lg border border-dark-600 hover:border-primary-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">
                        {config.year.code}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {config.year.title}
                      </p>
                    </div>
                    {!config.year.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                    <div>Min Peaks: {config.minPeaks}</div>
                    <div>Min FPR: {config.minFpr.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Award Tiers Table */}
        {mode === "edit" && existingHof && awardTiers.length > 0 && (
          <div className="card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary-400">
                Award Tiers Configuration
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Peak count ranges for each award tier across all years. Click
                any row to edit.
              </p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Year
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Bronze
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Silver
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Gold
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Emerald
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Sapphire
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Diamond
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {awardTiers.map((year) => {
                    const tiersByName: Record<string, AwardTier | null> = {
                      Bronze: null,
                      Silver: null,
                      Gold: null,
                      Emerald: null,
                      Sapphire: null,
                      Diamond: null,
                    };

                    year.tiers.forEach((tier) => {
                      tiersByName[tier.name] = tier;
                    });

                    return (
                      <tr
                        key={year.yearCode}
                        onClick={() =>
                          (window.location.href = `/admin/configuration/${
                            year.configId
                          }?returnTo=${encodeURIComponent(
                            `/admin/hofs/${existingHof.id}`,
                          )}`)
                        }
                        className="border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col flex-1">
                              <span className="font-medium text-white">
                                {year.yearCode}
                              </span>
                              <span className="text-sm text-gray-400">
                                {year.yearTitle}
                              </span>
                            </div>
                            <Edit2 className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </td>
                        {[
                          "Bronze",
                          "Silver",
                          "Gold",
                          "Emerald",
                          "Sapphire",
                          "Diamond",
                        ].map((tierName) => {
                          const tier = tiersByName[tierName];
                          return (
                            <td
                              key={tierName}
                              className="py-4 px-4 text-center"
                            >
                              {tier ? (
                                <span className="text-gray-300 text-sm">
                                  {tier.minPeaks}-{tier.maxPeaks ?? "∞"}
                                </span>
                              ) : (
                                <span className="text-gray-600 text-sm">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {awardTiers.map((year) => (
                <div
                  key={year.yearCode}
                  className="bg-dark-800 border border-dark-600 rounded-lg p-4"
                >
                  <div className="mb-3">
                    <h4 className="font-semibold text-white">
                      {year.yearCode}
                    </h4>
                    <p className="text-sm text-gray-400">{year.yearTitle}</p>
                  </div>
                  <div className="space-y-2">
                    {year.tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-400">{tier.name}:</span>
                        <a
                          href={`/admin/configuration/${
                            year.configId
                          }?returnTo=${encodeURIComponent(
                            `/admin/hofs/${existingHof.id}`,
                          )}`}
                          className="inline-flex items-center gap-1 text-gray-300 hover:text-primary-400 transition-colors cursor-pointer"
                        >
                          {tier.minPeaks}-{tier.maxPeaks ?? "∞"}
                          <Edit2 className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDelete}
        title="Delete Hall of Fame?"
        message={`⚠️ PERMANENT DELETION WARNING

You are about to delete:
• ${existingHof?.title} (${existingHof?.code})

This will permanently remove:
✗ The Hall of Fame category itself
✗ All display settings and descriptions

Note: This action will fail if:
• Any configurations exist for this Hall of Fame
• Any member data (HoF entries) exists for this Hall of Fame

You must delete all configurations and member data first.

This action CANNOT be undone.`}
        confirmText="Delete Hall of Fame"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        requireTextConfirmation={{
          expectedText: existingHof?.code || "",
          placeholder: `Type "${existingHof?.code}" to confirm`,
          instructionText: `To confirm deletion, type the Hall of Fame code: ${existingHof?.code}`,
        }}
      />
    </>
  );
}
