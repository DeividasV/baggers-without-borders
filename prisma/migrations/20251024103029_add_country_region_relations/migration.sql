/*
  Warnings:

  - You are about to alter the column `peakbaggerAllAscents` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

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
    "birthCountryId" TEXT,
    "residenceCountryId" TEXT,
    "residenceRegionId" TEXT,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_birthCountryId_fkey" FOREIGN KEY ("birthCountryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_residenceCountryId_fkey" FOREIGN KEY ("residenceCountryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_residenceRegionId_fkey" FOREIGN KEY ("residenceRegionId") REFERENCES "regions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("birthCountryId", "birthYear", "bwbForumNickname", "createdAt", "displayName", "email", "familyName", "forumJoinDate", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "pIndexConsent", "password", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountryId", "residenceRegionId", "role", "status", "updatedAt", "username") SELECT "birthCountryId", "birthYear", "bwbForumNickname", "createdAt", "displayName", "email", "familyName", "forumJoinDate", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "pIndexConsent", "password", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountryId", "residenceRegionId", "role", "status", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
