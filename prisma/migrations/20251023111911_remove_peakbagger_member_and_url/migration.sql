/*
  Warnings:

  - You are about to drop the column `peakbaggerMember` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `peakbaggerUrl` on the `users` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "displayName" TEXT NOT NULL,
    "givenName" TEXT,
    "familyName" TEXT,
    "gender" TEXT,
    "birthYear" INTEGER,
    "birthCountry" TEXT,
    "residenceCountry" TEXT,
    "residenceRegion" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "forumMemberCount" INTEGER NOT NULL DEFAULT 0,
    "is2024Participant" BOOLEAN NOT NULL DEFAULT false,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "peakbaggerId" TEXT,
    "peakbaggerAllAscents" BOOLEAN NOT NULL DEFAULT false,
    "bwbForumNickname" TEXT,
    "hillBaggingId" TEXT,
    "forumJoinDate" DATETIME,
    "prHallConsent" DATETIME,
    "pIndexConsent" DATETIME,
    "infoRetentionConsent" DATETIME,
    "publishTotalsConsent" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("birthCountry", "birthYear", "bwbForumNickname", "createdAt", "displayName", "email", "familyName", "forumJoinDate", "forumMemberCount", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "is2024Participant", "isRegistered", "memberCount", "pIndexConsent", "password", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountry", "residenceRegion", "role", "updatedAt", "username") SELECT "birthCountry", "birthYear", "bwbForumNickname", "createdAt", "displayName", "email", "familyName", "forumJoinDate", "forumMemberCount", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "is2024Participant", "isRegistered", "memberCount", "pIndexConsent", "password", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountry", "residenceRegion", "role", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
