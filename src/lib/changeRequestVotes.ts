import type { PrismaClient } from "@prisma/client";

type VoteClient = Pick<PrismaClient, "changeRequestVote" | "$queryRaw">;

export type ChangeRequestVoteSummary = {
  totalVotes: number;
  averageVote: number | null;
};

export type ChangeRequestVoteRow = {
  id: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    displayName: string;
    username: string;
  };
};

export function isMissingChangeRequestVoteSchema(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("change_request_votes") ||
    message.includes("changerequestvote") ||
    message.includes("no such table") ||
    message.includes("no such column")
  );
}

function buildVoteSummary(scores: number[]): ChangeRequestVoteSummary {
  if (scores.length === 0) {
    return {
      totalVotes: 0,
      averageVote: null,
    };
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return {
    totalVotes: scores.length,
    averageVote: Number((total / scores.length).toFixed(1)),
  };
}

export async function hasChangeRequestVoteTable(client: VoteClient): Promise<boolean> {
  // Tagged-template form ($queryRaw) rather than $queryRawUnsafe: the query is
  // constant, so there is nothing to interpolate and no injection surface.
  const rows = (await client.$queryRaw`
    SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'change_request_votes'
  `) as Array<{ name: string }>;

  return rows.length > 0;
}

export async function getChangeRequestVoteSummaryMap(
  client: VoteClient,
  changeRequestIds: string[]
): Promise<Record<string, ChangeRequestVoteSummary>> {
  if (changeRequestIds.length === 0) {
    return {};
  }

  if (!(await hasChangeRequestVoteTable(client))) {
    return Object.fromEntries(
      changeRequestIds.map((changeRequestId) => [
        changeRequestId,
        {
          totalVotes: 0,
          averageVote: null,
        },
      ])
    );
  }

  const votes = await client.changeRequestVote.findMany({
    where: {
      changeRequestId: {
        in: changeRequestIds,
      },
    },
    select: {
      changeRequestId: true,
      score: true,
    },
  });

  const groupedScores = new Map<string, number[]>();

  for (const vote of votes) {
    const scores = groupedScores.get(vote.changeRequestId) ?? [];
    scores.push(vote.score);
    groupedScores.set(vote.changeRequestId, scores);
  }

  const summaries: Record<string, ChangeRequestVoteSummary> = {};
  for (const changeRequestId of changeRequestIds) {
    summaries[changeRequestId] = buildVoteSummary(groupedScores.get(changeRequestId) ?? []);
  }

  return summaries;
}

export async function getChangeRequestVoteDetails(
  client: VoteClient,
  changeRequestId: string,
  currentUserId?: string
): Promise<{
  voteSummary: ChangeRequestVoteSummary;
  votes: ChangeRequestVoteRow[];
  currentUserVote: number | null;
}> {
  if (!(await hasChangeRequestVoteTable(client))) {
    return {
      voteSummary: {
        totalVotes: 0,
        averageVote: null,
      },
      votes: [],
      currentUserVote: null,
    };
  }

  const votes = await client.changeRequestVote.findMany({
    where: {
      changeRequestId,
    },
    select: {
      id: true,
      score: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
        },
      },
    },
    orderBy: [{ score: "desc" }, { user: { displayName: "asc" } }],
  });

  const currentUserVote =
    votes.find((vote) => (currentUserId ? vote.user.id === currentUserId : false))?.score ?? null;

  return {
    voteSummary: buildVoteSummary(votes.map((vote) => vote.score)),
    votes,
    currentUserVote,
  };
}
