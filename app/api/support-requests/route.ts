import { NextRequest, NextResponse } from "next/server";
import { SITE_NAME } from "@/src/config/site";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/src/lib/prisma";
import { sendEmail } from "@/src/lib/email";
import { getOptionalSession, getSession, isAdmin } from "@/src/lib/api-auth";
import { checkRateLimit } from "@/src/lib/rateLimit";
import { verifyTurnstileToken } from "@/src/lib/turnstile";
import { getSupportRequestsDir, UPLOAD_PATHS } from "@/src/lib/constants";

// Fallback recipient for support notifications when no clerk is resolved.
// Never hardcode a personal address here - configure SUPPORT_FALLBACK_EMAIL
// (or BREVO_SENDER_EMAIL) in the environment instead.
const FALLBACK_EMAIL =
  process.env.SUPPORT_FALLBACK_EMAIL || process.env.BREVO_SENDER_EMAIL || "no-reply@example.com";

/**
 * GET /api/support-requests
 * List support requests with filters and pagination
 * Admin-only route
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await getSession();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Parse params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const priority = searchParams.get("priority") || "";
    const assignedToId = searchParams.get("assignedToId") || "";
    const hasAttachments = searchParams.get("hasAttachments") === "true";

    // 3. Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { subject: { contains: search } },
        { message: { contains: search } },
        {
          notes: {
            some: { content: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToId) {
      if (assignedToId === "unassigned") {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedToId;
      }
    }

    if (hasAttachments) {
      where.OR = [
        { attachments: { some: {} } },
        { notes: { some: { attachments: { some: {} } } } },
      ];
    }

    // 4. Trace query for debugging
    console.log("[Support API] Querying with:", JSON.stringify(where));

    // 5. Execute queries
    const [total, data] = await Promise.all([
      prisma.supportRequest.count({ where }),
      prisma.supportRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          attachments: true,
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          _count: {
            select: {
              notes: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("[Support API Error]", err);
    return NextResponse.json(
      { error: "Failed to fetch support requests", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/support-requests
 * Create a new support request with file attachments
 * Public route (optional authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession();
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const category = (formData.get("category") as string) || "GENERAL";
    const hofId = formData.get("hofId") as string | null;
    const turnstileToken = formData.get("turnstileToken") as string | null;

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // SECURITY: Turnstile CAPTCHA for unauthenticated users
    // Why CAPTCHA only for public users?
    // - Prevents automated spam bots from flooding the helpdesk
    // - Authenticated users already verified via email during registration
    // - Cloudflare Turnstile is privacy-friendly (GDPR compliant, no tracking)
    // - Gracefully bypassed in development mode for testing
    if (!session) {
      if (!turnstileToken) {
        return NextResponse.json({ error: "Security verification required." }, { status: 403 });
      }
      const turnstileResult = await verifyTurnstileToken(turnstileToken);
      if (!turnstileResult.success) {
        return NextResponse.json(
          { error: "Security verification failed. Please try again." },
          { status: 403 }
        );
      }
    }

    // SECURITY: Rate limiting (5 requests per 15 minutes)
    // Why combine IP + email for rate limit key?
    // - Prevents single IP from spamming with different emails
    // - Prevents single email from spamming via different IPs (VPN hopping)
    // - Hashes the combined key for privacy (SHA-256)
    // - Allows legitimate users to submit multiple tickets over time
    const clientIp =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = `${clientIp}-${email}`;

    const rateLimitAllowed = await checkRateLimit(rateLimitKey, "support-request");

    if (!rateLimitAllowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Process file uploads
    const files = formData.getAll("files") as File[];
    const attachments: {
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      path: string;
    }[] = [];

    if (files.length > 0) {
      // Create upload directory
      const uploadsDir = getSupportRequestsDir();
      await mkdir(uploadsDir, { recursive: true });

      for (const file of files) {
        if (file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const ext = path.extname(file.name);
          const filename = `${uuidv4()}${ext}`;
          const filePath = path.join(uploadsDir, filename);

          await writeFile(filePath, buffer);

          attachments.push({
            filename,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            path: `${UPLOAD_PATHS.SUPPORT_REQUESTS}${filename}`,
          });
        }
      }
    }

    // Resolve recipient based on category and fallback chain
    let recipientEmail = FALLBACK_EMAIL;
    let recipientName = "Admin";

    try {
      if (category === "HOF_DATA" && hofId) {
        // Get HoF Meister from latest year config
        const latestYear = await prisma.year.findFirst({
          where: { isActive: true },
          orderBy: { code: "desc" },
        });

        if (latestYear) {
          const config = await prisma.hofYearConfig.findUnique({
            where: {
              hofId_yearId: {
                hofId,
                yearId: latestYear.id,
              },
            },
            include: {
              hofmeister: {
                select: { email: true, displayName: true },
              },
            },
          });

          if (config?.hofmeister?.email) {
            recipientEmail = config.hofmeister.email;
            recipientName = config.hofmeister.displayName;
          }
        }
      } else if (category === "GENERAL") {
        // Get Clerk email from settings
        const clerkSetting = await prisma.appSetting.findUnique({
          where: { key: "support_clerk_email" },
        });

        if (clerkSetting?.value) {
          recipientEmail = clerkSetting.value;
          recipientName = "HoF Clerk";
        }
      }
    } catch (err) {
      console.error("Error resolving recipient:", err);
      // Continue with fallback email
    }

    // Create support request record
    const supportRequest = await prisma.supportRequest.create({
      data: {
        name,
        email,
        subject,
        message,
        category,
        hofId,
        userId: session?.user?.id,
        attachments: {
          create: attachments,
        },
      },
      include: {
        attachments: true,
      },
    });

    // Send notification email to recipient
    const categoryLabels = {
      GENERAL: "General Question",
      HOF_DATA: "HoF Table Data",
    };

    const notificationHtml = `
      <h2>New Support Request</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Category:</strong> ${
        categoryLabels[category as keyof typeof categoryLabels] || category
      }</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <h3>Message:</h3>
      <p style="white-space: pre-wrap;">${message}</p>
      ${
        attachments.length > 0
          ? `<hr /><p><strong>Attachments:</strong> ${attachments.length} file(s)</p>`
          : ""
      }
      <hr />
      <p style="color: #666; font-size: 12px;">Request ID: ${supportRequest.id}</p>
    `;

    const notificationText = `
New Support Request

From: ${name} (${email})
Category: ${categoryLabels[category as keyof typeof categoryLabels] || category}
Subject: ${subject}

Message:
${message}

${attachments.length > 0 ? `Attachments: ${attachments.length} file(s)` : ""}

Request ID: ${supportRequest.id}
    `;

    try {
      const emailResult = await sendEmail({
        to: {
          email: recipientEmail,
          name: recipientName,
        },
        subject: `[${SITE_NAME} support] ${
          categoryLabels[category as keyof typeof categoryLabels] || category
        }: ${subject}`,
        htmlContent: notificationHtml,
        textContent: notificationText,
        emailType: "support-request-notification",
        recipientUserId: session?.user?.id,
      });

      // Link email log to support request
      if (emailResult.success) {
        await prisma.supportRequest.update({
          where: { id: supportRequest.id },
          data: { emailLogId: emailResult.emailLogId },
        });
      }
    } catch (emailErr) {
      console.error("Failed to send notification email:", emailErr);
      // Continue - request is still created
    }

    // Send auto-confirmation to requester
    const confirmationHtml = `
      <h2>Thank you for contacting ${SITE_NAME}</h2>
      <p>Dear ${name},</p>
      <p>We have received your ${
        categoryLabels[category as keyof typeof categoryLabels]?.toLowerCase() || "request"
      } and will get back to you as soon as possible.</p>
      
      <hr />
      <h3>Your Request Summary:</h3>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Category:</strong> ${
        categoryLabels[category as keyof typeof categoryLabels] || category
      }</p>
      <p style="white-space: pre-wrap;"><strong>Message:</strong><br />${message}</p>
      ${
        attachments.length > 0
          ? `<p><strong>Attachments:</strong> ${attachments.length} file(s)</p>`
          : ""
      }
      <hr />
      
      <p>If you have any additional information to add, please reply to this email.</p>
      <p>Best regards,<br />${SITE_NAME}</p>
      
      <p style="color: #666; font-size: 12px;">Reference ID: ${supportRequest.id}</p>
    `;

    const confirmationText = `
Thank you for contacting ${SITE_NAME}

Dear ${name},

We have received your ${
      categoryLabels[category as keyof typeof categoryLabels]?.toLowerCase() || "request"
    } and will get back to you as soon as possible.

---
Your Request Summary:

Subject: ${subject}
Category: ${categoryLabels[category as keyof typeof categoryLabels] || category}
Message:
${message}

${attachments.length > 0 ? `Attachments: ${attachments.length} file(s)` : ""}
---

If you have any additional information to add, please reply to this email.

Best regards,
${SITE_NAME}

Reference ID: ${supportRequest.id}
    `;

    try {
      await sendEmail({
        to: {
          email,
          name,
        },
        subject: `Your ${SITE_NAME} support request has been received`,
        htmlContent: confirmationHtml,
        textContent: confirmationText,
        emailType: "support-request-confirmation",
        recipientUserId: session?.user?.id,
      });
    } catch (emailErr) {
      console.error("Failed to send confirmation email:", emailErr);
      // Continue - request is still created
    }

    return NextResponse.json(
      {
        data: {
          id: supportRequest.id,
          message: "Support request submitted successfully",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating support request:", err);
    return NextResponse.json({ error: "Failed to submit support request" }, { status: 500 });
  }
}
