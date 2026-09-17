CREATE TABLE "change_request_votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "changeRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "change_request_votes_changeRequestId_fkey"
      FOREIGN KEY ("changeRequestId") REFERENCES "change_requests" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "change_request_votes_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "change_request_votes_changeRequestId_userId_key"
ON "change_request_votes"("changeRequestId", "userId");

CREATE INDEX "change_request_votes_changeRequestId_idx"
ON "change_request_votes"("changeRequestId");

CREATE INDEX "change_request_votes_userId_idx"
ON "change_request_votes"("userId");

CREATE INDEX "change_request_votes_changeRequestId_score_idx"
ON "change_request_votes"("changeRequestId", "score");