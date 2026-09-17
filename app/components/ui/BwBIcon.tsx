import { SITE_NAME } from "@/src/config/site";

interface BwBIconProps {
  className?: string;
}

export default function BwBIcon({ className = "" }: BwBIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <title>{`${SITE_NAME} logo`}</title>
      <desc>A stylized mountain peak with a dot indicator representing climbing achievements</desc>
      {/* Mountain shape - left peak higher, right slope lower for better hierarchy */}
      <path
        d="M40 420L140 100L256 200L372 130L472 420H40Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <path d="M120 420L256 180L392 420H120Z" fill="currentColor" />

      {/* Dot indicator - even bigger with mountain-themed colors */}
      <circle
        cx="420"
        cy="350"
        r="48"
        fill="#6b7548"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.9"
      />
    </svg>
  );
}
