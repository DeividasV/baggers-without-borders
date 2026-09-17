import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { generateResetToken } from "@/src/lib/tokens";
import { sendEmail } from "@/src/lib/email";
import { getPasswordResetEmail } from "@/src/lib/email-templates";
import {
  verifyTurnstileToken,
  getClientIp,
  shouldBlockRequest,
} from "@/src/lib/turnstile";
import { logAuthEvent } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";
import { checkRateLimit } from "@/src/lib/rateLimit";
import {
  buildIdentifierWhereClause,
  parseIdentifier,
} from "@/src/lib/identifierUtils";

export async function POST(request: NextRequest) {
  let email: string | undefined;

  try {
    const body = await request.json();
    email = body.email;
    const turnstileToken = body.turnstileToken;

    if (!email) {
      return NextResponse.json(
        { error: "Email or username is required" },
        { status: 400 }
      );
    }

    // Verify Turnstile token (bot protection)
    const ip = getClientIp(request.headers);
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (shouldBlockRequest(turnstileResult)) {
      console.warn("Password reset blocked by Turnstile:", {
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
      console.warn("Password reset allowed despite Turnstile timeout:", {
        ip,
        email,
      });
    }

    // Rate limiting
    const rateLimitOk = await checkRateLimit(email, "password-reset");
    if (!rateLimitOk) {
      return NextResponse.json(
        {
          error:
            "Too many password reset attempts. Please try again in an hour.",
        },
        { status: 429 }
      );
    }

    // Detect if input is email or username (same logic as login)
    const identifierInfo = parseIdentifier(email);

    // Find user by email or username
    const user = await prisma.user.findUnique({
      where: buildIdentifierWhereClause(email),
    });

    // Don't reveal if email exists for security
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // Check if email is verified (only verified emails can reset password)
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error:
            "Please verify your email address first before resetting your password.",
          needsVerification: true,
          email: user.email,
        },
        { status: 400 }
      );
    }

    // Generate reset token
    const { token, expires } = generateResetToken();

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    // Send password reset email
    const appUrl = process.env.APP_URL || "http://localhost:1345";
    const emailTemplate = getPasswordResetEmail({
      token,
      appUrl,
      displayName: user.displayName,
    });

    await sendEmail({
      to: { email: user.email, name: user.displayName },
      subject: emailTemplate.subject,
      htmlContent: emailTemplate.htmlContent,
      textContent: emailTemplate.textContent,
      emailType: "PASSWORD_RESET",
      recipientUserId: user.id,
    });

    // Log successful password reset request
    await logAuthEvent(
      EventType.AUTH_PASSWORD_RESET_REQUEST_SUCCESS,
      EventStatus.SUCCESS,
      request.headers,
      {
        userId: user.id,
        actionDetails: {
          email: user.email,
          identifierType: identifierInfo.type,
          identifier: identifierInfo.normalized,
        },
      }
    );

    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot password error:", error);

    // Log failed password reset request
    const identifierInfo = email
      ? parseIdentifier(email)
      : { type: "unknown", normalized: "" };
    await logAuthEvent(
      EventType.AUTH_PASSWORD_RESET_REQUEST_FAILED,
      EventStatus.FAILURE,
      request.headers,
      {
        actionDetails: {
          identifier: identifierInfo.normalized,
          identifierType: identifierInfo.type,
          error: error.message,
        },
        errorMessage: "Failed to process password reset",
      }
    );

    return NextResponse.json(
      { error: "Failed to process password reset. Please try again." },
      { status: 500 }
    );
  }
}
