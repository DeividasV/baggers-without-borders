"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { SITE_NAME } from "@/src/config/site";
import { useRouter } from "next/navigation";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import {
  PRESET_AMOUNTS,
  CURRENCY_SYMBOLS,
  DONATION_LIMITS,
  type Currency,
  type DonationType,
} from "@/src/lib/constants/donations";
import { isValidEmail, getAmountValidationError } from "@/src/lib/validation/donations";

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Fetch with timeout and retry logic for transient failures
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
  retries: number = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Retry on 5xx server errors (but not on 4xx client errors)
        if (response.status >= 500 && attempt < retries) {
          console.warn(`Attempt ${attempt + 1} failed with ${response.status}, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
          continue;
        }

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Retry on network errors and timeouts
      if (attempt < retries) {
        const isTimeout = error instanceof Error && error.name === "AbortError";
        console.warn(
          `Attempt ${attempt + 1} failed (${isTimeout ? "timeout" : "network error"}), retrying...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }
      // Last attempt failed, throw error
      throw error;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error("Unexpected retry loop exit");
}

interface DonationFormProps {
  prefilledEmail?: string;
  prefilledName?: string;
  returnTo?: string;
}

export default function DonationForm({
  prefilledEmail = "",
  prefilledName = "",
  returnTo,
}: DonationFormProps) {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [type, setType] = useState<DonationType>("MONTHLY");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [donorEmail, setDonorEmail] = useState(prefilledEmail);
  const [donorName, setDonorName] = useState(prefilledName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDonorEmail(prefilledEmail);
    setDonorName(prefilledName);
  }, [prefilledEmail, prefilledName]);

  // Memoize derived values to prevent recalculation
  const presets = useMemo(() => PRESET_AMOUNTS[type][currency], [type, currency]);
  const symbol = useMemo(() => CURRENCY_SYMBOLS[currency], [currency]);

  const getFinalAmount = useCallback((): number | null => {
    if (selectedAmount !== null) return selectedAmount;
    if (customAmount) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }, [selectedAmount, customAmount]);

  const validateForm = useCallback((): boolean => {
    const amount = getFinalAmount();

    const amountError = getAmountValidationError(amount || 0);
    if (amountError) {
      setError(amountError);
      return false;
    }

    if (!isValidEmail(donorEmail)) {
      setError("Please enter a valid email address");
      return false;
    }

    setError("");
    return true;
  }, [donorEmail, getFinalAmount]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      const amount = getFinalAmount();
      if (!amount) return;

      setLoading(true);
      setError("");

      try {
        const response = await fetchWithTimeout("/api/donations/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            currency,
            type,
            donorEmail,
            donorName: donorName || undefined,
            returnTo,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create checkout session");
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL received");
        }
      } catch (err) {
        // Provide user-friendly error messages
        let errorMessage = "Something went wrong";

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage = "Request timed out. Please check your connection and try again.";
          } else if (err.message.includes("Failed to fetch")) {
            errorMessage = "Network error. Please check your internet connection and try again.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setLoading(false);
      }
    },
    [validateForm, getFinalAmount, currency, type, donorEmail, donorName, returnTo]
  );

  return (
    <Card className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Header with optional back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary-400" />
            <h2 className="text-2xl font-bold text-primary-400">Donate to {SITE_NAME}</h2>
          </div>
          {returnTo && (
            <Link href={returnTo} className="shrink-0">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
            </Link>
          )}
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
          >
            {error}
          </div>
        )}

        {/* Currency Selection */}
        <div className="mb-6">
          <label htmlFor="currency-select" className="block text-sm font-medium text-gray-300 mb-2">
            Currency
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setCurrency(e.target.value as Currency);
              setSelectedAmount(null);
              setCustomAmount("");
            }}
            className="w-full bg-dark-800 border border-dark-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Donation Type */}
        <div className="mb-6">
          <div
            id="donation-type-label"
            className="block text-sm font-medium text-gray-300 mb-2"
            role="heading"
            aria-level={3}
          >
            Donation Type
          </div>
          <div className="flex gap-3" role="group" aria-labelledby="donation-type-label">
            <button
              type="button"
              onClick={() => {
                setType("MONTHLY");
                setSelectedAmount(null);
                setCustomAmount("");
              }}
              aria-pressed={type === "MONTHLY"}
              className={`flex-1 py-3.5 px-4 rounded-lg font-medium transition-all min-h-11 ${
                type === "MONTHLY"
                  ? "bg-primary-600 text-white border-2 border-primary-500"
                  : "bg-dark-800 text-gray-300 border-2 border-dark-600 hover:border-dark-500"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => {
                setType("ONE_TIME");
                setSelectedAmount(null);
                setCustomAmount("");
              }}
              aria-pressed={type === "ONE_TIME"}
              className={`flex-1 py-3.5 px-4 rounded-lg font-medium transition-all min-h-11 ${
                type === "ONE_TIME"
                  ? "bg-primary-600 text-white border-2 border-primary-500"
                  : "bg-dark-800 text-gray-300 border-2 border-dark-600 hover:border-dark-500"
              }`}
            >
              One-time
            </button>
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="mb-6">
          <div
            id="amount-label"
            className="block text-sm font-medium text-gray-300 mb-2"
            role="heading"
            aria-level={3}
          >
            Select Amount
          </div>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            role="group"
            aria-labelledby="amount-label"
          >
            {presets.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
                aria-pressed={selectedAmount === amount}
                aria-label={`Donate ${symbol}${amount}`}
                className={`py-3.5 px-4 rounded-lg font-semibold transition-all min-h-11 ${
                  selectedAmount === amount
                    ? "bg-primary-600 text-white border-2 border-primary-500"
                    : "bg-dark-800 text-gray-300 border-2 border-dark-600 hover:border-dark-500"
                }`}
              >
                {symbol}
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="mb-6">
          <label htmlFor="custom-amount" className="block text-sm font-medium text-gray-300 mb-2">
            Or Enter Custom Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              {symbol}
            </span>
            <Input
              id="custom-amount"
              type="number"
              min="1"
              max={DONATION_LIMITS.MAX_AMOUNT}
              step="0.01"
              value={customAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Enter amount"
              className="pl-10"
              aria-describedby="custom-amount-help"
            />
          </div>
          <p id="custom-amount-help" className="text-xs text-gray-500 mt-1 sr-only">
            Enter a custom donation amount
          </p>
        </div>

        {/* Donor Information */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="donor-email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <Input
              id="donor-email"
              type="email"
              value={donorEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDonorEmail(e.target.value)}
              placeholder="your@email.com"
              required
              aria-describedby="email-help"
            />
            <p id="email-help" className="text-xs text-gray-500 mt-1">
              For donation receipt and confirmation
            </p>
          </div>

          <div>
            <label htmlFor="donor-name" className="block text-sm font-medium text-gray-300 mb-2">
              Name (Optional)
            </label>
            <Input
              id="donor-name"
              type="text"
              value={donorName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDonorName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>

        {/* Donation Summary */}
        {getFinalAmount() && (
          <div
            className="mb-4 p-3 bg-primary-900/20 border border-primary-500/30 rounded-lg"
            role="status"
            aria-label="Donation summary"
          >
            <div className="text-sm text-gray-300">
              <span className="font-medium text-primary-400">Your donation:</span>
              <div className="mt-1 space-y-1">
                <div>
                  <span className="text-gray-400">Type:</span>{" "}
                  <span className="font-semibold">
                    {type === "MONTHLY" ? "Monthly" : "One-time"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Amount:</span>{" "}
                  <span className="font-semibold truncate">
                    {getFinalAmount()} {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          <span className="truncate">
            {loading
              ? "Processing..."
              : `Donate ${getFinalAmount() ? `${symbol}${getFinalAmount()}` : "Now"}`}
          </span>
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Secure payment processing powered by Stripe. The name shown on your bank statement is set
          by the site operator's Stripe account.
        </p>
      </form>
    </Card>
  );
}
