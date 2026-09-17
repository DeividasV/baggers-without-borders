/*
  Warnings:

  - You are about to drop the column `color` on the `award_tiers` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_award_tiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hofYearConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minPeaks" INTEGER NOT NULL,
    "maxPeaks" INTEGER,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "award_tiers_hofYearConfigId_fkey" FOREIGN KEY ("hofYearConfigId") REFERENCES "hof_year_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_award_tiers" ("createdAt", "displayOrder", "hofYearConfigId", "id", "maxPeaks", "minPeaks", "name", "updatedAt") SELECT "createdAt", "displayOrder", "hofYearConfigId", "id", "maxPeaks", "minPeaks", "name", "updatedAt" FROM "award_tiers";
DROP TABLE "award_tiers";
ALTER TABLE "new_award_tiers" RENAME TO "award_tiers";
CREATE INDEX "award_tiers_hofYearConfigId_displayOrder_idx" ON "award_tiers"("hofYearConfigId", "displayOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
