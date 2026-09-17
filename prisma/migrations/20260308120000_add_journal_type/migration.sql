ALTER TABLE "journals" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'journal';

UPDATE "journals"
SET "type" = 'journal'
WHERE "type" IS NULL OR TRIM("type") = '';

CREATE INDEX "journals_type_idx" ON "journals"("type");