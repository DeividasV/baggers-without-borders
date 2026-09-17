-- AlterTable: Rename name to displayName, yearOfBirth to birthYear, and drop birthRegion
ALTER TABLE "users" RENAME COLUMN "name" TO "displayName";
ALTER TABLE "users" RENAME COLUMN "yearOfBirth" TO "birthYear";

-- Drop birthRegion column
PRAGMA foreign_keys=off;
BEGIN TRANSACTION;

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
    "forumJoinDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_users" 
SELECT 
    "id", "username", "password", "email", "role", 
    "displayName", "givenName", "familyName", "gender", "birthYear",
    "birthCountry", "residenceCountry", "residenceRegion",
    "memberCount", "forumMemberCount", "is2024Participant", "isRegistered",
    "prHallConsent", "pIndexConsent", "infoRetentionConsent", "publishTotalsConsent",
    "peakbaggerId", "peakbaggerMember", "peakbaggerUrl", "peakbaggerAllAscents",
    "bwbForumNickname", "hillBaggingId", "forumJoinDate",
    "createdAt", "updatedAt"
FROM "users";

DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

COMMIT;
PRAGMA foreign_keys=on;
