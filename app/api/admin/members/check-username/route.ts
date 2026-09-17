import { NextResponse } from "next/server";
import { isAdmin } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

/**
 * Check if a username is available
 * GET /api/admin/members/check-username?username=john.doe
 */
export async function GET(request: Request) {
  // Check admin authorization
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const excludeUserId = searchParams.get("excludeUserId");

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 },
      );
    }

    // Trim and validate username format before querying
    const trimmedUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(trimmedUsername)) {
      // Invalid format - consider it unavailable
      return NextResponse.json({
        available: false,
      });
    }

    // Check if username exists in database (excluding current user if provided)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: trimmedUsername,
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
      select: { id: true },
    });

    return NextResponse.json({
      available: !existingUser,
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 },
    );
  }
}
