/**
 * Geographic IP utilities using Cloudflare headers
 *
 * Extracts country information from Cloudflare proxy headers
 * for geographic analysis and analytics.
 */

export interface GeoData {
  country: string; // ISO 3166-1 Alpha-2 code (US, GB, etc.) or "XX" for unknown
  ip: string; // Client IP address
  isCloudflare: boolean; // True if request proxied via Cloudflare
}

/**
 * Extract geographic data from request headers
 *
 * Uses Cloudflare headers (CF-IPCountry, CF-Connecting-IP, CF-Ray)
 * Falls back to standard proxy headers if Cloudflare not present
 *
 * @param headers - Request headers from NextRequest
 * @returns Geographic data including country code, IP, and Cloudflare detection
 */
export function getGeoData(headers: Headers): GeoData {
  const cfCountry = headers.get("cf-ipcountry");
  const cfRay = headers.get("cf-ray");

  // Extract IP from Cloudflare or standard proxy headers
  const ip =
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown";

  // Cloudflare returns XX for unknown IPs, T1 for Tor exit nodes
  const isUnknown = !cfCountry || ["XX", "T1"].includes(cfCountry);

  return {
    country: isUnknown ? "XX" : cfCountry,
    ip,
    isCloudflare: !!cfRay,
  };
}

/**
 * Get country code only (null if unknown)
 *
 * Simplified version that returns null for unknown/Tor IPs
 * Useful when you only need the country and want to handle
 * unknowns explicitly.
 *
 * @param headers - Request headers from NextRequest
 * @returns ISO 3166-1 Alpha-2 country code or null if unknown
 */
export function getCountryCode(headers: Headers): string | null {
  const cfCountry = headers.get("cf-ipcountry");

  if (!cfCountry || ["XX", "T1"].includes(cfCountry)) {
    return null;
  }

  return cfCountry;
}

/**
 * Get client IP address from request headers
 *
 * Tries multiple headers in order of preference:
 * 1. CF-Connecting-IP (Cloudflare)
 * 2. X-Forwarded-For (standard proxy)
 * 3. X-Real-IP (Nginx)
 *
 * @param headers - Request headers from NextRequest
 * @returns Client IP address or "unknown"
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
