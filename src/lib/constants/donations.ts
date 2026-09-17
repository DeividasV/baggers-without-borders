/**
 * Donation system constants
 */

export const DONATION_LIMITS = {
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 10000,
} as const;

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP"] as const;
export const DONATION_TYPES = ["ONE_TIME", "MONTHLY"] as const;

export const PRESET_AMOUNTS = {
  MONTHLY: {
    USD: [5, 10, 15, 25],
    EUR: [5, 10, 15, 25],
    GBP: [5, 10, 15, 25],
  },
  ONE_TIME: {
    USD: [10, 25, 50, 100],
    EUR: [10, 25, 50, 100],
    GBP: [10, 25, 50, 100],
  },
} as const;

export const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
} as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
export type DonationType = (typeof DONATION_TYPES)[number];
