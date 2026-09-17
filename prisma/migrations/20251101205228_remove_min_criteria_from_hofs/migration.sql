/*
  Warnings:

  - You are about to drop the column `minAltitude` on the `hofs` table. All the data in the column will be lost.
  - You are about to drop the column `minClimbs` on the `hofs` table. All the data in the column will be lost.
  - You are about to drop the column `minIsolation` on the `hofs` table. All the data in the column will be lost.
  - You are about to drop the column `minProminence` on the `hofs` table. All the data in the column will be lost.

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_hofs" ("allowManualEntry", "code", "createdAt", "description", "displayOrder", "id", "isActive", "title", "updatedAt") SELECT "allowManualEntry", "code", "createdAt", "description", "displayOrder", "id", "isActive", "title", "updatedAt" FROM "hofs";
DROP TABLE "hofs";
ALTER TABLE "new_hofs" RENAME TO "hofs";
CREATE UNIQUE INDEX "hofs_code_key" ON "hofs"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
