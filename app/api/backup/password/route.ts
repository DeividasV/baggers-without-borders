import { NextRequest, NextResponse } from "next/server";

// GET - Get the backup password (admin only)
export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated and is ADMIN

    const password =
      process.env.BACKUP_PASSWORD || "default-password-change-me";

    return NextResponse.json({ password });
  } catch (error) {
    console.error("Error getting backup password:", error);
    return NextResponse.json(
      { error: "Failed to get backup password" },
      { status: 500 }
    );
  }
}
