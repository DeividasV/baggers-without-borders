export type PasswordStrengthResult = {
  strength: number;
  label: string;
  color: string;
};

const getCrypto = (): Crypto => {
  const cryptoObj = (globalThis as any)?.crypto as Crypto | undefined;
  if (cryptoObj?.getRandomValues) return cryptoObj;
  throw new Error("Secure random generator not available");
};

const getRandomUint32 = (): number => {
  const cryptoObj = getCrypto();
  const arr = new Uint32Array(1);
  cryptoObj.getRandomValues(arr);
  return arr[0] as number;
};

const randomInt = (maxExclusive: number): number => {
  if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive must be a positive number");
  }

  // Rejection sampling to avoid modulo bias.
  const maxUint32 = 0x1_0000_0000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);

  while (true) {
    const x = getRandomUint32();
    if (x < limit) return x % maxExclusive;
  }
};

/**
 * Calculate password strength based on length and character variety.
 *
 * This is intentionally lightweight (no external deps) and matches the
 * behavior used throughout the app (User Profile + auth flows).
 */
export const calculatePasswordStrength = (
  password: string
): PasswordStrengthResult => {
  if (!password) return { strength: 0, label: "Empty", color: "bg-gray-500" };

  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return { strength: 25, label: "Weak", color: "bg-red-500" };
  if (score <= 4)
    return { strength: 50, label: "Fair", color: "bg-orange-500" };
  if (score <= 6)
    return { strength: 75, label: "Good", color: "bg-yellow-500" };
  return { strength: 100, label: "Strong", color: "bg-green-500" };
};

export const generateStrongPassword = (length = 18): string => {
  const charset = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    special: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  };

  const allChars =
    charset.lowercase + charset.uppercase + charset.numbers + charset.special;

  const pick = (chars: string) => chars.charAt(randomInt(chars.length));

  const chars: string[] = [];

  // Ensure at least one character from each category
  chars.push(pick(charset.lowercase));
  chars.push(pick(charset.uppercase));
  chars.push(pick(charset.numbers));
  chars.push(pick(charset.special));

  while (chars.length < length) {
    chars.push(pick(allChars));
  }

  // Fisher–Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};
