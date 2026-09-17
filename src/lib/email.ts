import { prisma } from "@/src/lib/prisma";
import { SITE_NAME } from "@/src/config/site";
import { hashContent } from "@/src/lib/tokens";
import { createId } from "@paralleldrive/cuid2";

interface SendEmailOptions {
  to: {
    email: string;
    name?: string;
  };
  subject: string;
  htmlContent: string;
  textContent?: string;
  emailType: string;
  sentByUserId?: string;
  recipientUserId?: string;
}

interface EmailResponse {
  success: boolean;
  emailLogId: string;
  brevoMessageId?: string;
  error?: string;
}

/**
 * Send email via Brevo API with full audit logging
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResponse> {
  const { to, subject, htmlContent, textContent, emailType, sentByUserId, recipientUserId } =
    options;

  const emailLogId = createId();

  // Determine recipient based on environment
  const isDevelopment = process.env.NODE_ENV === "development";
  const actualRecipient = isDevelopment
    ? {
        email: process.env.DEV_EMAIL_RECIPIENT || to.email,
        name: `[DEV: ${to.email}] ${to.name || ""}`,
      }
    : to;

  // Calculate retention date (90 days)
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + 90);

  try {
    // 1. Create initial email log entry (PENDING status)
    await prisma.emailLog.create({
      data: {
        id: emailLogId,
        recipientEmail: to.email, // Store original recipient
        recipientName: to.name,
        recipientUserId,
        subject,
        bodyHtml: htmlContent,
        bodyText: textContent,
        bodyHash: hashContent(htmlContent + (textContent || "")),
        emailType,
        status: "PENDING",
        sentByUserId,
        retentionDate,
      },
    });

    // 2. Validate required environment variables
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME;

    if (!apiKey || !senderEmail) {
      throw new Error(
        "Missing required environment variables: BREVO_API_KEY and BREVO_SENDER_EMAIL"
      );
    }

    // 3. Send via Brevo API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: senderName || SITE_NAME,
        },
        to: [actualRecipient],
        subject,
        htmlContent,
        textContent: textContent || undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // 4a. Update log with failure
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: "FAILED",
          errorMessage: result.message || "Unknown Brevo API error",
          errorCode: result.code?.toString(),
        },
      });

      return {
        success: false,
        emailLogId,
        error: result.message || "Failed to send email",
      };
    }

    // 4b. Update log with success
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: "SENT",
        brevoMessageId: result.messageId,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      emailLogId,
      brevoMessageId: result.messageId,
    };
  } catch (error: any) {
    // 5. Handle unexpected errors
    try {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: "FAILED",
          errorMessage: error.message || "Unknown error",
          retryCount: { increment: 1 },
        },
      });
    } catch (updateError) {
      console.error("Failed to update email log:", updateError);
    }

    return {
      success: false,
      emailLogId,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Get email sending statistics
 */
export async function getEmailStats(userId?: string) {
  const where = userId ? { recipientUserId: userId } : {};

  const [total, sent, failed, pending] = await Promise.all([
    prisma.emailLog.count({ where }),
    prisma.emailLog.count({ where: { ...where, status: "SENT" } }),
    prisma.emailLog.count({ where: { ...where, status: "FAILED" } }),
    prisma.emailLog.count({ where: { ...where, status: "PENDING" } }),
  ]);

  return { total, sent, failed, pending };
}
