-- CreateTable
CREATE TABLE "rate_limit_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "rate_limit_attempts_identifier_type_createdAt_idx" ON "rate_limit_attempts"("identifier", "type", "createdAt");
