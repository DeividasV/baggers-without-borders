"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Trash2, AlertTriangle, Plus, Check, Edit2 } from "lucide-react";
import Button from "@/ui/Button";
import MarkdownTextarea from "@/ui/MarkdownTextarea";
import ConfirmationDialog from "@/ui/ConfirmationDialog";
import Switch from "@/ui/Switch";
import SearchableSelect from "@/ui/SearchableSelect";
import FileUpload from "@/ui/FileUpload";

type AwardTier = {
  id: string;
  hofYearConfigId: string;
  name: string;
  minPeaks: number;
  maxPeaks: number | null;
  displayOrder: number;
};

type HofYearConfig = {
  id: string;
  hofId: string;
  yearId: string;
  hofmeisterId: string | null;
  minPeaks: number;
  minPeaksEnabled: boolean;
  minForeignPeaks: number;
  minForeignPeaksEnabled: boolean;
  minFpr: number;
  minFprEnabled: boolean;
  minimumAge: number;
  minimumAgeEnabled: boolean;
  notes: string | null;
  meisterReportContent: string | null;
  meisterReportImage: string | null;
  meisterReportImageTitle: string | null;
  meisterReportImageAttribution: string | null;
  lceEnabled: boolean;
  lceMinFpr: number | null;
  lceMinPeaks: number | null;
  lceMinForeignPeaks: number | null;
  lceCountries: Array<{
    countryId: string;
    country: {
      id: string;
      code: string;
      name: string;
    };
  }>;
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
  hofmeister?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type HallOfFame = {
  id: string;
  code: string;
  title: string;
  isActive: boolean;
};

type Year = {
  id: string;
  code: string;
  title: string;
  isActive: boolean;
};

type Country = {
  id: string;
  code: string;
  name: string;
};

type User = {
  id: string;
  displayName: string;
  username: string;
  givenName?: string;
  familyName?: string;
  bwbForumNickname?: string;
};

interface HofYearConfigFormProps {
  mode?: "create" | "edit";
  configId?: string;
}

export default function ConfigurationForm({
  mode = "create",
  configId,
}: HofYearConfigFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [hofs, setHofs] = useState<HallOfFame[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [existingConfig, setExistingConfig] = useState<HofYearConfig | null>(
    null,
  );
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [editingTiers, setEditingTiers] = useState<
    Record<string, { minPeaks: number; maxPeaks: number | null }>
  >({});
  const [savingTiers, setSavingTiers] = useState<Record<string, boolean>>({});
  const [saveAndClose, setSaveAndClose] = useState(false);

  const [formData, setFormData] = useState({
    hofId: "",
    yearId: "",
    hofmeisterId: null as string | null,
    minPeaks: 0,
    minPeaksEnabled: true,
    minForeignPeaks: 0,
    minForeignPeaksEnabled: true,
    minFpr: 0,
    minFprEnabled: true,
    minimumAge: 0,
    minimumAgeEnabled: true,
    notes: "",
    meisterReportContent: "",
    meisterReportImageTitle: "",
    meisterReportImageAttribution: "",
    lceEnabled: false,
    lceMinFpr: null as number | null,
    lceMinPeaks: null as number | null,
    lceMinForeignPeaks: null as number | null,
    lceCountryIds: [] as string[],
  });

  // State for image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Map<string, string>>(
    new Map(),
  );
  const [showDeleteImageDialog, setShowDeleteImageDialog] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const hasInitialized = useRef(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");

  // Memoize user options to prevent re-creating 1000+ objects on every render
  const userOptions = useMemo(
    () =>
      users.map((user) => {
        // Build searchable subtitle with all names
        const nameParts = [
          user.givenName,
          user.familyName,
          user.bwbForumNickname,
          `@${user.username}`,
        ].filter(Boolean);

        return {
          id: user.id,
          label: user.displayName,
          subtitle: nameParts.join(" • "),
        };
      }),
    [users],
  );

  useEffect(() => {
    if (mode === "edit" && configId) {
      fetchData();
    } else if (mode === "create") {
      fetchHofsAndYears();
    }
  }, []);

  const fetchData = async () => {
    // Only fetch once on initial mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      setLoading(true);
      const [hofsRes, yearsRes, countriesRes, usersRes, configRes] =
        await Promise.all([
          fetch("/api/hofs"),
          fetch("/api/years"),
          fetch("/api/countries"),
          fetch("/api/users?status=ACTIVE&limit=1000"),
          configId
            ? fetch(`/api/hof-year-configs/${configId}`)
            : Promise.resolve(null),
        ]);

      if (hofsRes.ok) {
        const data = await hofsRes.json();
        setHofs(data);
      }

      if (yearsRes.ok) {
        const data = await yearsRes.json();
        setYears(data);
      }

      if (countriesRes.ok) {
        const data = await countriesRes.json();
        // API returns { countries: [], grouped: {} }
        setCountries(Array.isArray(data.countries) ? data.countries : []);
      } else {
        console.error("Failed to fetch countries:", countriesRes.status);
        setCountries([]);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
      } else {
        console.error("Failed to fetch users:", usersRes.status);
        setUsers([]);
      }

      if (configRes && configRes.ok) {
        const data = await configRes.json();
        setExistingConfig(data);
        setFormData({
          hofId: data.hofId,
          yearId: data.yearId,
          hofmeisterId: data.hofmeisterId || null,
          minPeaks: Number(data.minPeaks) || 0,
          minPeaksEnabled: data.minPeaksEnabled ?? true,
          minForeignPeaks: Number(data.minForeignPeaks) || 0,
          minForeignPeaksEnabled: data.minForeignPeaksEnabled ?? true,
          minFpr: Number(data.minFpr) || 0,
          minFprEnabled: data.minFprEnabled ?? true,
          minimumAge: Number(data.minimumAge) || 0,
          minimumAgeEnabled: data.minimumAgeEnabled ?? true,
          notes: data.notes || "",
          meisterReportContent: data.meisterReportContent || "",
          meisterReportImageTitle: data.meisterReportImageTitle || "",
          meisterReportImageAttribution:
            data.meisterReportImageAttribution || "",
          lceEnabled: data.lceEnabled || false,
          lceMinFpr: data.lceMinFpr != null ? Number(data.lceMinFpr) : null,
          lceMinPeaks:
            data.lceMinPeaks != null ? Number(data.lceMinPeaks) : null,
          lceMinForeignPeaks:
            data.lceMinForeignPeaks != null
              ? Number(data.lceMinForeignPeaks)
              : null,
          lceCountryIds:
            data.lceCountries?.map((lce: any) => lce.countryId) || [],
        });

        // Fetch award tiers for this config
        const tiersRes = await fetch(`/api/award-tiers?configId=${configId}`);
        if (tiersRes.ok) {
          const tiersData = await tiersRes.json();
          setAwardTiers(tiersData);
        }
      } else if (configRes && !configRes.ok) {
        console.error("Failed to fetch config:", configRes.status);
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/configuration");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/admin/configuration");
    } finally {
      setLoading(false);
    }
  };

  const fetchHofsAndYears = async () => {
    // Only fetch once on initial mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      const [hofsRes, yearsRes, countriesRes, usersRes] = await Promise.all([
        fetch("/api/hofs"),
        fetch("/api/years"),
        fetch("/api/countries"),
        fetch("/api/users?status=ACTIVE&limit=1000"),
      ]);

      if (hofsRes.ok) {
        const data = await hofsRes.json();
        setHofs(data);
      }

      if (yearsRes.ok) {
        const data = await yearsRes.json();
        setYears(data);
      }

      if (countriesRes.ok) {
        const data = await countriesRes.json();
        // API returns { countries: [], grouped: {} }
        setCountries(Array.isArray(data.countries) ? data.countries : []);
      } else {
        console.error("Failed to fetch countries:", countriesRes.status);
        setCountries([]);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
      } else {
        console.error("Failed to fetch users:", usersRes.status);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching HoFs, Years, and Countries:", error);
      setCountries([]);
    }
  };

  const handleHofChange = (hofId: string) => {
    setFormData((prev) => ({ ...prev, hofId }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.hofId) {
      newErrors.hofId = "Hall of Fame is required.";
    }

    if (!formData.yearId) {
      newErrors.yearId = "Year is required.";
    }

    // Skip validation if filter is disabled
    if (formData.minPeaksEnabled && formData.minPeaks < 0) {
      newErrors.minPeaks = "Minimum peaks cannot be negative";
    }

    // Skip validation if filter is disabled
    if (formData.minForeignPeaksEnabled && formData.minForeignPeaks < 0) {
      newErrors.minForeignPeaks = "Minimum foreign peaks cannot be negative";
    }

    // Skip validation if filter is disabled
    if (
      formData.minFprEnabled &&
      (formData.minFpr < 0 || formData.minFpr > 100)
    ) {
      newErrors.minFpr = "Minimum FPR must be between 0 and 100";
    }

    // Skip validation if filter is disabled
    if (formData.minimumAgeEnabled && formData.minimumAge < 0) {
      newErrors.minimumAge = "Minimum age cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image file selection
  const handleImageFilesChange = async (files: File[]) => {
    if (files.length === 0) {
      setImageFiles([]);
      return;
    }

    // Only allow one file
    const file = files[0];
    setImageFiles([file]);

    // Upload immediately when file is selected (in edit mode only)
    if (mode === "edit" && configId && file) {
      await handleImageUpload(file);
    }
  };

  // Upload image to API
  const handleImageUpload = async (file: File) => {
    if (!configId) return;

    try {
      setUploadingImage(true);
      setErrors({ ...errors, imageUpload: "" });

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/hof-year-configs/${configId}/meister-image`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Refresh config data to get new image path
        const configRes = await fetch(`/api/hof-year-configs/${configId}`);
        if (configRes.ok) {
          const updatedConfig = await configRes.json();
          setExistingConfig(updatedConfig);
        }
        setImageFiles([]);
      } else {
        // Show specific error with suggestion
        const errorMsg = data.suggestion
          ? `${data.error} ${data.suggestion}`
          : data.error || "Failed to upload image";
        setErrors({ ...errors, imageUpload: errorMsg });
        // Clear file input on error
        setImageFiles([]);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      setErrors({
        ...errors,
        imageUpload: "Failed to upload image. Please try again.",
      });
      setImageFiles([]);
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete existing image
  const handleDeleteImage = async () => {
    if (!configId) return;

    try {
      setDeletingImage(true);

      const response = await fetch(
        `/api/hof-year-configs/${configId}/meister-image`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        // Refresh config data
        const configRes = await fetch(`/api/hof-year-configs/${configId}`);
        if (configRes.ok) {
          const updatedConfig = await configRes.json();
          setExistingConfig(updatedConfig);
        }
      } else {
        alert("Failed to delete image");
      }
    } catch (error) {
      console.error("Image deletion error:", error);
      alert("Failed to delete image");
    } finally {
      setDeletingImage(false);
      setShowDeleteImageDialog(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    shouldClose: boolean = false,
  ) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      hofId: true,
      yearId: true,
      minPeaks: true,
      minForeignPeaks: true,
      minFpr: true,
      minimumAge: true,
      notes: true,
    });

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const url =
        mode === "create"
          ? "/api/hof-year-configs"
          : `/api/hof-year-configs/${configId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        if (shouldClose) {
          const returnTo = searchParams.get("returnTo");
          router.push(returnTo || "/admin/configuration");
        } else {
          // Stay on page, just show success or refresh data
          if (mode === "edit") {
            // Refresh the data to show updated values
            const data = await response.json();
            setExistingConfig(data);
          }
        }
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!configId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/hof-year-configs/${configId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/configuration");
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Failed to delete configuration" });
        setShowDeleteConfirmation(false);
      }
    } catch (error) {
      console.error("Error deleting configuration:", error);
      setErrors({ submit: "An error occurred while deleting" });
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTier = (tierId: string, tier: AwardTier) => {
    setEditingTiers({
      ...editingTiers,
      [tierId]: { minPeaks: tier.minPeaks, maxPeaks: tier.maxPeaks },
    });
  };

  const handleCancelEditTier = (tierId: string) => {
    const newEditingTiers = { ...editingTiers };
    delete newEditingTiers[tierId];
    setEditingTiers(newEditingTiers);
  };

  const handleSaveTier = async (tierId: string) => {
    const editedValues = editingTiers[tierId];
    if (!editedValues) return;

    try {
      setSavingTiers({ ...savingTiers, [tierId]: true });

      const response = await fetch(`/api/award-tiers/${tierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedValues),
      });

      if (response.ok) {
        const updatedTier = await response.json();
        setAwardTiers(
          awardTiers.map((tier) => (tier.id === tierId ? updatedTier : tier)),
        );
        handleCancelEditTier(tierId);
      } else {
        alert("Failed to update award tier");
      }
    } catch (error) {
      console.error("Error updating award tier:", error);
      alert("Failed to update award tier");
    } finally {
      const newSavingTiers = { ...savingTiers };
      delete newSavingTiers[tierId];
      setSavingTiers(newSavingTiers);
    }
  };

  // Filter countries based on search term
  const filteredCountries = countries.filter((country) => {
    if (!countrySearchTerm) return true;
    const searchLower = countrySearchTerm.toLowerCase();
    return (
      country.code.toLowerCase().includes(searchLower) ||
      country.name.toLowerCase().includes(searchLower)
    );
  });

  // Sort countries: selected first, then alphabetically
  const sortedFilteredCountries = [...filteredCountries].sort((a, b) => {
    const aSelected = formData.lceCountryIds.includes(a.id);
    const bSelected = formData.lceCountryIds.includes(b.id);

    // Selected countries first
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;

    // Then sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  // Get selected country names for display
  const selectedCountryNames = countries
    .filter((c) => formData.lceCountryIds.includes(c.id))
    .map((c) => c.code)
    .join(", ");

  const pageTitle =
    mode === "create" ? "Create Configuration" : "Edit Configuration";

  // Show loading state while fetching data in edit mode
  if (mode === "edit" && loading && !existingConfig) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-primary-400">Loading configuration...</div>
      </div>
    );
  }

  const meisterReportImageUrl = existingConfig?.meisterReportImage
    ? `${existingConfig.meisterReportImage}?v=${encodeURIComponent(existingConfig.updatedAt)}`
    : null;

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => handleSubmit(e, saveAndClose)}>
        {/* Header Card */}
        <div className="card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-primary-400">
                {pageTitle}
              </h2>
              <p className="text-sm text-gray-400">
                {mode === "create"
                  ? "Configure display settings for a Hall of Fame and Year combination"
                  : "Update configuration settings"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              {mode === "edit" && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setShowDeleteConfirmation(true)}
                  type="button"
                  disabled={true}
                  title="Deletion temporarily disabled"
                >
                  Delete
                </Button>
              )}
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  const returnTo = searchParams.get("returnTo");
                  router.push(returnTo || "/admin/configuration");
                }}
                type="button"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={(e) => {
                  setSaveAndClose(false);
                  handleSubmit(e, false);
                }}
                type="button"
                disabled={loading}
              >
                {loading && !saveAndClose ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={(e) => {
                  setSaveAndClose(true);
                  handleSubmit(e, true);
                }}
                type="button"
                disabled={loading}
              >
                {loading && saveAndClose ? "Saving..." : "Save & Close"}
              </Button>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="card">
          <div className="space-y-6">
            {/* Hall of Fame & Year Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="hofId"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Hall of Fame <span className="text-red-400">*</span>
                </label>
                <select
                  id="hofId"
                  value={formData.hofId}
                  onChange={(e) => handleHofChange(e.target.value)}
                  onBlur={() => setTouched({ ...touched, hofId: true })}
                  disabled={loading || mode === "edit"}
                  className={`input-field w-full ${
                    touched.hofId && errors.hofId ? "border-red-500" : ""
                  } ${mode === "edit" ? "bg-dark-700 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select Hall of Fame</option>
                  {hofs.map((hof) => (
                    <option key={hof.id} value={hof.id}>
                      {hof.code} - {hof.title}
                      {!hof.isActive ? " (Inactive)" : ""}
                    </option>
                  ))}
                </select>
                {touched.hofId && errors.hofId && (
                  <p className="mt-1 text-sm text-red-400">{errors.hofId}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="yearId"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Year <span className="text-red-400">*</span>
                </label>
                <select
                  id="yearId"
                  value={formData.yearId}
                  onChange={(e) =>
                    setFormData({ ...formData, yearId: e.target.value })
                  }
                  onBlur={() => setTouched({ ...touched, yearId: true })}
                  disabled={loading || mode === "edit"}
                  className={`input-field w-full ${
                    touched.yearId && errors.yearId ? "border-red-500" : ""
                  } ${mode === "edit" ? "bg-dark-700 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.code} - {year.title}
                      {!year.isActive ? " (Inactive)" : ""}
                    </option>
                  ))}
                </select>
                {touched.yearId && errors.yearId && (
                  <p className="mt-1 text-sm text-red-400">{errors.yearId}</p>
                )}
              </div>
            </div>

            {/* HoF Meister Selection */}
            <div>
              <SearchableSelect
                id="hofmeisterId"
                label="HoF Meister (optional)"
                value={formData.hofmeisterId || ""}
                onChange={(value) => {
                  setFormData({ ...formData, hofmeisterId: value || null });
                }}
                options={userOptions}
                placeholder="Select a HoF Meister"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Organizes and manages this Hall of Fame (only active members
                shown)
              </p>
            </div>

            {/* Configurable Filter Criteria - Toggle to enable/disable each filter */}
            <div className="border-t border-dark-600 pt-6">
              <h3 className="text-lg font-semibold text-primary-400 mb-4">
                Display & Filtering Criteria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Min Peaks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="minPeaks"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Minimum Peaks
                    </label>
                    <Switch
                      id="minPeaksEnabled"
                      checked={formData.minPeaksEnabled}
                      onChange={(checked) =>
                        setFormData({ ...formData, minPeaksEnabled: checked })
                      }
                      label="Enable"
                      disabled={loading}
                    />
                  </div>
                  <input
                    type="number"
                    id="minPeaks"
                    value={formData.minPeaks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minPeaks: parseInt(e.target.value) || 0,
                      })
                    }
                    onBlur={() => setTouched({ ...touched, minPeaks: true })}
                    min="0"
                    disabled={loading || !formData.minPeaksEnabled}
                    className={`input-field w-full ${
                      touched.minPeaks && errors.minPeaks
                        ? "border-red-500"
                        : ""
                    } ${!formData.minPeaksEnabled ? "opacity-50" : ""}`}
                  />
                  {touched.minPeaks && errors.minPeaks && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.minPeaks}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum total peaks to display in table
                  </p>
                </div>

                {/* Min Foreign Peaks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="minForeignPeaks"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Minimum Foreign Peaks
                    </label>
                    <Switch
                      id="minForeignPeaksEnabled"
                      checked={formData.minForeignPeaksEnabled}
                      onChange={(checked) =>
                        setFormData({
                          ...formData,
                          minForeignPeaksEnabled: checked,
                        })
                      }
                      label="Enable"
                      disabled={loading}
                    />
                  </div>
                  <input
                    type="number"
                    id="minForeignPeaks"
                    value={formData.minForeignPeaks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minForeignPeaks: parseInt(e.target.value) || 0,
                      })
                    }
                    onBlur={() =>
                      setTouched({ ...touched, minForeignPeaks: true })
                    }
                    min="0"
                    disabled={loading || !formData.minForeignPeaksEnabled}
                    className={`input-field w-full ${
                      touched.minForeignPeaks && errors.minForeignPeaks
                        ? "border-red-500"
                        : ""
                    } ${!formData.minForeignPeaksEnabled ? "opacity-50" : ""}`}
                  />
                  {touched.minForeignPeaks && errors.minForeignPeaks && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.minForeignPeaks}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum foreign peaks to display in table
                  </p>
                </div>

                {/* Min FPR */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="minFpr"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Minimum FPR (%)
                    </label>
                    <Switch
                      id="minFprEnabled"
                      checked={formData.minFprEnabled}
                      onChange={(checked) =>
                        setFormData({ ...formData, minFprEnabled: checked })
                      }
                      label="Enable"
                      disabled={loading}
                    />
                  </div>
                  <input
                    type="number"
                    id="minFpr"
                    value={formData.minFpr}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minFpr: parseFloat(e.target.value) || 0,
                      })
                    }
                    onBlur={() => setTouched({ ...touched, minFpr: true })}
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={loading || !formData.minFprEnabled}
                    className={`input-field w-full ${
                      touched.minFpr && errors.minFpr ? "border-red-500" : ""
                    } ${!formData.minFprEnabled ? "opacity-50" : ""}`}
                  />
                  {touched.minFpr && errors.minFpr && (
                    <p className="mt-1 text-sm text-red-400">{errors.minFpr}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum Foreign Peak Ratio percentage (0-100)
                  </p>
                </div>

                {/* Minimum Age */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="minimumAge"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Minimum Age
                    </label>
                    <Switch
                      id="minimumAgeEnabled"
                      checked={formData.minimumAgeEnabled}
                      onChange={(checked) =>
                        setFormData({ ...formData, minimumAgeEnabled: checked })
                      }
                      label="Enable"
                      disabled={loading}
                    />
                  </div>
                  <input
                    type="number"
                    id="minimumAge"
                    value={formData.minimumAge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumAge: parseInt(e.target.value) || 0,
                      })
                    }
                    onBlur={() => setTouched({ ...touched, minimumAge: true })}
                    min="0"
                    disabled={loading || !formData.minimumAgeEnabled}
                    className={`input-field w-full ${
                      touched.minimumAge && errors.minimumAge
                        ? "border-red-500"
                        : ""
                    } ${!formData.minimumAgeEnabled ? "opacity-50" : ""}`}
                  />
                  {touched.minimumAge && errors.minimumAge && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.minimumAge}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum age to participate in this Hall of Fame
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-dark-600 pt-6">
              <MarkdownTextarea
                label="Notes"
                value={formData.notes}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                placeholder="Optional administrative notes (Markdown supported)"
                rows={6}
                disabled={loading}
                helperText="Use for internal documentation, special rules, or context"
              />
            </div>

            {/* HoF Meister Report Section */}
            <div className="border-t border-dark-600 pt-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                HoF Meister Report (optional)
              </h3>

              {/* Layout: Report Content on Left, Image on Right (Large Screens) */}
              <div className="lg:flex lg:gap-6">
                {/* Left Column - Report Content */}
                <div className="lg:flex-1 space-y-6">
                  {/* Report Content */}
                  <div>
                    <MarkdownTextarea
                      label="Report Content"
                      value={formData.meisterReportContent}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          meisterReportContent: value,
                        })
                      }
                      placeholder="Write your HoF Meister report here (Markdown supported)"
                      rows={20}
                      disabled={loading}
                      helperText="Markdown formatting available: **bold**, *italic*, [links](url), etc."
                    />
                  </div>
                </div>

                {/* Right Column - Image Upload Section */}
                <div className="mt-6 lg:mt-0 lg:w-80 lg:shrink-0 space-y-4">
                  {/* Image Title */}
                  <div>
                    <label
                      htmlFor="meisterReportImageTitle"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Image Title
                    </label>
                    <input
                      id="meisterReportImageTitle"
                      type="text"
                      value={formData.meisterReportImageTitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          meisterReportImageTitle: e.target.value,
                        })
                      }
                      placeholder="e.g., 'Mount Ngauruhoe, New Zealand'"
                      disabled={loading}
                      className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Image Attribution */}
                  <div>
                    <label
                      htmlFor="meisterReportImageAttribution"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Image Attribution
                    </label>
                    <input
                      id="meisterReportImageAttribution"
                      type="text"
                      value={formData.meisterReportImageAttribution}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          meisterReportImageAttribution: e.target.value,
                        })
                      }
                      placeholder="Photo credit (e.g., 'Photo by John Smith')"
                      disabled={loading}
                      className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Image Preview or Upload */}
                  {mode === "edit" && configId ? (
                    <div>
                      <div className="block text-sm font-medium text-gray-300 mb-2">
                        Report Image
                      </div>

                      {meisterReportImageUrl ? (
                        // Existing Image - Click to Replace
                        <div className="space-y-3">
                          <button
                            type="button"
                            className="relative group cursor-pointer w-full text-left bg-transparent border-0 p-0"
                            onClick={() =>
                              document
                                .getElementById("hidden-file-input")
                                ?.click()
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                document
                                  .getElementById("hidden-file-input")
                                  ?.click();
                              }
                            }}
                            aria-label="Click to replace report image"
                          >
                            <img
                              src={meisterReportImageUrl}
                              alt={
                                formData.meisterReportImageTitle ||
                                `Current HoF Meister report image`
                              }
                              className="w-full h-auto rounded-lg border border-dark-600 transition-all group-hover:border-primary-500"
                            />
                            <div
                              className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all rounded-lg flex items-center justify-center pointer-events-none"
                              aria-hidden="true"
                            >
                              <Edit2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDeleteImageDialog(true)}
                            disabled={deletingImage || loading}
                            type="button"
                            icon={<Trash2 className="h-4 w-4" />}
                            className="w-full"
                          >
                            Delete Image
                          </Button>
                        </div>
                      ) : (
                        // No Image - Show Upload Zone
                        <FileUpload
                          files={imageFiles}
                          onFilesChange={handleImageFilesChange}
                          accept="image/*"
                          multiple={false}
                          previewUrls={imagePreviewUrls}
                        />
                      )}

                      {/* Hidden file input for click-to-replace */}
                      <input
                        id="hidden-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            handleImageFilesChange(Array.from(files));
                          }
                        }}
                      />

                      {/* Upload Status */}
                      <div aria-live="polite" aria-atomic="true">
                        {uploadingImage && (
                          <div className="flex items-center gap-2 p-2 bg-blue-900/20 border border-blue-800 rounded-lg">
                            <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-blue-400">
                              Uploading and optimizing...
                            </p>
                          </div>
                        )}
                        {errors.imageUpload && (
                          <p
                            className="text-sm text-red-400 p-2 bg-red-900/20 border border-red-800 rounded-lg"
                            role="alert"
                          >
                            {errors.imageUpload}
                          </p>
                        )}
                      </div>

                      {/* Info Text */}
                      <p className="text-xs text-gray-500">
                        Max 5MB. PNG, JPEG, WebP, GIF. Auto-optimized to
                        800×600px.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 p-3 bg-dark-800/50 border border-dark-600 rounded-lg">
                      💡 Save this configuration first, then you can upload an
                      image.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Image Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteImageDialog}
          onClose={() => setShowDeleteImageDialog(false)}
          onConfirm={handleDeleteImage}
          title="Delete HoF Meister Image?"
          message="This will permanently delete the current image from the server. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={deletingImage}
        />
      </form>

      {/* Large Country Exception (LCE) Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-400">
              Large Country Exception (LCE)
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Apply different FPR thresholds for members from large countries
            </p>
          </div>

          {/* LCE Enable/Disable Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.lceEnabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lceEnabled: e.target.checked,
                })
              }
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              {formData.lceEnabled ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>

        {/* LCE Configuration (shown when enabled) */}
        {formData.lceEnabled && (
          <div className="space-y-6 pt-4 border-t border-dark-600">
            {/* Alternative Thresholds Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LCE Min Peaks */}
              <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
                <label
                  htmlFor="lceMinPeaks"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Alternative Minimum Peaks
                  <span className="ml-2 text-xs text-gray-500">(optional)</span>
                </label>
                <input
                  type="number"
                  id="lceMinPeaks"
                  value={formData.lceMinPeaks ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lceMinPeaks: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  min="0"
                  step="1"
                  placeholder={`Leave empty to use standard ${formData.minPeaks}`}
                  disabled={loading}
                  className="input-field w-full"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Minimum total peaks for LCE countries. If not set, standard
                  minimum ({formData.minPeaks}) will be used.
                </p>
              </div>

              {/* LCE Min Foreign Peaks */}
              <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
                <label
                  htmlFor="lceMinForeignPeaks"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Alternative Minimum Foreign Peaks
                  <span className="ml-2 text-xs text-gray-500">(optional)</span>
                </label>
                <input
                  type="number"
                  id="lceMinForeignPeaks"
                  value={formData.lceMinForeignPeaks ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lceMinForeignPeaks: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  min="0"
                  step="1"
                  placeholder={`Leave empty to use standard ${formData.minForeignPeaks}`}
                  disabled={loading}
                  className="input-field w-full"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Minimum foreign peaks for LCE countries. If not set, standard
                  minimum ({formData.minForeignPeaks}) will be used.
                </p>
              </div>

              {/* LCE Min FPR */}
              <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
                <label
                  htmlFor="lceMinFpr"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Alternative FPR Threshold
                  <span className="ml-2 text-xs text-gray-500">(optional)</span>
                </label>
                <input
                  type="number"
                  id="lceMinFpr"
                  value={formData.lceMinFpr ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lceMinFpr: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder={`Leave empty to use standard ${formData.minFpr}%`}
                  disabled={loading}
                  className="input-field w-full"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Minimum FPR percentage for LCE countries. If not set, standard
                  threshold ({formData.minFpr}%) will be used.
                </p>
              </div>
            </div>

            {/* LCE Countries Selection */}
            <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
              <div className="mb-3">
                <label
                  htmlFor="lce-country-search"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  LCE Countries
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select countries that should have LCE applied. Common: US, BR,
                  RU, CN, IN, AU
                </p>

                {/* Search Box */}
                <input
                  id="lce-country-search"
                  type="text"
                  placeholder="Search countries..."
                  value={countrySearchTerm}
                  onChange={(e) => setCountrySearchTerm(e.target.value)}
                  className="input-field w-full mb-3"
                />

                {/* Selected Countries Summary */}
                {formData.lceCountryIds.length > 0 && (
                  <div className="mb-3 p-3 bg-primary-900/20 border border-primary-600/30 rounded">
                    <p className="text-sm text-primary-400 font-medium mb-1">
                      {formData.lceCountryIds.length}{" "}
                      {formData.lceCountryIds.length === 1
                        ? "country"
                        : "countries"}{" "}
                      selected
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedCountryNames || "None"}
                    </p>
                  </div>
                )}
              </div>

              {/* Countries List with Switches */}
              <div className="max-h-80 overflow-y-auto border border-dark-700 rounded-lg">
                {!Array.isArray(countries) || countries.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 text-center">
                    {!Array.isArray(countries)
                      ? "Loading countries..."
                      : "No countries available"}
                  </p>
                ) : filteredCountries.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 text-center">
                    No countries match "{countrySearchTerm}"
                  </p>
                ) : (
                  <div className="divide-y divide-dark-700">
                    {sortedFilteredCountries.map((country) => {
                      const isSelected = formData.lceCountryIds.includes(
                        country.id,
                      );
                      return (
                        <label
                          key={country.id}
                          className="flex items-center justify-between p-3 hover:bg-dark-700 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-gray-400 w-8">
                              {country.code}
                            </span>
                            <span className="text-sm text-gray-300">
                              {country.name}
                            </span>
                            {isSelected && (
                              <span className="text-xs text-primary-400 font-medium">
                                ✓ Selected
                              </span>
                            )}
                          </div>

                          {/* Switch */}
                          <div className="relative inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    lceCountryIds: [
                                      ...formData.lceCountryIds,
                                      country.id,
                                    ],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    lceCountryIds:
                                      formData.lceCountryIds.filter(
                                        (id) => id !== country.id,
                                      ),
                                  });
                                }
                              }}
                              disabled={loading}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Award Tiers Section */}
      {mode === "edit" && existingConfig && awardTiers.length > 0 && (
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-primary-400 flex items-center gap-2">
              Award Tiers
              <Edit2 className="h-4 w-4 text-gray-500" />
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Configure peak count ranges for each award tier. Click values to
              edit.
            </p>
          </div>

          <div className="space-y-3">
            {awardTiers.map((tier) => {
              const isEditing = !!editingTiers[tier.id];
              const isSaving = savingTiers[tier.id];

              return (
                <div
                  key={tier.id}
                  className="flex items-center justify-between p-4 bg-dark-800 border border-dark-600 rounded-lg hover:border-dark-500 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{tier.name}</h4>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingTiers[tier.id].minPeaks}
                          onChange={(e) =>
                            setEditingTiers({
                              ...editingTiers,
                              [tier.id]: {
                                ...editingTiers[tier.id],
                                minPeaks: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="input-field w-24 text-center"
                          min="0"
                          disabled={isSaving}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="number"
                          value={editingTiers[tier.id].maxPeaks ?? ""}
                          onChange={(e) =>
                            setEditingTiers({
                              ...editingTiers,
                              [tier.id]: {
                                ...editingTiers[tier.id],
                                maxPeaks: e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              },
                            })
                          }
                          placeholder="∞"
                          className="input-field w-24 text-center"
                          min="0"
                          disabled={isSaving}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveTier(tier.id)}
                          disabled={isSaving}
                          icon={<Check className="h-4 w-4" />}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancelEditTier(tier.id)}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditTier(tier.id, tier)}
                      className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
                    >
                      <span className="font-mono">
                        {tier.minPeaks} - {tier.maxPeaks ?? "∞"}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDelete}
        title="Delete Configuration?"
        message={
          existingConfig
            ? `⚠️ PERMANENT DELETION WARNING

You are about to delete the configuration for:
• Hall of Fame: ${existingConfig.hof.title} (${existingConfig.hof.code})
• Year: ${existingConfig.year.title} (${existingConfig.year.code})

This will permanently remove:
✗ All qualification rules and thresholds
✗ HoF Meister assignment and report content
✗ Award tier configuration
✗ Large Country Exception (LCE) settings

Note: This action will fail if any member data (HoF entries) exists for this combination. Delete member data first if needed.

This action CANNOT be undone.`
            : ""
        }
        confirmText="Delete Configuration"
        loading={isDeleting}
        variant="danger"
        requireTextConfirmation={{
          expectedText: existingConfig?.hof.code || "",
          placeholder: `Type "${existingConfig?.hof.code}" to confirm`,
          instructionText: `To confirm deletion, type the Hall of Fame code: ${existingConfig?.hof.code}`,
        }}
      />
    </div>
  );
}
