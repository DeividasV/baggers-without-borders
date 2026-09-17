-- CreateTable
CREATE TABLE "award_tiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hofYearConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minPeaks" INTEGER NOT NULL,
    "maxPeaks" INTEGER,
    "color" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "award_tiers_hofYearConfigId_fkey" FOREIGN KEY ("hofYearConfigId") REFERENCES "hof_year_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "award_tiers_hofYearConfigId_displayOrder_idx" ON "award_tiers"("hofYearConfigId", "displayOrder");
