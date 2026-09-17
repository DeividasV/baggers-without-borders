/**
 * Stripe client singleton
 *
 * Provides centralized Stripe SDK instance for server-side payment processing.
 * Uses the same singleton pattern as Prisma to ensure single instance across app.
 */

import Stripe from "stripe";

// Use a placeholder during build time (Next.js page data collection)
const STRIPE_KEY =
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_for_build";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  console.warn(
    "⚠️ STRIPE_SECRET_KEY not configured - Stripe functionality will not work",
  );
}

// Initialize Stripe with secret key
export const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});
