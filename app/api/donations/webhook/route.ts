import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/src/lib/stripe";
import { prisma } from "@/src/lib/prisma";
import { logEvent } from "@/src/lib/auditLog";
import { EventType, EventCategory, EventStatus } from "@prisma/client";
import { headers } from "next/headers";

async function getRawBody(request: NextRequest): Promise<string> {
  return await request.text();
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await getRawBody(request);
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        {
          error: `Webhook Error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        },
        { status: 400 }
      );
    }

    const headersList = await headers();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // Find the donation by Stripe session ID
        const donation = await prisma.donation.findUnique({
          where: { stripeSessionId: session.id },
        });

        if (!donation) {
          console.error("Donation not found for session:", session.id);
          break;
        }

        // Update donation status
        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            stripeSubscriptionId: session.subscription?.toString() || null,
          },
        });

        // Log success event
        await logEvent({
          eventType: EventType.DONATION_SUCCESS,
          eventCategory: EventCategory.USER,
          status: EventStatus.SUCCESS,
          userId: donation.userId,
          sessionId: null,
          headers: headersList,
          resourceType: "donation",
          resourceId: donation.id,
          actionDetails: {
            amount: donation.amount,
            currency: donation.currency,
            type: donation.type,
            stripeSessionId: session.id,
          },
        });

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;

        // Find and update donation
        const donation = await prisma.donation.findUnique({
          where: { stripeSessionId: session.id },
        });

        if (donation) {
          await prisma.donation.update({
            where: { id: donation.id },
            data: { status: "CANCELLED" },
          });

          // Log cancelled event
          await logEvent({
            eventType: EventType.DONATION_CANCELLED,
            eventCategory: EventCategory.USER,
            status: EventStatus.SUCCESS,
            userId: donation.userId,
            sessionId: null,
            headers: headersList,
            resourceType: "donation",
            resourceId: donation.id,
            actionDetails: {
              reason: "checkout_session_expired",
            },
          });
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);

    // Log failed event
    try {
      const headersList = await headers();
      await logEvent({
        eventType: EventType.DONATION_FAILED,
        eventCategory: EventCategory.USER,
        status: EventStatus.FAILURE,
        userId: null,
        sessionId: null,
        headers: headersList,
        resourceType: "donation",
        resourceId: undefined,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
