import { ReactNode, useMemo } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
  onClick,
  ...rest
}: CardProps) {
  // Memoize padding and hover styles to prevent recreation on every render
  const paddingClass = useMemo(() => {
    const paddingStyles = {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };
    return paddingStyles[padding];
  }, [padding]);

  const hoverClass = useMemo(() => {
    // Remove hover transforms that create stacking contexts which interfere with dropdowns
    return hover
      ? "hover:border-primary-600 transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-primary-900/20"
      : "transition-all duration-200 hover:shadow-xl hover:shadow-dark-900/50";
  }, [hover]);

  const baseClasses = `bg-dark-900 border border-dark-700 rounded-lg shadow-lg ${paddingClass} ${hoverClass} ${className}`;

  // If clickable, make it keyboard accessible
  if (onClick) {
    return (
      <div
        {...rest}
        role="button"
        tabIndex={0}
        className={baseClasses}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div {...rest} className={baseClasses}>
      {children}
    </div>
  );
}
