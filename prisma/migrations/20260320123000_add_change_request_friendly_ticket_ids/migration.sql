-- Add friendly ticket identifier columns (nullable first for safe rollout)
ALTER TABLE "change_requests" ADD COLUMN "ticketNumber" TEXT;
ALTER TABLE "change_requests" ADD COLUMN "ticketSlug" TEXT;

-- Create per-year counter table for deterministic sequential ticket numbers.
CREATE TABLE "change_request_ticket_counters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "change_request_ticket_counters_year_key" UNIQUE ("year")
);

-- Backfill existing rows deterministically by creation time within each year.
-- This supports both ISO timestamps and epoch-millisecond values in createdAt.
WITH normalized AS (
    SELECT
        "id",
        COALESCE(
            CASE
                WHEN "createdAt" GLOB '[0-9]*' AND length(CAST("createdAt" AS TEXT)) >= 12
                    THEN datetime(CAST("createdAt" AS INTEGER) / 1000, 'unixepoch')
                WHEN "createdAt" GLOB '[0-9]*'
                    THEN datetime(CAST("createdAt" AS INTEGER), 'unixepoch')
                ELSE datetime("createdAt")
            END,
            CURRENT_TIMESTAMP
        ) AS "normalizedCreatedAt",
        COALESCE(
            strftime(
                '%Y',
                CASE
                    WHEN "createdAt" GLOB '[0-9]*' AND length(CAST("createdAt" AS TEXT)) >= 12
                        THEN datetime(CAST("createdAt" AS INTEGER) / 1000, 'unixepoch')
                    WHEN "createdAt" GLOB '[0-9]*'
                        THEN datetime(CAST("createdAt" AS INTEGER), 'unixepoch')
                    ELSE datetime("createdAt")
                END
            ),
            strftime('%Y', CURRENT_TIMESTAMP)
        ) AS "ticketYear"
    FROM "change_requests"
    WHERE "ticketNumber" IS NULL
),
existing_max AS (
    SELECT
        substr("ticketNumber", 5, 4) AS "ticketYear",
        MAX(CAST(substr("ticketNumber", 10, 4) AS INTEGER)) AS "maxSeq"
    FROM "change_requests"
    WHERE "ticketNumber" IS NOT NULL
    GROUP BY substr("ticketNumber", 5, 4)
),
ordered AS (
    SELECT
        n."id",
        n."ticketYear",
        COALESCE(e."maxSeq", 0) + ROW_NUMBER() OVER (
            PARTITION BY n."ticketYear"
            ORDER BY n."normalizedCreatedAt" ASC, n."id" ASC
        ) AS "seq"
    FROM normalized n
    LEFT JOIN existing_max e ON e."ticketYear" = n."ticketYear"
)
UPDATE "change_requests"
SET
    "ticketNumber" = (
        SELECT 'BWB-' || o."ticketYear" || '-' || printf('%04d', o."seq")
        FROM ordered o
        WHERE o."id" = "change_requests"."id"
    ),
    "ticketSlug" = (
        SELECT lower('BWB-' || o."ticketYear" || '-' || printf('%04d', o."seq"))
        FROM ordered o
        WHERE o."id" = "change_requests"."id"
    )
WHERE "id" IN (SELECT "id" FROM ordered);

-- Seed counter table so new inserts continue sequence after backfilled data.
INSERT INTO "change_request_ticket_counters" ("id", "year", "nextNumber", "createdAt", "updatedAt")
SELECT
    lower(hex(randomblob(16))) AS "id",
    CAST(strftime('%Y', COALESCE("createdAt", CURRENT_TIMESTAMP)) AS INTEGER) AS "year",
    MAX(CAST(substr("ticketNumber", 10, 4) AS INTEGER)) + 1 AS "nextNumber",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "change_requests"
WHERE "ticketNumber" IS NOT NULL
GROUP BY strftime('%Y', COALESCE("createdAt", CURRENT_TIMESTAMP));

-- Enforce uniqueness after backfill is complete.
CREATE UNIQUE INDEX "change_requests_ticketNumber_key" ON "change_requests"("ticketNumber");
CREATE UNIQUE INDEX "change_requests_ticketSlug_key" ON "change_requests"("ticketSlug");
