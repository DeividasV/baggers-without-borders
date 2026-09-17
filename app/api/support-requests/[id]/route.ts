import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession, isAdmin } from "@/src/lib/api-auth";

/**
 * GET /api/support-requests/[id]
 * Get a single support request with attachments
 * Admin-only route
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supportRequest = await prisma.supportRequest.findUnique({
      where: { id },
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        hof: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                username: true,
              },
            },
            attachments: true,
          },
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: {
                id: true,
                displayName: true,
                username: true,
              },
            },
          },
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!supportRequest) {
      return NextResponse.json(
        { error: "Support request not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: supportRequest });
  } catch (err) {
    console.error("Error fetching support request:", err);
    return NextResponse.json(
      { error: "Failed to fetch support request" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/support-requests/[id]
 * Update a support request (status, category, priority, assignment)
 * Admin-only route
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, category, priority, assignedToId } = body;

    // Build update data
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date();
      }
    }

    if (category) {
      updateData.category = category;
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;
    }

    // Check if this is first response
    const existing = await prisma.supportRequest.findUnique({
      where: { id },
      select: { respondedAt: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Support request not found" },
        { status: 404 },
      );
    }

    if (!existing.respondedAt && status === "IN_PROGRESS") {
      updateData.respondedAt = new Date();
    }

    // Use transaction to update ticket and log status change
    const supportRequest = await prisma.$transaction(async (tx) => {
      // Log status change if status is being updated
      if (status && status !== existing.status) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: id,
            changedById: userId,
            oldStatus: existing.status,
            newStatus: status,
          },
        });
      }

      // Update the support request
      return tx.supportRequest.update({
        where: { id },
        data: updateData,
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
              username: true,
            },
          },
          notes: {
            select: {
              id: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ data: supportRequest });
  } catch (err) {
    console.error("Error updating support request:", err);
    return NextResponse.json(
      { error: "Failed to update support request" },
      { status: 500 },
    );
  }
}
