/*
  Warnings:

  - You are about to drop the column `forumMemberCount` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is2024Participant` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isRegistered` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `memberCount` on the `users` table. All the data in the column will be lost.

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
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "displayName" TEXT NOT NULL,
    "givenName" TEXT,
    "familyName" TEXT,
    "gender" TEXT,
    "birthYear" INTEGER,
    "birthCountry" TEXT,
    "residenceCountry" TEXT,
    "residenceRegion" TEXT,
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
INSERT INTO "new_users" ("birthCountry", "birthYear", "bwbForumNickname", "createdAt", "displayName", "email", "familyName", "forumJoinDate", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "pIndexConsent", "password", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountry", "residenceRegion", "role", "status", "updatedAt", "username") SELECT "birthCountry", "birthYear", "bwbForumNickname", "createdAt", "displayName", "email", "familyName", "forumJoinDate", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "pIndexConsent", "password", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountry", "residenceRegion", "role", "status", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
