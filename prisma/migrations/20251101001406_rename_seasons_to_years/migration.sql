-- Rename seasons table to years (preserves all data and structure)
ALTER TABLE "seasons" RENAME TO "years";

-- Rename columns in hof_entries table (SQLite 3.25.0+)
ALTER TABLE "hof_entries" RENAME COLUMN "seasonId" TO "yearId";
ALTER TABLE "hof_entries" RENAME COLUMN "peaksInSeason" TO "peaksInYear";
