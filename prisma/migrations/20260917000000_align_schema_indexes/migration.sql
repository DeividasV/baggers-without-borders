-- Align the migrated database with `prisma/schema.prisma`.
--
-- Two separate problems, both invisible until someone runs `prisma migrate dev`
-- on a fresh clone: it finds the schema diverged from the migration history and
-- stops to ask for a new migration name. The dataset it wanted to create was
-- this one - and it could not be applied as `migrate diff` generated it, because
-- SQLite refuses to drop the implicit index behind a UNIQUE constraint
-- ("index associated with UNIQUE or PRIMARY KEY constraint cannot be dropped").
--
-- 1. `change_request_ticket_counters.year` was declared as a table-level
--    `CONSTRAINT ... UNIQUE ("year")` in 20260320123000. SQLite implements that
--    as an implicit `sqlite_autoindex_*`, not as a named index, so Prisma saw a
--    permanent difference between the database and the schema and wanted to
--    rewrite the index on every run. A table rebuild is the only way to replace
--    an implicit index with a named one, so that is what this does.
-- 2. `journal_authors.userId` and `journal_photos.journalId` are declared with
--    `@@index(...)` in the schema but no migration ever created those indexes.
--
-- No foreign key references this table, and its rows are copied across unchanged.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_change_request_ticket_counters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_change_request_ticket_counters" ("id", "year", "nextNumber", "createdAt", "updatedAt")
SELECT "id", "year", "nextNumber", "createdAt", "updatedAt" FROM "change_request_ticket_counters";
DROP TABLE "change_request_ticket_counters";
ALTER TABLE "new_change_request_ticket_counters" RENAME TO "change_request_ticket_counters";
CREATE UNIQUE INDEX "change_request_ticket_counters_year_key" ON "change_request_ticket_counters"("year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "journal_authors_userId_idx" ON "journal_authors"("userId");

-- CreateIndex
CREATE INDEX "journal_photos_journalId_idx" ON "journal_photos"("journalId");
