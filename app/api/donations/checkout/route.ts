import { NextRequest, NextResponse } from "next/server";
import { SITE_NAME } from "@/src/config/site";
import { stripe } from "@/src/lib/stripe";
import { prisma } from "@/src/lib/prisma";
import { getOptionalSession } from "@/src/lib/api-auth";
import {
  isValidDonationAmount,
  isValidCurrency,
  isValidDonationType,
  isValidEmail,
  getAmountValidationError,
} from "@/src/lib/validation/donations";
import { DONATION_LIMITS } from "@/src/lib/constants/donations";
import { checkRateLimit } from "@/src/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent abuse of checkout session creation
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const isAllowed = await checkRateLimit(ip, "donation-checkout");
    if (!isAllowed) {
      return NextResponse.json(
        {
          error: "Too many donation attempts. Please wait 15 minutes before trying again.",
        },
        { status: 429 }
      );
    }

    const session = await getOptionalSession();
    const body = await request.json();

    const { amount, currency, type, donorEmail, donorName, returnTo } = body;

    // Validation
    if (!isValidDonationAmount(amount)) {
      const error = getAmountValidationError(amount);
      return NextResponse.json(
        {
          error:
            error ||
            `Donation amount must be between ${currency}1 and ${currency}${DONATION_LIMITS.MAX_AMOUNT.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    if (!isValidCurrency(currency)) {
      return NextResponse.json(
        { error: "Invalid currency (must be USD, EUR, or GBP)" },
        { status: 400 }
      );
    }

    if (!isValidDonationType(type)) {
      return NextResponse.json(
        { error: "Invalid donation type (must be ONE_TIME or MONTHLY)" },
        { status: 400 }
      );
    }

    if (!isValidEmail(donorEmail)) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    // Create dynamic Stripe price
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      product_data: {
        name: `${SITE_NAME} donation`,
      },
      ...(type === "MONTHLY" && { recurring: { interval: "month" } }),
    });

    // Build success and cancel URLs with returnTo parameter
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:1345";
    const successUrl = `${baseUrl}/donate/success${
      returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
    }`;
    const cancelUrl = `${baseUrl}/donate/cancelled${
      returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
    }`;

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: type === "MONTHLY" ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: donorEmail,
      metadata: {
        userId: session?.user?.id || "",
        donorName: donorName || "",
        donorEmail: donorEmail,
        donationType: type,
      },
    });

    // Store pending donation in database
    await prisma.donation.create({
      data: {
        amount: Math.round(amount * 100),
        currency,
        type,
        status: "PENDING",
        stripeSessionId: checkoutSession.id,
        userId: session?.user?.id || null,
        donorEmail,
        donorName: donorName || null,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Donation checkout error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}
