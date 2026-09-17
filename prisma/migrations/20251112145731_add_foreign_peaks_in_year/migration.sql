-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_hof_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "hofId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "totalPeaks" INTEGER NOT NULL DEFAULT 0,
    "peaksInYear" INTEGER NOT NULL DEFAULT 0,
    "foreignPeaks" INTEGER NOT NULL DEFAULT 0,
    "foreignPeaksInYear" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hof_entries_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hof_entries_hofId_fkey" FOREIGN KEY ("hofId") REFERENCES "hofs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hof_entries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_hof_entries" ("createdAt", "foreignPeaks", "hofId", "id", "memberId", "peaksInYear", "totalPeaks", "updatedAt", "yearId") SELECT "createdAt", "foreignPeaks", "hofId", "id", "memberId", "peaksInYear", "totalPeaks", "updatedAt", "yearId" FROM "hof_entries";
DROP TABLE "hof_entries";
ALTER TABLE "new_hof_entries" RENAME TO "hof_entries";
CREATE UNIQUE INDEX "hof_entries_memberId_hofId_yearId_key" ON "hof_entries"("memberId", "hofId", "yearId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
