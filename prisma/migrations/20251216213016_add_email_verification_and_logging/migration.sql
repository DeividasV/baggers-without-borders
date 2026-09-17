/*
  Warnings:

  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "recipientUserId" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "bodyHash" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'transactional',
    "brevoMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "bouncedAt" DATETIME,
    "retentionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentByUserId" TEXT,
    CONSTRAINT "email_logs_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_logs_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_change_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "actualTime" REAL,
    "plannedTime" REAL,
    "commitHash" TEXT,
    "commitDate" DATETIME,
    "version" TEXT,
    "category" TEXT,
    "linesAdded" INTEGER,
    "linesDeleted" INTEGER,
    "filesChanged" INTEGER,
    "isFromGit" BOOLEAN NOT NULL DEFAULT false,
    "technicalDetails" TEXT,
    "businessValue" TEXT,
    "affectedAreas" TEXT,
    CONSTRAINT "change_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_change_requests" ("actualTime", "createdAt", "createdById", "description", "id", "impact", "plannedTime", "priority", "status", "title", "type", "updatedAt") SELECT "actualTime", "createdAt", "createdById", "description", "id", "impact", "plannedTime", "priority", "status", "title", "type", "updatedAt" FROM "change_requests";
DROP TABLE "change_requests";
ALTER TABLE "new_change_requests" RENAME TO "change_requests";
CREATE UNIQUE INDEX "change_requests_commitHash_key" ON "change_requests"("commitHash");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "passwordChangedAt" DATETIME,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" DATETIME,
    "emailVerificationResendCount" INTEGER NOT NULL DEFAULT 0,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "displayName" TEXT NOT NULL,
    "givenName" TEXT,
    "familyName" TEXT,
    "gender" TEXT,
    "birthYear" INTEGER,
    "birthCountryId" TEXT,
    "residenceCountryId" TEXT,
    "residenceRegionId" TEXT,
    "peakbaggerId" TEXT,
    "peakbaggerAllAscents" BOOLEAN NOT NULL DEFAULT false,
    "bwbForumNickname" TEXT,
    "hillBaggingId" TEXT,
    "forumJoinDate" DATETIME,
    "retiredYear" INTEGER,
    "deceasedYear" INTEGER,
    "notes" TEXT DEFAULT '',
    "allowManualEntry" BOOLEAN NOT NULL DEFAULT true,
    "prHallConsent" DATETIME,
    "pIndexConsent" DATETIME,
    "infoRetentionConsent" DATETIME,
    "publishTotalsConsent" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_residenceRegionId_fkey" FOREIGN KEY ("residenceRegionId") REFERENCES "regions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_residenceCountryId_fkey" FOREIGN KEY ("residenceCountryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_birthCountryId_fkey" FOREIGN KEY ("birthCountryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("allowManualEntry", "birthCountryId", "birthYear", "bwbForumNickname", "createdAt", "deceasedYear", "displayName", "email", "familyName", "forumJoinDate", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "notes", "pIndexConsent", "password", "passwordChangedAt", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountryId", "residenceRegionId", "retiredYear", "role", "status", "updatedAt", "username") SELECT "allowManualEntry", "birthCountryId", "birthYear", "bwbForumNickname", "createdAt", "deceasedYear", "displayName", "email", "familyName", "forumJoinDate", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "notes", "pIndexConsent", "password", "passwordChangedAt", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountryId", "residenceRegionId", "retiredYear", "role", "status", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_brevoMessageId_key" ON "email_logs"("brevoMessageId");

-- CreateIndex
CREATE INDEX "email_logs_recipientEmail_idx" ON "email_logs"("recipientEmail");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_emailType_idx" ON "email_logs"("emailType");

-- CreateIndex
CREATE INDEX "email_logs_createdAt_idx" ON "email_logs"("createdAt");

-- CreateIndex
CREATE INDEX "email_logs_brevoMessageId_idx" ON "email_logs"("brevoMessageId");
