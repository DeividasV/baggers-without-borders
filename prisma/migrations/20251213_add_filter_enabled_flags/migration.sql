-- AlterTable: Add enabled boolean flags for each filter criterion
-- These columns default to TRUE to preserve existing filtering behavior
-- SAFE: Only adds columns with default values, no data loss

ALTER TABLE "hof_year_configs" ADD COLUMN "minPeaksEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "hof_year_configs" ADD COLUMN "minForeignPeaksEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "hof_year_configs" ADD COLUMN "minFprEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "hof_year_configs" ADD COLUMN "minimumAgeEnabled" BOOLEAN NOT NULL DEFAULT true;
