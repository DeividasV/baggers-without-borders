"use client";

import YearPicker from "@/ui/YearPicker";

interface YearRangePickerProps {
  label?: string;
  fromValue?: number;
  toValue?: number;
  onFromChange: (year: number | null) => void;
  onToChange: (year: number | null) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  minYear?: number;
  maxYear?: number;
  error?: string;
}

export default function YearRangePicker({
  label,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromPlaceholder = "From year",
  toPlaceholder = "To year",
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  error,
}: YearRangePickerProps) {
  // Calculate dynamic min/max based on selected values
  const fromMaxYear = toValue ? toValue : maxYear;
  const toMinYear = fromValue ? fromValue : minYear;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-400">
          {label}
        </label>
      )}
      <div className="flex gap-1">
        <YearPicker
          value={fromValue}
          onChange={onFromChange}
          placeholder={fromPlaceholder}
          minYear={minYear}
          maxYear={fromMaxYear}
          error={error}
          isInRange={true}
        />
        <YearPicker
          value={toValue}
          onChange={onToChange}
          placeholder={toPlaceholder}
          minYear={toMinYear}
          maxYear={maxYear}
          error={error}
          isInRange={true}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
