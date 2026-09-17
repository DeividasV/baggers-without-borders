"use client";

import { useState, useId } from "react";
import Input from "./Input";
import {
  formatMinutesToHoursMinutes,
  parseHoursMinutesToMinutes,
} from "@/src/lib/utils";

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
  placeholder?: string;
  id?: string;
}

export default function TimeInput({
  label,
  value,
  onChange,
  disabled = false,
  helperText = "Enter minutes (e.g., 120, 90, 45)",
  placeholder = "e.g., 120",
  id: providedId,
}: TimeInputProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow user to type freely
    if (newValue === "" || /^[\d]*h?[\d]*$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Format on blur
    const newValue = e.target.value;
    if (newValue && /\d/.test(newValue)) {
      const minutes = parseHoursMinutesToMinutes(newValue);
      if (minutes !== null) {
        onChange(formatMinutesToHoursMinutes(minutes));
      }
    }
  };

  const minutes = value ? parseHoursMinutesToMinutes(value) : null;
  const formattedTime =
    minutes !== null ? formatMinutesToHoursMinutes(minutes) : null;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-400 mb-3"
      >
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className="input-field w-32"
          placeholder={placeholder}
          disabled={disabled}
        />
        {formattedTime && (
          <span className="text-sm text-primary-400 font-medium">
            = {formattedTime}
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-2">{helperText}</div>
    </div>
  );
}
