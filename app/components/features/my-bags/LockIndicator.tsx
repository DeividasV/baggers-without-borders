"use client";

import React from "react";
import { Lock } from "lucide-react";

interface LockIndicatorProps {
  isLocked: boolean;
  yearCode: string;
  size?: "sm" | "md" | "lg";
  label?: boolean;
}

/**
 * Memoized lock indicator component
 *
 * Prevents re-renders when parent updates but lock state unchanged.
 * Used in MyBagsManagement for improved render performance.
 *
 * @param isLocked - Whether the entry is locked
 * @param yearCode - Year code for accessibility title
 * @param size - Icon size variant
 * @param label - Show "Locked" text label (for mobile)
 */
const LockIndicator = React.memo(function LockIndicator({
  isLocked,
  yearCode,
  size = "md",
  label = false,
}: LockIndicatorProps) {
  if (!isLocked) return null;

  const sizeMap = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-5 w-5",
  };

  const colorMap = {
    sm: "text-gray-400",
    md: "text-gray-400",
    lg: "text-gray-300",
  };

  return (
    <div
      className={`${
        label
          ? "absolute top-2 right-2 opacity-50 pointer-events-none z-10 flex flex-col items-center gap-0.5"
          : "pointer-events-none shrink-0"
      }`}
      title={`Manual data entry is disabled for ${yearCode}`}
      aria-label={`Entry locked for ${yearCode}`}
    >
      <Lock
        className={`${sizeMap[size]} ${colorMap[size]}`}
        aria-hidden="true"
      />
      {label && (
        <span className="text-[11px] font-medium text-gray-300 uppercase tracking-wide">
          Locked
        </span>
      )}
    </div>
  );
});

export default LockIndicator;
