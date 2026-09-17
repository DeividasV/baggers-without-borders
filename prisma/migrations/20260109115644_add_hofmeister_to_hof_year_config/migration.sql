-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_hof_year_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hofId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "hofmeisterId" TEXT,
    "minPeaks" INTEGER NOT NULL DEFAULT 0,
    "minPeaksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minForeignPeaks" INTEGER NOT NULL DEFAULT 0,
    "minForeignPeaksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minFpr" REAL NOT NULL DEFAULT 0,
    "minFprEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minimumAge" INTEGER NOT NULL DEFAULT 0,
    "minimumAgeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lceMinFpr" REAL,
    "notes" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hof_year_configs_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hof_year_configs_hofId_fkey" FOREIGN KEY ("hofId") REFERENCES "hofs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hof_year_configs_hofmeisterId_fkey" FOREIGN KEY ("hofmeisterId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_hof_year_configs" ("createdAt", "hofId", "id", "lceEnabled", "lceMinFpr", "minForeignPeaks", "minForeignPeaksEnabled", "minFpr", "minFprEnabled", "minPeaks", "minPeaksEnabled", "minimumAge", "minimumAgeEnabled", "notes", "updatedAt", "yearId") SELECT "createdAt", "hofId", "id", "lceEnabled", "lceMinFpr", "minForeignPeaks", "minForeignPeaksEnabled", "minFpr", "minFprEnabled", "minPeaks", "minPeaksEnabled", "minimumAge", "minimumAgeEnabled", "notes", "updatedAt", "yearId" FROM "hof_year_configs";
DROP TABLE "hof_year_configs";
ALTER TABLE "new_hof_year_configs" RENAME TO "hof_year_configs";
CREATE UNIQUE INDEX "hof_year_configs_hofId_yearId_key" ON "hof_year_configs"("hofId", "yearId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
