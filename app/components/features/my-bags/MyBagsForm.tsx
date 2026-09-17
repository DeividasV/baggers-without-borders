"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, Lock } from "lucide-react";
import Button from "@/ui/Button";

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
    allowManualEntry: boolean;
  };
  hof: {
    id: string;
    code: string;
    title: string;
    allowManualEntry: boolean;
  };
  year: {
    id: string;
    code: string;
    title: string;
    allowManualEntry: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

interface MyBagsFormProps {
  entryId: string;
}

export default function MyBagsForm({ entryId }: MyBagsFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [existingEntry, setExistingEntry] = useState<HofEntry | null>(null);
  const [isEditable, setIsEditable] = useState(true);
  const [lockReason, setLockReason] = useState("");
  const [formData, setFormData] = useState({
    peaksInYear: 0,
    foreignPeaksInYear: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const hasInitialized = useRef(false);

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.peaksInYear < 0) {
      newErrors.peaksInYear = "Peaks in year cannot be negative.";
    }

    if (formData.foreignPeaksInYear < 0) {
      newErrors.foreignPeaksInYear =
        "Foreign peaks in year cannot be negative.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mark field as touched
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  useEffect(() => {
    if (entryId) {
      fetchEntry(entryId);
    }
  }, []);

  const fetchEntry = async (id: string) => {
    // Only fetch once on initial mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      setLoading(true);
      const response = await fetch(`/api/my-bags/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExistingEntry(data);
        setFormData({
          peaksInYear: data.peaksInYear,
          foreignPeaksInYear: data.foreignPeaksInYear,
        });

        // Check if editing is allowed
        if (!data.member.allowManualEntry) {
          setIsEditable(false);
          setLockReason(
            "Manual data entry has been disabled for your account. Please contact an administrator if you believe this is incorrect."
          );
        } else if (!data.hof.allowManualEntry) {
          setIsEditable(false);
          setLockReason(
            `Manual data entry has been disabled for the ${data.hof.code} hall of fame.`
          );
        } else if (!data.year.allowManualEntry) {
          setIsEditable(false);
          setLockReason(
            `Manual data entry has been disabled for the ${data.year.code} year.`
          );
        } else {
          setIsEditable(true);
          setLockReason("");
        }
      } else {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/my-bags");
      }
    } catch (error) {
      console.error("Error fetching entry:", error);
      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/my-bags");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      setErrors({ submit: "You must be logged in to update entries" });
      return;
    }

    if (!isEditable) {
      setErrors({ submit: lockReason });
      return;
    }

    // Mark all fields as touched
    setTouched({
      peaksInYear: true,
      foreignPeaksInYear: true,
    });

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/my-bags/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          const returnTo = searchParams.get("returnTo");
          router.push(returnTo || "/my-bags");
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

  const handleCancel = () => {
    const returnTo = searchParams.get("returnTo");
    router.push(returnTo || "/my-bags");
  };

  if (loading && !existingEntry) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primary-400">Loading entry...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-400">
              Edit Entry
            </h2>
            <p className="text-sm text-gray-400">Update your entry details</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
                    new Event("submit", { cancelable: true, bubbles: true })
                  );
                }
              }}
              disabled={loading || !isEditable}
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
              Entry updated! Redirecting...
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

      {/* Lock Warning */}
      {!isEditable && lockReason && (
        <div className="card bg-amber-900/20 border-amber-700/50">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium mb-1">
                Manual Data Entry Disabled
              </p>
              <p className="text-amber-300/80 text-sm">{lockReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* HOF and Year - Read Only Display */}
        {existingEntry && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="block text-sm font-medium text-gray-300 mb-2">
                Hall of Fame
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

            <div>
              <div className="block text-sm font-medium text-gray-300 mb-2">
                Year
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
          </div>
        )}

        {/* Summary with Editable Fields and Calculated Totals */}
        {existingEntry && (
          <div>
            <div className="bg-dark-700 border border-primary-600/30 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Peaks in Year - Editable */}
                <div>
                  <label
                    htmlFor="peaksInYear"
                    className="block text-xs text-gray-400 mb-2"
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
                    disabled={loading || !isEditable}
                    min="0"
                    className={`input-field w-full ${
                      touched.peaksInYear && errors.peaksInYear
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                  />
                  {touched.peaksInYear && errors.peaksInYear && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.peaksInYear}
                    </p>
                  )}
                </div>

                {/* Foreign in Year - Editable */}
                <div>
                  <label
                    htmlFor="foreignPeaksInYear"
                    className="block text-xs text-gray-400 mb-2"
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
                    disabled={loading || !isEditable}
                    min="0"
                    className={`input-field w-full ${
                      touched.foreignPeaksInYear && errors.foreignPeaksInYear
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                  />
                  {touched.foreignPeaksInYear && errors.foreignPeaksInYear && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.foreignPeaksInYear}
                    </p>
                  )}
                </div>

                {/* Total Peaks - Calculated */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Total Peaks</p>
                  <p className="text-2xl font-bold text-white px-3 py-2">
                    {(
                      existingEntry.totalPeaks -
                      existingEntry.peaksInYear +
                      formData.peaksInYear
                    ).toLocaleString()}
                  </p>
                </div>

                {/* Total Foreign Peaks - Calculated */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">
                    Total Foreign Peaks
                  </p>
                  <p className="text-2xl font-bold text-white px-3 py-2">
                    {(
                      existingEntry.foreignPeaks -
                      existingEntry.foreignPeaksInYear +
                      formData.foreignPeaksInYear
                    ).toLocaleString()}
                  </p>
                </div>

                {/* FPR - Below Total Peaks */}
                <div className="md:col-start-3">
                  <p className="text-xs text-gray-400 mb-2">
                    Foreign Peak Ratio (FPR)
                  </p>
                  <p className="text-xl font-bold text-white px-3 py-2">
                    {(() => {
                      const newTotalPeaks =
                        existingEntry.totalPeaks -
                        existingEntry.peaksInYear +
                        formData.peaksInYear;
                      const newTotalForeign =
                        existingEntry.foreignPeaks -
                        existingEntry.foreignPeaksInYear +
                        formData.foreignPeaksInYear;
                      const fpr =
                        newTotalPeaks > 0
                          ? (newTotalForeign / newTotalPeaks) * 100
                          : 0;
                      return `${fpr.toFixed(1)}%`;
                    })()}
                  </p>
                </div>

                {/* Domestic Peaks - Below Total Foreign Peaks */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Domestic Peaks</p>
                  <p className="text-xl font-bold text-white px-3 py-2">
                    {(() => {
                      const newTotalPeaks =
                        existingEntry.totalPeaks -
                        existingEntry.peaksInYear +
                        formData.peaksInYear;
                      const newTotalForeign =
                        existingEntry.foreignPeaks -
                        existingEntry.foreignPeaksInYear +
                        formData.foreignPeaksInYear;
                      return (newTotalPeaks - newTotalForeign).toLocaleString();
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry Locked Notice */}
        {!isEditable && lockReason && (
          <div className="flex items-start gap-2 text-gray-500 text-xs mt-4">
            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>{lockReason}</p>
          </div>
        )}
      </form>
    </div>
  );
}
