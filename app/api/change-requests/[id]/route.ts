import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";
import {
  isMissingFriendlyTicketSchema,
  resolveChangeRequestId,
} from "@/src/lib/changeRequestTickets";
import {
  type ChangeRequestVoteRow,
  type ChangeRequestVoteSummary,
  getChangeRequestVoteDetails,
  isMissingChangeRequestVoteSchema,
} from "@/src/lib/changeRequestVotes";

// GET /api/change-requests/[id] - Get specific change request (admin only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    const resolvedId = await resolveChangeRequestId(id);
    if (!resolvedId) {
      return NextResponse.json({ error: "Change request not found." }, { status: 404 });
    }

    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id: resolvedId },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        attachments: true,
      },
    });

    if (!changeRequest) {
      return NextResponse.json({ error: "Change request not found." }, { status: 404 });
    }

    let voteDetails: {
      voteSummary: ChangeRequestVoteSummary;
      votes: ChangeRequestVoteRow[];
      currentUserVote: number | null;
    } = {
      voteSummary: { totalVotes: 0, averageVote: null },
      votes: [],
      currentUserVote: null,
    };

    try {
      voteDetails = await getChangeRequestVoteDetails(prisma, resolvedId, session.user.id);
    } catch (error) {
      if (!isMissingChangeRequestVoteSchema(error)) {
        throw error;
      }
    }

    return NextResponse.json({
      ...changeRequest,
      ...voteDetails,
    });
  } catch (error) {
    console.error("Error fetching change request:", error);
    if (isMissingFriendlyTicketSchema(error)) {
      return NextResponse.json(
        {
          error:
            "Change request tickets are still being set up. Run the latest database migrations and try again.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Couldn't load this change request. Try again." },
      { status: 500 }
    );
  }
}

// PUT /api/change-requests/[id] - Update change request (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const resolvedId = await resolveChangeRequestId(id);

    if (!resolvedId) {
      return NextResponse.json({ error: "Change request not found." }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Enter a valid JSON request body." }, { status: 400 });
    }

    const {
      title,
      description,
      type,
      priority,
      impact,
      status,
      plannedTime,
      actualTime,
      businessValue,
      affectedAreas,
      technicalDetails,
    } = body;

    // Validate enum values if provided
    const validTypes = ["FEATURE", "BUG", "ENHANCEMENT", "DOCUMENTATION", "OTHER"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const validImpacts = ["LOW", "MEDIUM", "HIGH"];
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED"];

    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: "Select a valid change type." }, { status: 400 });
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Select a valid priority." }, { status: 400 });
    }

    if (impact && !validImpacts.includes(impact)) {
      return NextResponse.json({ error: "Select a valid impact." }, { status: 400 });
    }

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Select a valid status." }, { status: 400 });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (type) updateData.type = type;
    if (priority) updateData.priority = priority;
    if (impact) updateData.impact = impact;
    if (status) updateData.status = status;
    if (plannedTime !== undefined) updateData.plannedTime = plannedTime || null;
    if (actualTime !== undefined) updateData.actualTime = actualTime || null;
    if (businessValue !== undefined) {
      updateData.businessValue = typeof businessValue === "string" ? businessValue : null;
    }
    if (affectedAreas !== undefined) {
      updateData.affectedAreas = typeof affectedAreas === "string" ? affectedAreas : null;
    }
    if (technicalDetails !== undefined) {
      updateData.technicalDetails = typeof technicalDetails === "string" ? technicalDetails : null;
    }

    const changeRequest = await prisma.changeRequest.update({
      where: { id: resolvedId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        attachments: true,
      },
    });

    // Log change request update
    await logAdminAction(
      EventType.ADMIN_CHANGE_REQUEST_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "ChangeRequest",
        resourceId: resolvedId,
        actionDetails: {
          title: changeRequest.title,
          updatedFields: Object.keys(updateData),
        },
      }
    );

    return NextResponse.json(changeRequest);
  } catch (error) {
    console.error("Error updating change request:", error);

    // Log failure
    if (session) {
      const params_resolved = await params;
      await logAdminAction(
        EventType.ADMIN_CHANGE_REQUEST_UPDATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "ChangeRequest",
          resourceId: params_resolved.id,
          errorMessage: (error as Error).message,
        }
      );
    }

    if (isMissingFriendlyTicketSchema(error)) {
      return NextResponse.json(
        {
          error:
            "Change request tickets are still being set up. Run the latest database migrations and try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Couldn't update this change request. Try again." },
      { status: 500 }
    );
  }
}

// DELETE /api/change-requests/[id] - Delete change request (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const resolvedId = await resolveChangeRequestId(id);

    if (!resolvedId) {
      return NextResponse.json({ error: "Change request not found." }, { status: 404 });
    }

    // Get change request before deleting for logging
    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id: resolvedId },
      select: { title: true, type: true },
    });

    if (!changeRequest) {
      return NextResponse.json({ error: "Change request not found." }, { status: 404 });
    }

    // Delete with cascade (attachments will be deleted automatically due to onDelete: Cascade in schema)
    await prisma.changeRequest.delete({
      where: { id: resolvedId },
    });

    // Log change request deletion
    await logAdminAction(
      EventType.ADMIN_CHANGE_REQUEST_DELETE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "ChangeRequest",
        resourceId: resolvedId,
        actionDetails: {
          title: changeRequest?.title,
          type: changeRequest?.type,
        },
      }
    );

    return NextResponse.json({ message: "Change request deleted." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting change request:", error);

    // Log failure
    if (session) {
      const params_resolved = await params;
      await logAdminAction(
        EventType.ADMIN_CHANGE_REQUEST_DELETE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "ChangeRequest",
          resourceId: params_resolved.id,
          errorMessage: (error as Error).message,
        }
      );
    }

    if (isMissingFriendlyTicketSchema(error)) {
      return NextResponse.json(
        {
          error:
            "Change request tickets are still being set up. Run the latest database migrations and try again.",
        },
        { status: 503 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Couldn't delete this change request. Try again.", details: errorMessage },
      { status: 500 }
    );
  }
}
