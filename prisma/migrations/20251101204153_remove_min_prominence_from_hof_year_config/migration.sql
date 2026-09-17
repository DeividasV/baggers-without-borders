/*
  Warnings:

  - You are about to drop the column `minProminence` on the `hof_year_configs` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_hof_year_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hofId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "minPeaks" INTEGER NOT NULL DEFAULT 0,
    "minFpr" REAL NOT NULL DEFAULT 0,
    "notes" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hof_year_configs_hofId_fkey" FOREIGN KEY ("hofId") REFERENCES "hofs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hof_year_configs_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_hof_year_configs" ("createdAt", "hofId", "id", "minFpr", "minPeaks", "notes", "updatedAt", "yearId") SELECT "createdAt", "hofId", "id", "minFpr", "minPeaks", "notes", "updatedAt", "yearId" FROM "hof_year_configs";
DROP TABLE "hof_year_configs";
ALTER TABLE "new_hof_year_configs" RENAME TO "hof_year_configs";
CREATE UNIQUE INDEX "hof_year_configs_hofId_yearId_key" ON "hof_year_configs"("hofId", "yearId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
