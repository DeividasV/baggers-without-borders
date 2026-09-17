-- CreateTable
CREATE TABLE "hof_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "hofId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "totalPeaks" INTEGER NOT NULL DEFAULT 0,
    "peaksInSeason" INTEGER NOT NULL DEFAULT 0,
    "foreignPeaks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hof_entries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hof_entries_hofId_fkey" FOREIGN KEY ("hofId") REFERENCES "hofs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hof_entries_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "hof_entries_memberId_hofId_seasonId_key" ON "hof_entries"("memberId", "hofId", "seasonId");
