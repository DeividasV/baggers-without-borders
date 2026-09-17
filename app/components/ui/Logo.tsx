import BwBIcon from "./BwBIcon";
import { SITE_NAME } from "@/src/config/site";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  showText?: boolean;
  className?: string;
  asLink?: boolean;
}

export default function Logo({
  size = "md",
  showText = true,
  className = "",
  asLink = false,
}: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
    xxl: "h-20 w-20",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
    xl: "text-3xl",
    xxl: "text-4xl",
  };

  const content = (
    <div
      className={`flex items-center space-x-1.5 group cursor-pointer ${className}`}
      role="img"
      aria-label={`${SITE_NAME} logo`}
      title={SITE_NAME}
    >
      <div className="relative">
        <BwBIcon
          className={`${sizeClasses[size]} text-primary-400 transition-all duration-300 group-hover:scale-110 group-hover:text-primary-300 group-hover:-rotate-3`}
        />
      </div>
      {showText && (
        <span
          className={`${textSizeClasses[size]} font-bold text-primary-400 tracking-wide transition-all duration-300 group-hover:text-primary-300 group-hover:tracking-wider`}
          aria-hidden="true"
        >
          {SITE_NAME}
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <a href="/" aria-label="Go to home page">
        {content}
      </a>
    );
  }

  return content;
}
