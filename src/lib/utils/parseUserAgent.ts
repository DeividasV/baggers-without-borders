/**
 * Parse user agent string to extract browser and OS information
 *
 * Provides simple, privacy-friendly parsing without fingerprinting.
 * Only extracts browser name/version and OS name/version for analytics.
 */

/**
 * Parse user agent string to browser and OS
 *
 * Returns a formatted string like "Chrome 120/Windows 11" or
 * "Safari 17/macOS" for logging and analytics purposes.
 *
 * Does NOT perform detailed fingerprinting - only major browser/OS info.
 *
 * @param userAgent - User agent string from request headers
 * @returns Formatted string "Browser Version/OS" or "Unknown" if unparseable
 */
export function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Unknown";

  const browser = parseBrowser(userAgent);
  const os = parseOS(userAgent);

  return `${browser}/${os}`;
}

/**
 * Parse browser name and version from user agent
 */
function parseBrowser(ua: string): string {
  // Chrome/Chromium (check before Safari since Chrome includes Safari in UA)
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch && !ua.includes("Edg")) {
    return `Chrome ${chromeMatch[1]}`;
  }

  // Edge
  const edgeMatch = ua.match(/Edg\/(\d+)/);
  if (edgeMatch) {
    return `Edge ${edgeMatch[1]}`;
  }

  // Firefox
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  if (firefoxMatch) {
    return `Firefox ${firefoxMatch[1]}`;
  }

  // Safari (check after Chrome/Edge)
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);
  if (safariMatch) {
    return `Safari ${safariMatch[1]}`;
  }

  // Opera
  const operaMatch = ua.match(/OPR\/(\d+)/);
  if (operaMatch) {
    return `Opera ${operaMatch[1]}`;
  }

  return "Unknown Browser";
}

/**
 * Parse operating system from user agent
 */
function parseOS(ua: string): string {
  // Windows
  if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
  if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
  if (ua.includes("Windows NT 6.2")) return "Windows 8";
  if (ua.includes("Windows NT 6.1")) return "Windows 7";
  if (ua.includes("Windows")) return "Windows";

  // macOS
  if (ua.includes("Mac OS X")) {
    const macMatch = ua.match(/Mac OS X (\d+)[._](\d+)/);
    if (macMatch) {
      return `macOS ${macMatch[1]}.${macMatch[2]}`;
    }
    return "macOS";
  }

  // iOS
  if (ua.includes("iPhone") || ua.includes("iPad")) {
    const iosMatch = ua.match(/OS (\d+)_(\d+)/);
    if (iosMatch) {
      return `iOS ${iosMatch[1]}.${iosMatch[2]}`;
    }
    return "iOS";
  }

  // Android
  if (ua.includes("Android")) {
    const androidMatch = ua.match(/Android (\d+\.?\d*)/);
    if (androidMatch) {
      return `Android ${androidMatch[1]}`;
    }
    return "Android";
  }

  // Linux
  if (ua.includes("Linux")) return "Linux";

  return "Unknown OS";
}
