"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui";

type YearStatsInlineEditorProps = {
  entryId: string;
  initialPeaksInYear: number;
  initialForeignPeaksInYear: number;
  totalPeaks: number;
  foreignPeaks: number;
  hofLabel: string;
  yearLabel: string;
  onSave: (
    entryId: string,
    data: { peaksInYear: number; foreignPeaksInYear: number }
  ) => Promise<void>;
  onCancel: () => void;
};

export default function YearStatsInlineEditor({
  entryId,
  initialPeaksInYear,
  initialForeignPeaksInYear,
  totalPeaks,
  foreignPeaks,
  hofLabel,
  yearLabel,
  onSave,
  onCancel,
}: YearStatsInlineEditorProps) {
  const [peaksInYear, setPeaksInYear] = useState(initialPeaksInYear);
  const [foreignPeaksInYear, setForeignPeaksInYear] = useState(
    initialForeignPeaksInYear
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Calculate real-time values as user types
  const updatedTotalPeaks = totalPeaks - initialPeaksInYear + peaksInYear;
  const updatedForeignPeaks =
    foreignPeaks - initialForeignPeaksInYear + foreignPeaksInYear;
  const calculatedFpr =
    updatedTotalPeaks > 0 ? (updatedForeignPeaks / updatedTotalPeaks) * 100 : 0;

  // Validate inputs
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (peaksInYear < 0) {
      newErrors.peaksInYear = "Cannot be negative";
    }

    if (foreignPeaksInYear < 0) {
      newErrors.foreignPeaksInYear = "Cannot be negative";
    }

    if (foreignPeaksInYear > peaksInYear) {
      newErrors.foreignPeaksInYear = "Cannot exceed peaks in year";
    }

    setErrors(newErrors);
  }, [peaksInYear, foreignPeaksInYear]);

  const handleSave = async () => {
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(entryId, { peaksInYear, foreignPeaksInYear });
    } catch (error) {
      console.error("Error saving year stats:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      {/* Total Peaks (cumulative - updates as you type) */}
      <div className="flex justify-between">
        <span className="text-gray-400">Total Peaks ({hofLabel}):</span>
        <span
          className={`font-medium ${
            hasErrors ? "text-gray-500" : "text-primary-300"
          }`}
        >
          {updatedTotalPeaks}
        </span>
      </div>

      {/* Total Foreign Peaks (cumulative - updates as you type) */}
      <div className="flex justify-between">
        <span className="text-gray-400">Total Foreign Peaks:</span>
        <span
          className={`font-medium ${
            hasErrors ? "text-gray-500" : "text-primary-300"
          }`}
        >
          {updatedForeignPeaks}
        </span>
      </div>

      {/* Foreign Peak Ratio (updates as you type) */}
      <div className="flex justify-between">
        <span className="text-gray-400">Foreign Peak Ratio:</span>
        <span
          className={`font-medium ${
            hasErrors ? "text-gray-500" : "text-primary-300"
          }`}
        >
          {calculatedFpr.toFixed(1)}%
        </span>
      </div>

      {/* Peaks in Year - Editable */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1.5 sm:gap-3">
        <span className="text-gray-400 text-sm sm:pt-2.5">
          Peaks in {yearLabel}:
        </span>
        <div className="w-full sm:flex-1 sm:max-w-35">
          <input
            type="number"
            value={peaksInYear}
            onChange={(e) => setPeaksInYear(parseInt(e.target.value) || 0)}
            min={0}
            disabled={isSaving}
            className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white text-sm text-right font-medium focus:outline-none focus:ring-2 ${
              errors.peaksInYear
                ? "border-red-500 focus:ring-red-500"
                : "border-primary-600/50 focus:ring-primary-500"
            }`}
          />
          {errors.peaksInYear && (
            <p className="text-xs text-red-400 mt-1">{errors.peaksInYear}</p>
          )}
        </div>
      </div>

      {/* Foreign Peaks in Year - Editable */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1.5 sm:gap-3">
        <span className="text-gray-400 text-sm sm:pt-2.5">
          Foreign Peaks in {yearLabel}:
        </span>
        <div className="w-full sm:flex-1 sm:max-w-35">
          <input
            type="number"
            value={foreignPeaksInYear}
            onChange={(e) =>
              setForeignPeaksInYear(parseInt(e.target.value) || 0)
            }
            min={0}
            disabled={isSaving}
            className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white text-sm text-right font-medium focus:outline-none focus:ring-2 ${
              errors.foreignPeaksInYear
                ? "border-red-500 focus:ring-red-500"
                : "border-primary-600/50 focus:ring-primary-500"
            }`}
          />
          {errors.foreignPeaksInYear && (
            <p className="text-xs text-red-400 mt-1">
              {errors.foreignPeaksInYear}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-3 mt-3 border-t border-dark-600">
        <Button
          onClick={handleSave}
          disabled={hasErrors || isSaving}
          className="w-full sm:flex-1 text-sm py-2.5 whitespace-nowrap"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button
          onClick={onCancel}
          variant="secondary"
          disabled={isSaving}
          className="w-full sm:flex-1 text-sm py-2.5 whitespace-nowrap"
        >
          Cancel
        </Button>
      </div>
    </>
  );
}
