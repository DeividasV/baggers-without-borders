/**
 * Email templates for authentication flows.
 *
 * The site name and the operator notice come from `src/config/site.ts`, so a
 * deployment shows its own name rather than the original project's.
 */
import { OPERATOR_NAME, SITE_NAME, SOFTWARE_COPYRIGHT } from "@/src/config/site";

/** Footer shared by every template: the software notice, plus the operator when set. */
const FOOTER_HTML = `<p>${SOFTWARE_COPYRIGHT}</p>${
  OPERATOR_NAME ? `\n      <p>Operated by ${OPERATOR_NAME}</p>` : ""
}`;
const FOOTER_TEXT = `${SOFTWARE_COPYRIGHT}${OPERATOR_NAME ? `\nOperated by ${OPERATOR_NAME}` : ""}`;

interface VerificationEmailParams {
  token: string;
  appUrl: string;
  displayName?: string;
}

interface PasswordResetEmailParams {
  token: string;
  appUrl: string;
  displayName?: string;
}

/**
 * Generate verification email content
 */
export function getVerificationEmail(params: VerificationEmailParams): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const { token, appUrl, displayName } = params;
  const verificationLink = `${appUrl}/verify-email?token=${token}`;
  const greeting = displayName ? `Hello ${displayName}` : "Hello";

  const subject = `Verify your email address - ${SITE_NAME}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8B7355 0%, #6B5745 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background: #8B7355; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏔️ ${SITE_NAME}</h1>
    </div>
    <div class="content">
      <p>${greeting},</p>
      
      <p>Thank you for registering with ${SITE_NAME}! Please verify your email address to activate your account.</p>
      
      <p style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
      </p>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #666;">${verificationLink}</p>
      
      <p><strong>This link will expire in 24 hours.</strong></p>
      
      <p>If you didn't create an account with ${SITE_NAME}, please ignore this email.</p>
      
      <p>Happy bagging!<br>
      ${SITE_NAME}</p>
    </div>
    <div class="footer">
      ${FOOTER_HTML}
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
${greeting},

Thank you for registering with ${SITE_NAME}! Please verify your email address to activate your account.

Click here to verify: ${verificationLink}

This link will expire in 24 hours.

If you didn't create an account with ${SITE_NAME}, please ignore this email.

Happy bagging!
${SITE_NAME}

${FOOTER_TEXT}
  `;

  return { subject, htmlContent, textContent };
}

/**
 * Generate password reset email content
 */
export function getPasswordResetEmail(params: PasswordResetEmailParams): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const { token, appUrl, displayName } = params;
  const resetLink = `${appUrl}/reset-password?token=${token}`;
  const greeting = displayName ? `Hello ${displayName}` : "Hello";

  const subject = `Reset your password - ${SITE_NAME}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8B7355 0%, #6B5745 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background: #8B7355; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏔️ ${SITE_NAME}</h1>
    </div>
    <div class="content">
      <p>${greeting},</p>
      
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #666;">${resetLink}</p>
      
      <div class="warning">
        <p><strong>⚠️ This link will expire in 1 hour.</strong></p>
      </div>
      
      <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      
      <p>Best regards,<br>
      ${SITE_NAME}</p>
    </div>
    <div class="footer">
      ${FOOTER_HTML}
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
${greeting},

We received a request to reset your password. Click the link below to create a new password:

${resetLink}

⚠️ This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
${SITE_NAME}

${FOOTER_TEXT}
  `;

  return { subject, htmlContent, textContent };
}

/**
 * Generate admin-created user email content
 */
export function getAdminCreatedUserEmail(params: VerificationEmailParams): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const { token, appUrl, displayName } = params;
  const verificationLink = `${appUrl}/verify-email?token=${token}`;
  const greeting = displayName ? `Hello ${displayName}` : "Hello";

  const subject = `Your ${SITE_NAME} account has been created`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8B7355 0%, #6B5745 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background: #8B7355; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏔️ ${SITE_NAME}</h1>
    </div>
    <div class="content">
      <p>${greeting},</p>
      
      <p>An administrator has created an account for you on ${SITE_NAME}. To activate your account and set your password, please verify your email address:</p>
      
      <p style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email & Activate Account</a>
      </p>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #666;">${verificationLink}</p>
      
      <p><strong>This link will expire in 24 hours.</strong></p>
      
      <p>Once verified, you'll be able to log in and manage your climbing records.</p>
      
      <p>Welcome to the community!<br>
      ${SITE_NAME}</p>
    </div>
    <div class="footer">
      ${FOOTER_HTML}
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
${greeting},

An administrator has created an account for you on ${SITE_NAME}. To activate your account and set your password, please verify your email address:

${verificationLink}

This link will expire in 24 hours.

Once verified, you'll be able to log in and manage your climbing records.

Welcome to the community!
${SITE_NAME}

${FOOTER_TEXT}
  `;

  return { subject, htmlContent, textContent };
}
