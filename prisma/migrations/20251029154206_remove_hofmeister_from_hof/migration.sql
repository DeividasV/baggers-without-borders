/*
  Warnings:

  - You are about to drop the column `hofmeisterId` on the `hofs` table. All the data in the column will be lost.

*/
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
INSERT INTO "new_hofs" ("allowManualEntry", "code", "createdAt", "description", "displayOrder", "id", "isActive", "minAltitude", "minClimbs", "minIsolation", "minProminence", "title", "updatedAt") SELECT "allowManualEntry", "code", "createdAt", "description", "displayOrder", "id", "isActive", "minAltitude", "minClimbs", "minIsolation", "minProminence", "title", "updatedAt" FROM "hofs";
DROP TABLE "hofs";
ALTER TABLE "new_hofs" RENAME TO "hofs";
CREATE UNIQUE INDEX "hofs_code_key" ON "hofs"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
