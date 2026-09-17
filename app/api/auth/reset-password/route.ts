import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isTokenExpired } from "@/src/lib/tokens";
import bcrypt from "bcryptjs";
import {
  verifyTurnstileToken,
  getClientIp,
  shouldBlockRequest,
} from "@/src/lib/turnstile";
import { logAuthEvent } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const body = await request.json();
    const { token, newPassword, turnstileToken } = body;

    // Verify Turnstile token (bot protection)
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (shouldBlockRequest(turnstileResult)) {
      console.warn("Reset password blocked by Turnstile:", {
        ip,
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

    if (turnstileResult.failedOpen) {
      console.warn("Reset password allowed despite Turnstile timeout:", {
        ip,
      });
    }

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Password validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must contain at least one letter and one number" },
        { status: 400 }
      );
    }

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token expired
    if (isTokenExpired(user.passwordResetExpires)) {
      return NextResponse.json(
        {
          error:
            "Reset token has expired. Please request a new password reset.",
          expired: true,
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user - set new password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Log successful password reset completion
    await logAuthEvent(
      EventType.AUTH_PASSWORD_RESET_COMPLETE_SUCCESS,
      EventStatus.SUCCESS,
      request.headers,
      {
        userId: user.id,
        actionDetails: {
          email: user.email,
        },
      }
    );

    return NextResponse.json(
      {
        message:
          "Password reset successfully! You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Reset password error:", error);
    // Log failed password reset completion
    await logAuthEvent(
      EventType.AUTH_PASSWORD_RESET_COMPLETE_FAILED,
      EventStatus.FAILURE,
      request.headers,
      {
        actionDetails: {
          error: error.message,
        },
        errorMessage: "Password reset failed",
      }
    );
    return NextResponse.json(
      { error: "Password reset failed. Please try again." },
      { status: 500 }
    );
  }
}
