/*
  Warnings:

  - You are about to drop the column `prominenceValue` on the `leagues` table. All the data in the column will be lost.

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
    "prominenceCutoff" INTEGER NOT NULL DEFAULT 0,
    "minClimbs" INTEGER NOT NULL DEFAULT 0,
    "isolationCutoff" INTEGER NOT NULL DEFAULT 0,
    "altitudeCutoff" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_leagues" ("code", "createdAt", "description", "id", "isActive", "title", "updatedAt") SELECT "code", "createdAt", "description", "id", "isActive", "title", "updatedAt" FROM "leagues";
DROP TABLE "leagues";
ALTER TABLE "new_leagues" RENAME TO "leagues";
CREATE UNIQUE INDEX "leagues_code_key" ON "leagues"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
