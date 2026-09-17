/**
 * Donation validation utilities
 */

import {
  DONATION_LIMITS,
  SUPPORTED_CURRENCIES,
  DONATION_TYPES,
} from "@/src/lib/constants/donations";

export function isValidDonationAmount(amount: number): boolean {
  return (
    amount >= DONATION_LIMITS.MIN_AMOUNT && amount <= DONATION_LIMITS.MAX_AMOUNT
  );
}

export function isValidCurrency(currency: string): boolean {
  return SUPPORTED_CURRENCIES.includes(currency as any);
}

export function isValidDonationType(type: string): boolean {
  return DONATION_TYPES.includes(type as any);
}

export function isValidEmail(email: string): boolean {
  // RFC 5322 simplified email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getAmountValidationError(amount: number): string | null {
  if (!amount || amount <= 0) {
    return "Please select or enter a valid donation amount";
  }
  if (amount > DONATION_LIMITS.MAX_AMOUNT) {
    return `Maximum donation amount is ${DONATION_LIMITS.MAX_AMOUNT.toLocaleString()}`;
  }
  return null;
}
