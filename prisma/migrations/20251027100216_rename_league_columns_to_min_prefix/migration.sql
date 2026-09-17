/*
  Warnings:

  - You are about to drop the column `altitudeCutoff` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `isolationCutoff` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `prominenceCutoff` on the `leagues` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leagues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minProminence" INTEGER NOT NULL DEFAULT 0,
    "minIsolation" INTEGER NOT NULL DEFAULT 0,
    "minAltitude" INTEGER NOT NULL DEFAULT 0,
    "minClimbs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_leagues" ("code", "createdAt", "description", "id", "isActive", "minClimbs", "title", "updatedAt") SELECT "code", "createdAt", "description", "id", "isActive", "minClimbs", "title", "updatedAt" FROM "leagues";
DROP TABLE "leagues";
ALTER TABLE "new_leagues" RENAME TO "leagues";
CREATE UNIQUE INDEX "leagues_code_key" ON "leagues"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
