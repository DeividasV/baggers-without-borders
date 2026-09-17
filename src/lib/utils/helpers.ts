/**
 * General Utilities
 * Miscellaneous helper functions
 */

/**
 * Check if user has admin privileges
 */
export function isAdmin(userRole?: string): boolean {
  return userRole === "ADMIN";
}

/**
 * Generate a cryptographically secure random string for IDs
 */
export function generateId(): string {
  // Use crypto for better randomness than Math.random()
  const bytes = new Uint8Array(9);
  if (typeof window === "undefined") {
    // Node.js environment
    const crypto = require("crypto");
    return crypto.randomBytes(9).toString("hex");
  }
  // Browser environment
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Debounce function with cancel support
 * Returns a debounced function with a cancel method for cleanup
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  return debounced;
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Transliterate special characters to Latin equivalents for username generation
 * Comprehensive European character coverage: German, Nordic, Slavic, Baltic, Romance, Finno-Ugric languages
 */
export function transliterate(text: string): string {
  if (!text || typeof text !== "string") return "";

  // First normalize to decompose diacritics (e.g., é -> e + ´)
  let result = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Character replacement map for European characters
  // Organized alphabetically to avoid duplicates (some chars used in multiple languages)
  const charMap: Record<string, string> = {
    // German ß
    ß: "ss",

    // Lowercase Latin extensions
    ã: "a", // Portuguese
    ā: "a", // Latvian
    ă: "a", // Romanian
    ą: "a", // Polish, Lithuanian
    â: "a", // Romanian, French
    ä: "a", // German, Estonian
    å: "a", // Nordic
    æ: "ae", // Nordic, Icelandic
    ć: "c", // Polish, Croatian, Serbian
    ç: "c", // French, Portuguese, Turkish (cedilla)
    č: "c", // Czech, Slovak, Slovenian, Croatian, Lithuanian
    ď: "d", // Czech, Slovak
    đ: "d", // Croatian, Serbian
    ð: "d", // Icelandic
    ė: "e", // Lithuanian
    ę: "e", // Polish, Lithuanian
    ē: "e", // Latvian
    ě: "e", // Czech
    ğ: "g", // Turkish
    ģ: "g", // Latvian
    ı: "i", // Turkish (dotless i)
    į: "i", // Lithuanian
    ī: "i", // Latvian
    î: "i", // Romanian, French
    ķ: "k", // Latvian
    ĺ: "l", // Slovak
    ļ: "l", // Latvian
    ľ: "l", // Slovak
    ł: "l", // Polish
    ń: "n", // Polish
    ň: "n", // Czech, Slovak
    ņ: "n", // Latvian
    ñ: "n", // Spanish
    ō: "o", // Latvian (macron)
    ő: "o", // Hungarian
    ô: "o", // Slovak, French
    ö: "o", // German, Hungarian, Turkish, Estonian
    ø: "o", // Nordic
    õ: "o", // Portuguese, Estonian
    œ: "oe", // French
    ŕ: "r", // Slovak
    ř: "r", // Czech
    ś: "s", // Polish
    ș: "s", // Romanian
    š: "s", // Czech, Slovak, Slovenian, Croatian, Lithuanian, Latvian
    ş: "s", // Turkish, Romanian (cedilla)
    ť: "t", // Czech, Slovak
    ț: "t", // Romanian
    þ: "th", // Icelandic
    ū: "u", // Latvian, Lithuanian
    ű: "u", // Hungarian
    ų: "u", // Lithuanian
    ů: "u", // Czech
    ü: "u", // German, Hungarian, Turkish, Estonian
    ý: "y", // Czech, Slovak, Icelandic
    ź: "z", // Polish
    ż: "z", // Polish
    ž: "z", // Czech, Slovak, Slovenian, Croatian, Lithuanian, Latvian

    // Uppercase Latin extensions
    Ã: "a",
    Ā: "a",
    Ă: "a",
    Ą: "a",
    Â: "a",
    Ä: "a",
    Å: "a",
    Æ: "ae",
    Ć: "c",
    Ç: "c",
    Č: "c",
    Ď: "d",
    Đ: "d",
    Ð: "d",
    Ė: "e",
    Ę: "e",
    Ē: "e",
    Ě: "e",
    Ğ: "g",
    Ģ: "g",
    İ: "i", // Turkish capital I with dot
    Į: "i",
    Ī: "i",
    Î: "i",
    Ķ: "k",
    Ĺ: "l",
    Ļ: "l",
    Ľ: "l",
    Ł: "l",
    Ń: "n",
    Ň: "n",
    Ņ: "n",
    Ñ: "n",
    Ő: "o",
    Ô: "o",
    Ö: "o",
    Ø: "o",
    Õ: "o",
    Œ: "oe",
    Ŕ: "r",
    Ř: "r",
    Ś: "s",
    Ș: "s",
    Š: "s",
    Ş: "s",
    Ť: "t",
    Ț: "t",
    Þ: "th",
    Ū: "u",
    Ű: "u",
    Ų: "u",
    Ů: "u",
    Ü: "u",
    Ý: "y",
    Ź: "z",
    Ż: "z",
    Ž: "z",
  };

  // Apply character replacements
  for (const [char, replacement] of Object.entries(charMap)) {
    result = result.split(char).join(replacement);
  }

  // Remove any remaining non-Latin alphanumeric characters and convert to lowercase
  return result.toLowerCase().replace(/[^a-z0-9]/g, "");
}
