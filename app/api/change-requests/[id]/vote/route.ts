import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";
import { resolveChangeRequestId } from "@/src/lib/changeRequestTickets";
import {
  getChangeRequestVoteDetails,
  hasChangeRequestVoteTable,
  isMissingChangeRequestVoteSchema,
} from "@/src/lib/changeRequestVotes";

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

    if (!(await hasChangeRequestVoteTable(prisma))) {
      return NextResponse.json(
        { error: "Admin likes aren't available until the latest database migration is applied." },
        { status: 503 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Enter a valid JSON request body." }, { status: 400 });
    }

    const score = Number(body?.score);

    if (!Number.isInteger(score) || score < 0 || score > 5) {
      return NextResponse.json({ error: "Enter a whole number from 0 to 5." }, { status: 400 });
    }

    try {
      if (score === 0) {
        await prisma.changeRequestVote.deleteMany({
          where: {
            changeRequestId: resolvedId,
            userId: session.user.id,
          },
        });
      } else {
        await prisma.changeRequestVote.upsert({
          where: {
            changeRequestId_userId: {
              changeRequestId: resolvedId,
              userId: session.user.id,
            },
          },
          update: {
            score,
          },
          create: {
            changeRequestId: resolvedId,
            userId: session.user.id,
            score,
          },
        });
      }
    } catch (error) {
      if (isMissingChangeRequestVoteSchema(error)) {
        return NextResponse.json(
          { error: "Admin likes aren't available until the latest database migration is applied." },
          { status: 503 }
        );
      }
      throw error;
    }

    const voteDetails = await getChangeRequestVoteDetails(prisma, resolvedId, session.user.id);

    await logAdminAction(
      EventType.ADMIN_CHANGE_REQUEST_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "ChangeRequest",
        resourceId: resolvedId,
        actionDetails: {
          action: score === 0 ? "vote-cleared" : "vote-set",
          score,
        },
      }
    );

    return NextResponse.json(voteDetails);
  } catch (error) {
    console.error("Error updating change request vote:", error);

    const { id } = await params;
    await logAdminAction(
      EventType.ADMIN_CHANGE_REQUEST_UPDATE,
      EventStatus.FAILURE,
      request.headers,
      session.user.id,
      {
        resourceType: "ChangeRequest",
        resourceId: id,
        errorMessage: (error as Error).message,
      }
    );

    return NextResponse.json(
      {
        error: "Couldn't save your admin like. Try again in a moment.",
      },
      { status: 500 }
    );
  }
}
