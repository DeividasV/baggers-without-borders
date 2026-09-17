"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  X,
  Trash2,
  AlertTriangle,
  Settings,
  Edit2,
  Database,
  Users,
  Clock,
  Upload,
  Plus,
} from "lucide-react";
import Button from "@/ui/Button";
import MarkdownTextarea from "@/ui/MarkdownTextarea";
import ConfirmationDialog from "@/ui/ConfirmationDialog";
import StatsCard from "@/ui/StatsCard";

type Year = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type HofYearConfig = {
  id: string;
  hof: {
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

type HofWithAwards = {
  hofCode: string;
  hofTitle: string;
  configId: string;
  tiers: AwardTier[];
};

type MemberDataSummary = {
  hofEntries: Array<{
    hofId: string;
    hofCode: string;
    hofTitle: string;
    displayOrder: number;
    entryCount: number;
    participantCount: number;
    lastUpdated: string | null;
  }>;
  totalHofEntries: number;
  totalYearParticipations: number;
};

interface YearFormProps {
  mode: "create" | "edit";
  yearId?: string;
}

export default function YearForm({ mode = "create", yearId }: YearFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [existingYear, setExistingYear] = useState<Year | null>(null);
  const [yearConfigs, setYearConfigs] = useState<HofYearConfig[]>([]);
  const [awardTiers, setAwardTiers] = useState<HofWithAwards[]>([]);
  const [memberDataSummary, setMemberDataSummary] =
    useState<MemberDataSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    isActive: true,
    displayOrder: 0,
    allowManualEntry: true,
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDeleteDataWarning, setShowDeleteDataWarning] = useState(false);
  const [showDeleteDataConfirmation, setShowDeleteDataConfirmation] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [showCreateEntriesConfirmation, setShowCreateEntriesConfirmation] =
    useState(false);
  const [isCreatingEntries, setIsCreatingEntries] = useState(false);
  const [createEntriesPreview, setCreateEntriesPreview] = useState<{
    users: number;
    hofs: number;
    missingEntries: number;
  } | null>(null);
  const [configCount, setConfigCount] = useState<number>(0);
  const [checkingDependencies, setCheckingDependencies] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
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

  // Mark field as touched and validate
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  useEffect(() => {
    if (mode === "edit" && yearId) {
      fetchYear(yearId);
    }
  }, []);

  const fetchYear = async (id: string) => {
    // Only fetch once on initial mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      setLoading(true);
      const [yearResponse, configsResponse, tiersResponse] = await Promise.all([
        fetch(`/api/years/${id}`),
        fetch(`/api/hof-year-configs?yearId=${id}`),
        fetch(`/api/award-tiers?yearId=${id}`),
      ]);

      if (yearResponse.ok) {
        const data = await yearResponse.json();
        setExistingYear(data);
        setFormData({
          code: data.code,
          title: data.title,
          description: data.description || "",
          isActive: data.isActive,
          displayOrder: data.displayOrder,
          allowManualEntry: data.allowManualEntry ?? true,
        });
      } else {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/years");
      }

      if (configsResponse.ok) {
        const configs = await configsResponse.json();
        setYearConfigs(configs);
      }

      if (tiersResponse.ok) {
        const tiers = await tiersResponse.json();
        setAwardTiers(tiers);
      }
    } catch (error) {
      console.error("Error fetching year:", error);
      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/admin/years");
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberDataSummary = async () => {
    if (!yearId) return;

    setLoadingSummary(true);
    try {
      const response = await fetch(`/api/years/${yearId}/member-data-summary`);
      if (response.ok) {
        const data = await response.json();
        console.log(
          "Member Data Summary - HOF Order:",
          data.hofEntries.map((h: any) => ({
            code: h.hofCode,
            displayOrder: h.displayOrder,
          })),
        );
        setMemberDataSummary(data);
      }
    } catch (error) {
      console.error("Error fetching member data summary:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const checkDependencies = async (id: string) => {
    try {
      setCheckingDependencies(true);
      const response = await fetch(
        `/api/hof-year-configs?yearId=${id}&limit=1`,
      );
      if (response.ok) {
        const data = await response.json();
        const total =
          data && typeof data.total === "number"
            ? data.total
            : (data?.pagination?.totalCount ?? 0);
        setConfigCount(total);
      }
    } catch (error) {
      console.error("Error checking dependencies:", error);
    } finally {
      setCheckingDependencies(false);
    }
  };

  // Fetch member data summary when year is loaded
  useEffect(() => {
    if (mode === "edit" && existingYear) {
      fetchMemberDataSummary();
      checkDependencies(yearId!);
    }
  }, [existingYear]);

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

      const url = mode === "create" ? "/api/years" : `/api/years/${yearId}`;
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
        setSuccessMessage(
          `Year ${mode === "create" ? "created" : "updated"} successfully! Redirecting...`,
        );
        setTimeout(() => {
          const returnTo = searchParams.get("returnTo");
          router.push(returnTo || "/admin/years");
        }, 1500);
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Failed to save year" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred while saving" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!yearId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/years/${yearId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/years");
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Failed to delete year" });
        setShowDeleteConfirmation(false);
      }
    } catch (error) {
      console.error("Error deleting year:", error);
      setErrors({ submit: "An error occurred while deleting" });
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateMissingEntries = async () => {
    if (!yearId) return;

    try {
      setIsCreatingEntries(true);
      const response = await fetch(
        `/api/years/${yearId}/create-missing-entries`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        const data = await response.json();
        setShowCreateEntriesConfirmation(false);
        setShowSuccess(true);

        if (data.data.hofEntriesCreated === 0) {
          setSuccessMessage("All members already have entries for this year");
        } else {
          setSuccessMessage(
            `Created ${data.data.hofEntriesCreated} zero entries for ${data.data.participationsCreated > 0 ? data.data.participationsCreated : data.data.totalUsers} members`,
          );
        }

        // Refresh summary to show updated counts
        fetchMemberDataSummary();
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setSuccessMessage("");
        }, 5000);
      } else {
        const data = await response.json();
        setErrors({
          submit: data.error || "Failed to create missing entries",
        });
        setShowCreateEntriesConfirmation(false);
      }
    } catch (error) {
      setErrors({
        submit: "An error occurred while creating missing entries",
      });
      setShowCreateEntriesConfirmation(false);
    } finally {
      setIsCreatingEntries(false);
    }
  };

  const handleDeleteMemberData = async () => {
    if (!yearId) return;

    try {
      setIsDeletingData(true);
      const response = await fetch(`/api/years/${yearId}/delete-member-data`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setShowDeleteDataConfirmation(false);
        setShowSuccess(true);
        setSuccessMessage(
          `Deleted ${data.deleted.hofEntries} HoF entries and ${data.deleted.userYearParticipations} year participations for ${existingYear?.title}`,
        );
        // Refresh summary to show updated counts
        fetchMemberDataSummary();
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setSuccessMessage("");
        }, 5000);
      } else {
        const data = await response.json();
        setErrors({
          submit: data.error || "Failed to delete member data",
        });
        setShowDeleteDataConfirmation(false);
      }
    } catch (error) {
      setErrors({
        submit: "An error occurred while deleting member data",
      });
      setShowDeleteDataConfirmation(false);
    } finally {
      setIsDeletingData(false);
    }
  };

  if (loading && mode === "edit") {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-primary-400">Loading year...</div>
      </div>
    );
  }

  const pageTitle = mode === "create" ? "Create Year" : "Edit Year";

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
                {mode === "create" ? "Add a new year" : "Update year details"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {mode === "edit" && existingYear && (
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
                  router.push(returnTo || "/admin/years");
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
                {successMessage ||
                  `Year ${mode === "create" ? "created" : "updated"} successfully! Redirecting...`}
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
                setFormData({ ...formData, code: e.target.value })
              }
              onBlur={() => handleBlur("code")}
              className={`input-field w-full font-mono ${
                touched.code && errors.code
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }`}
              placeholder="e.g., 2025, 2026"
              disabled={loading}
            />
            {touched.code && errors.code && (
              <p className="mt-1 text-sm text-red-400">{errors.code}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Unique identifier for the year (typically a year)
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
              placeholder="e.g., 2025 Year"
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
              placeholder="Optional description of this year (Markdown supported)"
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
              Controls the order in which years are displayed
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-600">
            <div>
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-300"
              >
                Active Status
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Inactive years are hidden from users
              </p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
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
            </div>
          </div>

          {/* Allow Manual Entry */}
          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-600">
            <div>
              <label
                htmlFor="allowManualEntry"
                className="text-sm font-medium text-gray-300"
              >
                Allow Manual Data Entry
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Enable manual entry of member data for this year
              </p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
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
            </div>
          </div>
        </form>

        {/* HoF Year Configurations */}
        {mode === "edit" && existingYear && yearConfigs.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary-400">
                  Hall of Fame Configurations
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Display settings for different halls of fame in this year
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  router.push(`/admin/configuration?yearId=${existingYear.id}`)
                }
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {yearConfigs.map((config) => (
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
                        {config.hof.code}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {config.hof.title}
                      </p>
                    </div>
                    {!config.hof.isActive && (
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

        {/* Member Data Summary */}
        {mode === "edit" && existingYear && (
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-400">
                  Member Data Summary
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Record counts for {existingYear.title}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    router.push(`/admin/years/${existingYear.id}/upload-data`)
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Member Data
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateEntriesConfirmation(true)}
                  disabled={isCreatingEntries}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Zero Entries
                </Button>
                {memberDataSummary &&
                  (memberDataSummary.totalHofEntries > 0 ||
                    memberDataSummary.totalYearParticipations > 0) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowDeleteDataWarning(true)}
                      disabled={isDeletingData}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Member Data
                    </Button>
                  )}
              </div>
            </div>

            {loadingSummary ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">Loading summary...</div>
              </div>
            ) : memberDataSummary ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatsCard
                    icon={Database}
                    value={memberDataSummary.totalHofEntries.toLocaleString()}
                    label="Total HoF Entries"
                    hasBorder="none"
                  />
                  <StatsCard
                    icon={Users}
                    value={memberDataSummary.totalYearParticipations.toLocaleString()}
                    label="Year Participations"
                    hasBorder="none"
                  />
                </div>

                {/* Per-HOF Breakdown */}
                {memberDataSummary.hofEntries.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Entries by Hall of Fame
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {memberDataSummary.hofEntries.map((hof) => {
                        const lastUpdated = hof.lastUpdated
                          ? new Date(hof.lastUpdated).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "No updates";

                        return (
                          <div
                            key={hof.hofId}
                            className="p-3 bg-dark-800 rounded-lg border border-dark-600"
                          >
                            <p className="text-xs font-medium text-primary-400 mb-2">
                              {hof.hofCode}
                            </p>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                  Participants:
                                </span>
                                <span className="text-sm font-semibold text-gray-300">
                                  {hof.participantCount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                  Entries:
                                </span>
                                <span className="text-sm font-semibold text-gray-300">
                                  {hof.entryCount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500 pt-1 border-t border-dark-600">
                                <Clock className="h-3 w-3" />
                                <span>{lastUpdated}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {memberDataSummary.totalHofEntries === 0 &&
                  memberDataSummary.totalYearParticipations === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      No member data records for this year
                    </div>
                  )}
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Unable to load summary data
              </div>
            )}
          </div>
        )}

        {/* Award Tiers Table */}
        {mode === "edit" && existingYear && awardTiers.length > 0 && (
          <div className="card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary-400">
                Award Tiers Configuration
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Peak count ranges for each award tier across all halls of fame.
                Click any row to edit.
              </p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      HOF
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
                  {awardTiers.map((hof) => {
                    const tiersByName: Record<string, AwardTier | null> = {
                      Bronze: null,
                      Silver: null,
                      Gold: null,
                      Emerald: null,
                      Sapphire: null,
                      Diamond: null,
                    };

                    hof.tiers.forEach((tier) => {
                      tiersByName[tier.name] = tier;
                    });

                    return (
                      <tr
                        key={hof.hofCode}
                        onClick={() =>
                          (window.location.href = `/admin/configuration/${
                            hof.configId
                          }?returnTo=${encodeURIComponent(
                            `/admin/years/${existingYear.id}`,
                          )}`)
                        }
                        className="border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col flex-1">
                              <span className="font-medium text-white">
                                {hof.hofCode}
                              </span>
                              <span className="text-sm text-gray-400">
                                {hof.hofTitle}
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
              {awardTiers.map((hof) => (
                <div
                  key={hof.hofCode}
                  className="bg-dark-800 border border-dark-600 rounded-lg p-4"
                >
                  <div className="mb-3">
                    <h4 className="font-semibold text-white">{hof.hofCode}</h4>
                    <p className="text-sm text-gray-400">{hof.hofTitle}</p>
                  </div>
                  <div className="space-y-2">
                    {hof.tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-400">{tier.name}:</span>
                        <a
                          href={`/admin/configuration/${
                            hof.configId
                          }?returnTo=${encodeURIComponent(
                            `/admin/years/${existingYear.id}`,
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
        title="Delete Year?"
        message={`⚠️ PERMANENT DELETION WARNING

You are about to delete:
• ${existingYear?.title} (${existingYear?.code})

This will permanently remove:
✗ The year tracking period itself
✗ All display settings and descriptions

Note: This action will fail if:
• Any configurations exist for this year
• Any member data (HoF entries) exists for this year

You must delete all configurations and member data first.

This action CANNOT be undone.`}
        confirmText="Delete Year"
        loading={isDeleting}
        variant="danger"
        requireTextConfirmation={{
          expectedText: existingYear?.code || "",
          placeholder: `Type "${existingYear?.code}" to confirm`,
          instructionText: `To confirm deletion, type the year code: ${existingYear?.code}`,
        }}
      />

      {/* Delete Member Data - Warning Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDataWarning}
        onClose={() => setShowDeleteDataWarning(false)}
        onConfirm={() => {
          setShowDeleteDataWarning(false);
          setShowDeleteDataConfirmation(true);
        }}
        title="Delete Member Data?"
        message={
          memberDataSummary
            ? `This will permanently delete all member data for ${existingYear?.title}:\n\n` +
              `• ${memberDataSummary.totalHofEntries.toLocaleString()} HoF entries\n` +
              `• ${memberDataSummary.totalYearParticipations.toLocaleString()} year participations\n\n` +
              `Year configuration (HOF settings, award tiers) will be preserved.\n\n` +
              `⚠️ THIS ACTION CANNOT BE UNDONE AND DATA CANNOT BE RESTORED.`
            : `This will permanently delete all member data for ${existingYear?.title}.\n\n` +
              `Year configuration will be preserved.\n\n` +
              `⚠️ THIS ACTION CANNOT BE UNDONE AND DATA CANNOT BE RESTORED.`
        }
        confirmText="Continue to Confirm Deletion"
        variant="danger"
      />

      {/* Delete Member Data - Text Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDataConfirmation}
        onClose={() => setShowDeleteDataConfirmation(false)}
        onConfirm={handleDeleteMemberData}
        title="Confirm Deletion"
        message={`To confirm deletion of all member data for ${existingYear?.title}, type "DELETE ${existingYear?.code}" below:`}
        confirmText="Delete Member Data"
        variant="danger"
        loading={isDeletingData}
        requireTextConfirmation={{
          expectedText: `DELETE ${existingYear?.code}`,
          placeholder: `Type DELETE ${existingYear?.code} to confirm`,
          instructionText:
            "⚠️ This action cannot be undone and data cannot be restored",
        }}
      />

      {/* Create Missing Entries Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCreateEntriesConfirmation}
        onClose={() => setShowCreateEntriesConfirmation(false)}
        onConfirm={handleCreateMissingEntries}
        title="Create Zero Entries?"
        message={
          `This will create zero-value HoF entries for all members who don't have data for ${existingYear?.title}.\n\n` +
          `This enables members to enter their peak data in the "My Bags" section without requiring a full data import.\n\n` +
          `The system will:\n` +
          `• Find all active members without entries for this year\n` +
          `• Create HofEntry records with 0 peaks for each HOF\n` +
          `• Create UserYearParticipation records if missing\n\n` +
          `Members can then manually enter their data. Existing entries will not be affected.`
        }
        confirmText="Create Zero Entries"
        variant="info"
        loading={isCreatingEntries}
      />
    </>
  );
}
