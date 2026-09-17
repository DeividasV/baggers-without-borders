"use client";

import { AlertTriangle, X } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: ReactNode;
  loading?: boolean;
  requireTextConfirmation?: {
    expectedText: string;
    placeholder?: string;
    instructionText?: string;
  };
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon,
  loading = false,
  requireTextConfirmation,
}: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState("");

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
    }
  }, [isOpen]);

  // Handle Escape key globally
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  // Check if text matches the expected value (case-insensitive, trimmed)
  const isTextConfirmed =
    !requireTextConfirmation ||
    inputValue.toLowerCase().trim() ===
      requireTextConfirmation.expectedText.toLowerCase().trim();

  const variantStyles = {
    danger: {
      iconColor: "text-red-400",
      iconBg: "bg-red-900/30",
      confirmButton:
        "bg-red-600 hover:bg-red-500 text-white disabled:bg-red-800 disabled:cursor-not-allowed",
    },
    warning: {
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-900/30",
      confirmButton:
        "bg-yellow-600 hover:bg-yellow-500 text-white disabled:bg-yellow-800 disabled:cursor-not-allowed",
    },
    info: {
      iconColor: "text-blue-400",
      iconBg: "bg-blue-900/30",
      confirmButton:
        "bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-800 disabled:cursor-not-allowed",
    },
  };

  const styles = variantStyles[variant];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
    >
      <div
        className="bg-dark-800 rounded-xl shadow-2xl max-w-md w-full border border-dark-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-dark-600">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${styles.iconBg}`}>
              {icon || (
                <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
              )}
            </div>
            <h2
              id="confirmation-dialog-title"
              className="text-xl font-bold text-gray-100"
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {message}
          </p>

          {/* Text Confirmation Input */}
          {requireTextConfirmation && (
            <div className="mt-4 space-y-2">
              {requireTextConfirmation.instructionText && (
                <p className="text-sm text-gray-400">
                  {requireTextConfirmation.instructionText}
                </p>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  requireTextConfirmation.placeholder || "Type to confirm"
                }
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-dark-600 bg-dark-750">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg font-medium bg-dark-600 hover:bg-dark-500 text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            disabled={loading || !isTextConfirmed}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${styles.confirmButton}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
