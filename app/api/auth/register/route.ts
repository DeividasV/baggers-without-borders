import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
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

/**
 * Generate username from email
 * Handles collisions by appending numbers
 */
async function generateUsername(email: string): Promise<string> {
  const baseUsername = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");

  let username = baseUsername.toLowerCase();
  let attempt = 1;
  const MAX_ATTEMPTS = 100;

  while (attempt <= MAX_ATTEMPTS) {
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (!existing) {
      return username;
    }

    attempt++;
    username = `${baseUsername}-${attempt}`;
  }

  throw new Error(
    "Unable to generate unique username. Please provide a custom username."
  );
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(request.headers);
    const rateLimitOk = await checkRateLimit(ip, "registration");
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      email,
      password,
      displayName,
      username: providedUsername,
      turnstileToken,
    } = body;

    // Verify Turnstile token (bot protection)
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (shouldBlockRequest(turnstileResult)) {
      console.warn("Registration blocked by Turnstile:", {
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

    // Log if we failed open (allowed despite Turnstile timeout)
    if (turnstileResult.failedOpen) {
      console.warn("Registration allowed despite Turnstile timeout:", {
        ip,
        email,
      });
    }

    // Validation
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "Email, password, and display name are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one letter and one number" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email address is already registered" },
        { status: 400 }
      );
    }

    // Generate or validate username
    let username: string;
    if (providedUsername) {
      // Validate custom username
      if (
        providedUsername.length < 3 ||
        providedUsername.length > 30 ||
        !/^[a-zA-Z0-9_-]+$/.test(providedUsername)
      ) {
        return NextResponse.json(
          {
            error:
              "Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores",
          },
          { status: 400 }
        );
      }

      const existingUsername = await prisma.user.findUnique({
        where: { username: providedUsername },
      });

      if (existingUsername) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }

      username = providedUsername;
    } else {
      // Auto-generate from email
      try {
        username = await generateUsername(email);
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const { token, expires } = generateVerificationToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
        displayName,
        status: "NEW",
        emailVerified: null,
        emailVerificationToken: token,
        emailVerificationExpires: expires,
        emailVerificationResendCount: 1,
      },
    });

    // Get all active HOFs, Years, and ConsentTypes for auto-participation
    const [hofs, years, consentTypes] = await Promise.all([
      prisma.hallOfFame.findMany({ where: { isActive: true } }),
      prisma.year.findMany({ where: { isActive: true } }),
      prisma.consentType.findMany({ where: { status: "ACTIVE" } }),
    ]);

    // Create HOF participations (enabled by default)
    await prisma.userHofParticipation.createMany({
      data: hofs.map((hof) => ({
        userId: user.id,
        hofId: hof.id,
        enabled: true,
      })),
    } as any);

    // Create Year participations (enabled by default)
    await prisma.userYearParticipation.createMany({
      data: years.map((year) => ({
        userId: user.id,
        yearId: year.id,
        enabled: true,
        dataNotProvided: false,
      })),
    } as any);

    // Create consent records (accepted during registration)
    const now = new Date();
    await prisma.userConsent.createMany({
      data: consentTypes.map((consentType) => ({
        userId: user.id,
        consentTypeId: consentType.id,
        dateGiven: now,
        consentMethod: "registration",
        isRequired: true,
      })),
    } as any);

    // Log consent acceptance to audit trail
    await logAuthEvent(
      EventType.USER_PROFILE_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      {
        userId: user.id,
        actionDetails: {
          action: "consent_accepted",
          consentTypeIds: consentTypes.map((ct) => ct.id),
          method: "registration",
        },
      }
    );

    // Send verification email
    const appUrl = process.env.APP_URL || "http://localhost:1345";
    const emailTemplate = getVerificationEmail({
      token,
      appUrl,
      displayName,
    });

    await sendEmail({
      to: { email: user.email, name: displayName },
      subject: emailTemplate.subject,
      htmlContent: emailTemplate.htmlContent,
      textContent: emailTemplate.textContent,
      emailType: "VERIFICATION",
      recipientUserId: user.id,
    });

    // Log successful registration
    await logAuthEvent(
      EventType.AUTH_REGISTER_SUCCESS,
      EventStatus.SUCCESS,
      request.headers,
      {
        userId: user.id,
        actionDetails: {
          email: user.email,
          username,
        },
      }
    );

    return NextResponse.json(
      {
        message:
          "Registration successful! Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    // Log failed registration
    await logAuthEvent(
      EventType.AUTH_REGISTER_FAILED,
      EventStatus.FAILURE,
      request.headers,
      {
        actionDetails: {
          error: error.message,
        },
        errorMessage: "Registration failed",
      }
    );

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
