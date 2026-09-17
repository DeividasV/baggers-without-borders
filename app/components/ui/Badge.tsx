import { ReactNode, memo } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "feature"
    | "bug"
    | "enhancement";
  size?: "sm" | "md" | "lg";
  className?: string;
}

function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  const variantStyles = {
    default: "bg-gray-700 text-gray-300",
    primary: "bg-primary-900/30 text-primary-400",
    success: "bg-green-900/30 text-green-400",
    warning: "bg-yellow-900/30 text-yellow-400",
    danger: "bg-red-900/30 text-red-400",
    info: "bg-blue-900/30 text-blue-400",
    feature: "bg-blue-900/30 text-blue-400",
    bug: "bg-red-900/30 text-red-400",
    enhancement: "bg-green-900/30 text-green-400",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(Badge);
