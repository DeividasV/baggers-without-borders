import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isTokenExpired } from "@/src/lib/tokens";
import { logAuthEvent } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check if token expired
    if (isTokenExpired(user.emailVerificationExpires)) {
      return NextResponse.json(
        {
          error: "Verification token has expired. Please request a new one.",
          expired: true,
        },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified. You can log in now." },
        { status: 200 }
      );
    }

    // Update user - verify email and activate account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
        status: "ACTIVE",
      },
    });

    // Log successful email verification
    await logAuthEvent(
      EventType.AUTH_EMAIL_VERIFY_SUCCESS,
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
          "Email verified successfully! You can now log in to your account.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Email verification error:", error);

    // Log failed email verification
    await logAuthEvent(
      EventType.AUTH_EMAIL_VERIFY_FAILED,
      EventStatus.FAILURE,
      request.headers,
      {
        actionDetails: {
          error: error.message,
        },
        errorMessage: "Email verification failed",
      }
    );

    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
