-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_year_participations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dataNotProvided" BOOLEAN NOT NULL DEFAULT false,
    "countryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_year_participations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_year_participations_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_year_participations_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_user_year_participations" ("countryId", "createdAt", "enabled", "id", "updatedAt", "userId", "yearId") SELECT "countryId", "createdAt", "enabled", "id", "updatedAt", "userId", "yearId" FROM "user_year_participations";
DROP TABLE "user_year_participations";
ALTER TABLE "new_user_year_participations" RENAME TO "user_year_participations";
CREATE UNIQUE INDEX "user_year_participations_userId_yearId_key" ON "user_year_participations"("userId", "yearId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
