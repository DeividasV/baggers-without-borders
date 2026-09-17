import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";
import {
  generateChangeRequestTicketIdentifiers,
  isMissingFriendlyTicketSchema,
} from "@/src/lib/changeRequestTickets";
import {
  getChangeRequestVoteSummaryMap,
  isMissingChangeRequestVoteSchema,
} from "@/src/lib/changeRequestVotes";

// GET /api/change-requests - List all change requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const source = searchParams.get("source") || "ALL";

    // Build where clause
    const where: Prisma.ChangeRequestWhereInput = {};

    // Search filter
    if (search) {
      const searchOr: Prisma.ChangeRequestWhereInput[] = [
        { title: { contains: search } },
        { description: { contains: search } },
        {
          createdBy: { displayName: { contains: search } },
        },
        { createdBy: { username: { contains: search } } },
      ];

      if (/^bwb-\d{4}-\d{4}$/i.test(search.trim())) {
        searchOr.unshift({ ticketNumber: { contains: search.toUpperCase() } });
      }

      where.OR = searchOr;
    }

    // Status filter
    if (status !== "ALL") {
      where.status = status;
    }

    // Source filter
    if (source === "GIT") {
      where.isFromGit = true;
    } else if (source === "MANUAL") {
      where.isFromGit = { not: true };
    }

    // Build orderBy
    let orderBy: Prisma.ChangeRequestOrderByWithRelationInput = {};
    switch (sortBy) {
      case "ticketNumber":
        orderBy = { ticketNumber: sortOrder };
        break;
      case "title":
        orderBy = { title: sortOrder };
        break;
      case "type":
        orderBy = { type: sortOrder };
        break;
      case "priority":
        orderBy = { priority: sortOrder };
        break;
      case "status":
        orderBy = { status: sortOrder };
        break;
      case "createdBy":
        orderBy = { createdBy: { displayName: sortOrder } };
        break;
      case "plannedTime":
        orderBy = { plannedTime: sortOrder };
        break;
      case "actualTime":
        orderBy = { actualTime: sortOrder };
        break;
      case "createdAt":
      default:
        orderBy = { createdAt: sortOrder };
        break;
    }

    // Get total count
    const total = await prisma.changeRequest.count({ where });

    // Get paginated data
    const changeRequests = await prisma.changeRequest.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        attachments: true,
        _count: {
          select: {
            attachments: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    let voteSummaryMap: Record<string, { totalVotes: number; averageVote: number | null }> = {};
    try {
      voteSummaryMap = await getChangeRequestVoteSummaryMap(
        prisma,
        changeRequests.map((changeRequest) => changeRequest.id)
      );
    } catch (error) {
      if (!isMissingChangeRequestVoteSchema(error)) {
        throw error;
      }
    }

    return NextResponse.json({
      data: changeRequests.map((changeRequest) => ({
        ...changeRequest,
        voteSummary: voteSummaryMap[changeRequest.id] ?? {
          totalVotes: 0,
          averageVote: null,
        },
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching change requests:", error);
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
      { error: "Couldn't load change requests. Try again." },
      { status: 500 }
    );
  }
}

// POST /api/change-requests - Create new change request (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Verify the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database. Please log in again." },
        { status: 400 }
      );
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
      plannedTime,
      actualTime,
      businessValue,
      affectedAreas,
      technicalDetails,
    } = body;

    // Validate required fields
    if (!title || !description || !type || !priority || !impact) {
      return NextResponse.json({ error: "Complete all required fields." }, { status: 400 });
    }

    // Validate enum values
    const validTypes = ["FEATURE", "BUG", "ENHANCEMENT", "DOCUMENTATION", "OTHER"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const validImpacts = ["LOW", "MEDIUM", "HIGH"];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Select a valid change type." }, { status: 400 });
    }

    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Select a valid priority." }, { status: 400 });
    }

    if (!validImpacts.includes(impact)) {
      return NextResponse.json({ error: "Select a valid impact." }, { status: 400 });
    }

    let changeRequest;
    try {
      changeRequest = await prisma.$transaction(async (tx) => {
        const { ticketNumber, ticketSlug } = await generateChangeRequestTicketIdentifiers(tx);

        return tx.changeRequest.create({
          data: {
            ticketNumber,
            ticketSlug,
            title,
            description,
            type,
            priority,
            impact,
            plannedTime: plannedTime ? parseFloat(plannedTime) : null,
            actualTime: actualTime ? parseFloat(actualTime) : null,
            businessValue: typeof businessValue === "string" ? businessValue : null,
            affectedAreas: typeof affectedAreas === "string" ? affectedAreas : null,
            technicalDetails: typeof technicalDetails === "string" ? technicalDetails : null,
            createdById: user.id, // Use the verified user ID
          },
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
      });
    } catch (error) {
      if (!isMissingFriendlyTicketSchema(error)) {
        throw error;
      }

      return NextResponse.json(
        {
          error:
            "Change request tickets are still being set up. Run the latest database migrations and try again.",
        },
        { status: 503 }
      );
    }

    // Log change request creation
    await logAdminAction(
      EventType.ADMIN_CHANGE_REQUEST_CREATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "ChangeRequest",
        resourceId: changeRequest.id,
        actionDetails: {
          title,
          type,
          priority,
          impact,
        },
      }
    );

    return NextResponse.json(changeRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating change request:", error);
    if (isMissingFriendlyTicketSchema(error)) {
      return NextResponse.json(
        {
          error:
            "Change request tickets are still being set up. Run the latest database migrations and try again.",
        },
        { status: 503 }
      );
    }

    // Log failure
    const session = await getSession();
    if (session) {
      await logAdminAction(
        EventType.ADMIN_CHANGE_REQUEST_CREATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "ChangeRequest",
          errorMessage: (error as Error).message,
        }
      );
    }

    // Return more detailed error info in production for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Couldn't create this change request. Try again.", details: errorMessage },
      { status: 500 }
    );
  }
}
