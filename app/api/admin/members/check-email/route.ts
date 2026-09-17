import { NextResponse } from "next/server";
import { isAdmin } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

/**
 * Check if an email is available
 * GET /api/admin/members/check-email?email=user@example.com
 */
export async function GET(request: Request) {
  // Check admin authorization
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const excludeUserId = searchParams.get("excludeUserId");

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 },
      );
    }

    // Trim and validate email format before querying
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      // Invalid format - consider it unavailable
      return NextResponse.json({
        available: false,
      });
    }

    // Check if email exists in database (excluding current user if provided)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: trimmedEmail,
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
      select: { id: true },
    });

    return NextResponse.json({
      available: !existingUser,
    });
  } catch (error) {
    console.error("Error checking email availability:", error);
    return NextResponse.json(
      { error: "Failed to check email availability" },
      { status: 500 },
    );
  }
}
