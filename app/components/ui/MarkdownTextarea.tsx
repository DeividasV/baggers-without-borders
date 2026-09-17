"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";

interface MarkdownTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  required?: boolean;
  onBlur?: () => void;
}

export default function MarkdownTextarea({
  label,
  value,
  onChange,
  placeholder = "Enter text (Markdown supported)",
  maxLength = 5000,
  rows = 6,
  disabled = false,
  helperText,
  error,
  required = false,
  onBlur,
}: MarkdownTextareaProps) {
  const [charCount, setCharCount] = useState(value?.length || 0);
  const remaining = maxLength - charCount;

  useEffect(() => {
    setCharCount(value?.length || 0);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      setCharCount(newValue.length);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-400">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <textarea
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`input-field w-full px-4 py-2 rounded-lg resize-y font-mono text-sm ${
          error
            ? "border-red-500 focus:ring-red-500"
            : disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:border-dark-400 focus:ring-primary-500"
        }`}
        style={{
          borderColor: error ? "#ef4444" : undefined,
        }}
      />

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <span className="text-lg">⚠</span> {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
          <div className="flex items-center gap-1 text-gray-500">
            <FileText className="h-3 w-3" />
            <span className="text-xs">Markdown</span>
          </div>
        </div>
        <span
          className={`text-xs tabular-nums ${
            remaining < 100
              ? "text-red-400"
              : remaining < 500
              ? "text-yellow-400"
              : "text-gray-500"
          }`}
        >
          {remaining} / {maxLength}
        </span>
      </div>
    </div>
  );
}
