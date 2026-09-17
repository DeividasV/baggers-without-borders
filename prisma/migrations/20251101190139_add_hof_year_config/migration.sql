-- CreateTable
CREATE TABLE "hof_year_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hofId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "minPeaks" INTEGER NOT NULL DEFAULT 0,
    "minProminence" INTEGER NOT NULL DEFAULT 0,
    "minFpr" REAL NOT NULL DEFAULT 0,
    "notes" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hof_year_configs_hofId_fkey" FOREIGN KEY ("hofId") REFERENCES "hofs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hof_year_configs_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "hof_year_configs_hofId_yearId_key" ON "hof_year_configs"("hofId", "yearId");

-- RedefineIndex
DROP INDEX "hof_entries_memberId_hofId_seasonId_key";
CREATE UNIQUE INDEX "hof_entries_memberId_hofId_yearId_key" ON "hof_entries"("memberId", "hofId", "yearId");

-- RedefineIndex
DROP INDEX "seasons_code_key";
CREATE UNIQUE INDEX "years_code_key" ON "years"("code");
