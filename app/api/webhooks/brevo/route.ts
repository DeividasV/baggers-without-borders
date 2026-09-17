import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// Brevo webhook IP ranges (from Brevo documentation)
const BREVO_IP_RANGES = [
  "185.107.232.", // 185.107.232.0/24
  "1.179.112.", // 1.179.112.0/20 (simplified prefix check)
  "1.179.113.",
  "1.179.114.",
  "1.179.115.",
  "1.179.116.",
  "1.179.117.",
  "1.179.118.",
  "1.179.119.",
  "1.179.120.",
  "1.179.121.",
  "1.179.122.",
  "1.179.123.",
  "1.179.124.",
  "1.179.125.",
  "1.179.126.",
  "1.179.127.",
];

/**
 * Check if IP is from Brevo
 */
function isBrevoIP(ip: string): boolean {
  return BREVO_IP_RANGES.some((range) => ip.startsWith(range));
}

/**
 * Brevo webhook handler
 * Receives delivery status updates for sent emails
 */
export async function POST(request: NextRequest) {
  try {
    // Validate IP address
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip =
      forwardedFor?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (ip === "unknown" || !isBrevoIP(ip)) {
      console.warn(`Webhook called from unauthorized IP: ${ip}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse webhook payload
    const payload = await request.json();

    // Brevo webhook payload structure:
    // {
    //   "event": "delivered" | "hard_bounce" | "soft_bounce" | "blocked",
    //   "email": "user@example.com",
    //   "id": 123456,
    //   "date": "2023-12-15 12:34:56",
    //   "message-id": "<...@smtp-relay.mailin.fr>",
    //   "ts": 1702647296,
    //   "subject": "Email subject",
    //   "reason": "Reason for bounce/block (optional)"
    // }

    const { event, "message-id": messageId, date, reason } = payload;

    if (!event || !messageId) {
      console.warn("Webhook missing required fields:", payload);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Find email log by Brevo message ID
    const emailLog = await prisma.emailLog.findUnique({
      where: { brevoMessageId: messageId },
    });

    if (!emailLog) {
      console.warn(`Email log not found for message ID: ${messageId}`);
      // Return success anyway - webhook may be for email not in our system
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Update status based on event type
    const updates: any = {};
    const eventDate = date ? new Date(date) : new Date();

    switch (event) {
      case "delivered":
        updates.status = "DELIVERED";
        updates.deliveredAt = eventDate;
        break;

      case "hard_bounce":
      case "soft_bounce":
        updates.status = "BOUNCED";
        updates.bouncedAt = eventDate;
        if (reason) {
          updates.errorMessage = reason;
        }
        break;

      case "blocked":
      case "spam":
        updates.status = "FAILED";
        updates.bouncedAt = eventDate;
        if (reason) {
          updates.errorMessage = `${event}: ${reason}`;
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
        return NextResponse.json({ received: true }, { status: 200 });
    }

    // Update email log
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: updates,
    });

    console.log(`Webhook processed: ${event} for email log ${emailLog.id}`);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
