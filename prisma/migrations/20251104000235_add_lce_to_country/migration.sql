-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_countries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "code3" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT,
    "numericCode" TEXT,
    "capital" TEXT,
    "continent" TEXT NOT NULL,
    "currency" TEXT,
    "languages" TEXT,
    "hasRegions" BOOLEAN NOT NULL DEFAULT false,
    "lce" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_countries" ("capital", "code", "code3", "continent", "createdAt", "currency", "hasRegions", "id", "languages", "name", "nativeName", "numericCode", "updatedAt") SELECT "capital", "code", "code3", "continent", "createdAt", "currency", "hasRegions", "id", "languages", "name", "nativeName", "numericCode", "updatedAt" FROM "countries";
DROP TABLE "countries";
ALTER TABLE "new_countries" RENAME TO "countries";
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");
CREATE UNIQUE INDEX "countries_code3_key" ON "countries"("code3");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
