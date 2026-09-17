/*
  Warnings:

  - You are about to drop the column `forumJoinMonth` on the `users` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "personalName" TEXT,
    "familyName" TEXT,
    "residenceCountry" TEXT,
    "residenceRegion" TEXT,
    "birthCountry" TEXT,
    "birthRegion" TEXT,
    "yearOfBirth" INTEGER,
    "gender" TEXT,
    "email" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "forumMemberCount" INTEGER NOT NULL DEFAULT 0,
    "is2024Participant" BOOLEAN NOT NULL DEFAULT false,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "prHallConsent" DATETIME,
    "pIndexConsent" DATETIME,
    "infoRetentionConsent" DATETIME,
    "publishTotalsConsent" DATETIME,
    "peakbaggerId" TEXT,
    "peakbaggerMember" TEXT,
    "peakbaggerUrl" TEXT,
    "peakbaggerAllAscents" BOOLEAN NOT NULL DEFAULT false,
    "bwbForumNickname" TEXT,
    "hillBaggingId" TEXT,
    "forumJoinDate" DATETIME
);
INSERT INTO "new_users" ("birthCountry", "birthRegion", "bwbForumNickname", "createdAt", "email", "familyName", "forumMemberCount", "gender", "hillBaggingId", "id", "infoRetentionConsent", "is2024Participant", "isRegistered", "memberCount", "name", "pIndexConsent", "password", "peakbaggerAllAscents", "peakbaggerId", "peakbaggerMember", "peakbaggerUrl", "personalName", "prHallConsent", "publishTotalsConsent", "residenceCountry", "residenceRegion", "role", "updatedAt", "username", "yearOfBirth") SELECT "birthCountry", "birthRegion", "bwbForumNickname", "createdAt", "email", "familyName", "forumMemberCount", "gender", "hillBaggingId", "id", "infoRetentionConsent", "is2024Participant", "isRegistered", "memberCount", "name", "pIndexConsent", "password", "peakbaggerAllAscents", "peakbaggerId", "peakbaggerMember", "peakbaggerUrl", "personalName", "prHallConsent", "publishTotalsConsent", "residenceCountry", "residenceRegion", "role", "updatedAt", "username", "yearOfBirth" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
