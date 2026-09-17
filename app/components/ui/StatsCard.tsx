import { memo } from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  hasBorder?: "left" | "right" | "both" | "none";
}

function StatsCard({
  icon: Icon,
  value,
  label,
  hasBorder = "none",
}: StatsCardProps) {
  const borderClasses = {
    left: "border-l border-dark-600",
    right: "border-r border-dark-600",
    both: "border-l border-r border-dark-600",
    none: "",
  };

  return (
    <div className={`flex flex-col items-center ${borderClasses[hasBorder]}`}>
      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 mb-2" />
      <div className="text-2xl sm:text-3xl font-bold text-gray-400">
        {value}
      </div>
      <div className="text-sm sm:text-base text-gray-400 text-center">
        {label}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(StatsCard);
