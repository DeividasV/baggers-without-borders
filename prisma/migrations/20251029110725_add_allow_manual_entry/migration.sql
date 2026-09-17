-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_hofs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "allowManualEntry" BOOLEAN NOT NULL DEFAULT true,
    "minProminence" INTEGER NOT NULL DEFAULT 0,
    "minIsolation" INTEGER NOT NULL DEFAULT 0,
    "minAltitude" INTEGER NOT NULL DEFAULT 0,
    "minClimbs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_hofs" ("code", "createdAt", "description", "displayOrder", "id", "isActive", "minAltitude", "minClimbs", "minIsolation", "minProminence", "title", "updatedAt") SELECT "code", "createdAt", "description", "displayOrder", "id", "isActive", "minAltitude", "minClimbs", "minIsolation", "minProminence", "title", "updatedAt" FROM "hofs";
DROP TABLE "hofs";
ALTER TABLE "new_hofs" RENAME TO "hofs";
CREATE UNIQUE INDEX "hofs_code_key" ON "hofs"("code");
CREATE TABLE "new_seasons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "allowManualEntry" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_seasons" ("code", "createdAt", "description", "displayOrder", "id", "isActive", "title", "updatedAt") SELECT "code", "createdAt", "description", "displayOrder", "id", "isActive", "title", "updatedAt" FROM "seasons";
DROP TABLE "seasons";
ALTER TABLE "new_seasons" RENAME TO "seasons";
CREATE UNIQUE INDEX "seasons_code_key" ON "seasons"("code");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "passwordChangedAt" DATETIME,
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
    "notes" TEXT DEFAULT '',
    "allowManualEntry" BOOLEAN NOT NULL DEFAULT true,
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
INSERT INTO "new_users" ("birthCountryId", "birthYear", "bwbForumNickname", "createdAt", "displayName", "email", "familyName", "forumJoinDate", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "notes", "pIndexConsent", "password", "passwordChangedAt", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountryId", "residenceRegionId", "role", "status", "updatedAt", "username") SELECT "birthCountryId", "birthYear", "bwbForumNickname", "createdAt", "displayName", "email", "familyName", "forumJoinDate", "gender", "givenName", "hillBaggingId", "id", "infoRetentionConsent", "notes", "pIndexConsent", "password", "passwordChangedAt", "peakbaggerAllAscents", "peakbaggerId", "prHallConsent", "publishTotalsConsent", "residenceCountryId", "residenceRegionId", "role", "status", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
