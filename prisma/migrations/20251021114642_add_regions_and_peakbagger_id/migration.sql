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
    "forumJoinMonth" INTEGER
);
INSERT INTO "new_users" ("birthCountry", "bwbForumNickname", "createdAt", "email", "familyName", "forumJoinMonth", "forumMemberCount", "gender", "hillBaggingId", "id", "infoRetentionConsent", "is2024Participant", "isRegistered", "memberCount", "name", "pIndexConsent", "password", "peakbaggerAllAscents", "peakbaggerMember", "peakbaggerUrl", "personalName", "prHallConsent", "publishTotalsConsent", "residenceCountry", "role", "updatedAt", "username", "yearOfBirth") SELECT "birthCountry", "bwbForumNickname", "createdAt", "email", "familyName", "forumJoinMonth", coalesce("forumMemberCount", 0) AS "forumMemberCount", "gender", "hillBaggingId", "id", "infoRetentionConsent", coalesce("is2024Participant", false) AS "is2024Participant", coalesce("isRegistered", false) AS "isRegistered", coalesce("memberCount", 0) AS "memberCount", "name", "pIndexConsent", "password", coalesce("peakbaggerAllAscents", false) AS "peakbaggerAllAscents", "peakbaggerMember", "peakbaggerUrl", "personalName", "prHallConsent", "publishTotalsConsent", "residenceCountry", "role", "updatedAt", "username", "yearOfBirth" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
