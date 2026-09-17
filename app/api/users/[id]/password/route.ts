import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/src/lib/api-auth";
import { logUserAction, logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const { id } = await params;
    const userId = id;
    const { password } = await request.json();

    console.log("[PASSWORD CHANGE] User ID:", userId);
    console.log("[PASSWORD CHANGE] Password length:", password?.length);
    console.log("[PASSWORD CHANGE] Password received:", password);

    // Validate password
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(
      "[PASSWORD CHANGE] Hash generated:",
      hashedPassword.substring(0, 29) + "..."
    );

    // Update user password and timestamp
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        passwordChangedAt: true,
      },
    });

    console.log(
      "[PASSWORD CHANGE] Success for user:",
      user.username,
      "at",
      user.passwordChangedAt
    );

    // Log password change
    const session = await getSession();
    if (session) {
      // Check if admin is changing someone else's password or user changing their own
      const isAdminChangingOtherPassword = session.user.id !== userId;

      if (isAdminChangingOtherPassword) {
        // Log as admin action
        await logAdminAction(
          EventType.AUTH_PASSWORD_CHANGE,
          EventStatus.SUCCESS,
          request.headers,
          session.user.id,
          {
            resourceType: "User",
            resourceId: userId,
            actionDetails: {
              targetUser: user.username,
              changedBy: "admin",
            },
          }
        );
      } else {
        // Log as user action
        await logUserAction(
          EventType.AUTH_PASSWORD_CHANGE,
          EventStatus.SUCCESS,
          request.headers,
          userId,
          {
            actionDetails: {
              changedBy: "self",
            },
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      passwordChangedAt: user.passwordChangedAt,
    });
  } catch (error) {
    console.error("Error updating password:", error);

    // Log failed password change
    try {
      const session = await getSession();
      const { id } = await params;
      if (session) {
        const isAdminChangingOtherPassword = session.user.id !== id;

        if (isAdminChangingOtherPassword) {
          await logAdminAction(
            EventType.AUTH_PASSWORD_CHANGE,
            EventStatus.FAILURE,
            request.headers,
            session.user.id,
            {
              resourceType: "User",
              resourceId: id,
              errorMessage: "Failed to update password",
            }
          );
        } else {
          await logUserAction(
            EventType.AUTH_PASSWORD_CHANGE,
            EventStatus.FAILURE,
            request.headers,
            id,
            {
              errorMessage: "Failed to update password",
            }
          );
        }
      }
    } catch (logError) {
      console.error("Failed to log password change:", logError);
    }

    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
