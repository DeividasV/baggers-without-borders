"use client";

import DatePicker from "@/ui/DatePicker";

interface DateRangePickerProps {
  label?: string;
  fromValue?: string;
  toValue?: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function DateRangePicker({
  label,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromPlaceholder = "From",
  toPlaceholder = "To",
  required = false,
  disabled = false,
  error,
}: DateRangePickerProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-400">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="flex gap-1">
        <DatePicker
          value={fromValue}
          onChange={onFromChange}
          placeholder={fromPlaceholder}
          required={required}
          disabled={disabled}
          maxDate={toValue} // If "to" is selected, "from" can't be after it
        />
        <DatePicker
          value={toValue}
          onChange={onToChange}
          placeholder={toPlaceholder}
          required={required}
          disabled={disabled}
          minDate={fromValue} // If "from" is selected, "to" can't be before it
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
