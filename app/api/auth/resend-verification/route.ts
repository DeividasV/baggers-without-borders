import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { generateVerificationToken } from "@/src/lib/tokens";
import { sendEmail } from "@/src/lib/email";
import { getVerificationEmail } from "@/src/lib/email-templates";
import {
  verifyTurnstileToken,
  getClientIp,
  shouldBlockRequest,
} from "@/src/lib/turnstile";
import { logAuthEvent } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";
import { checkRateLimit } from "@/src/lib/rateLimit";

// Keep total attempts limit (beyond hourly rate limit)
const MAX_TOTAL_ATTEMPTS = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, turnstileToken } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Verify Turnstile token (bot protection)
    const ip = getClientIp(request.headers);
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (shouldBlockRequest(turnstileResult)) {
      console.warn("Resend verification blocked by Turnstile:", {
        ip,
        email,
        errors: turnstileResult["error-codes"],
      });
      return NextResponse.json(
        {
          error:
            "CAPTCHA verification failed. Please try again or refresh the page.",
        },
        { status: 400 }
      );
    }

    // Log if we failed open
    if (turnstileResult.failedOpen) {
      console.warn("Resend verification allowed despite Turnstile timeout:", {
        ip,
        email,
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a verification email has been sent.",
        },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified. You can log in now." },
        { status: 400 }
      );
    }

    // Check total resend count (absolute maximum)
    if (user.emailVerificationResendCount >= MAX_TOTAL_ATTEMPTS) {
      return NextResponse.json(
        {
          error: `Maximum verification attempts (${MAX_TOTAL_ATTEMPTS}) reached. Please contact support.`,
        },
        { status: 429 }
      );
    }

    // Check hourly rate limit (10 attempts per hour for email verification)
    const rateLimitOk = await checkRateLimit(email, "email-verification");
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many resend attempts. Please try again in an hour." },
        { status: 429 }
      );
    }

    // Generate new verification token (invalidates old one)
    const { token, expires } = generateVerificationToken();

    // Update user with new token and increment resend count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
        emailVerificationResendCount: { increment: 1 },
      },
    });

    // Send new verification email
    const appUrl = process.env.APP_URL || "http://localhost:1345";
    const emailTemplate = getVerificationEmail({
      token,
      appUrl,
      displayName: user.displayName,
    });

    await sendEmail({
      to: { email: user.email, name: user.displayName },
      subject: emailTemplate.subject,
      htmlContent: emailTemplate.htmlContent,
      textContent: emailTemplate.textContent,
      emailType: "VERIFICATION",
      recipientUserId: user.id,
    });

    // Log successful resend verification
    await logAuthEvent(
      EventType.AUTH_RESEND_VERIFY_SUCCESS,
      EventStatus.SUCCESS,
      request.headers,
      {
        userId: user.id,
        actionDetails: {
          email: user.email,
          resendCount: user.emailVerificationResendCount + 1,
        },
      }
    );

    return NextResponse.json(
      {
        message: "Verification email sent. Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Resend verification error:", error);

    // Log failed resend verification
    await logAuthEvent(
      EventType.AUTH_RESEND_VERIFY_FAILED,
      EventStatus.FAILURE,
      request.headers,
      {
        actionDetails: {
          error: error.message,
        },
        errorMessage: "Failed to resend verification email",
      }
    );

    return NextResponse.json(
      { error: "Failed to resend verification email. Please try again." },
      { status: 500 }
    );
  }
}
