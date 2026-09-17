import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession, getCurrentUserId, isAdmin } from "@/src/lib/api-auth";

// GET /api/support-requests/my-count - Get count of open tickets assigned to current user
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const count = await prisma.supportRequest.count({
      where: {
        assignedToId: userId,
        status: {
          in: ["OPEN", "IN_PROGRESS", "NEEDS_INFO", "WAITING_RESPONSE"],
        },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching ticket count:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket count" },
      { status: 500 },
    );
  }
}
