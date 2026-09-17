-- AlterTable: Add Progress Register exclusion filter columns to hofs table
-- These columns allow per-HOF configuration of member exclusions for Progress Register display

-- Add progressRegisterExcludeRetired (default: true)
-- Excludes members with retiredYear set from Progress Register
ALTER TABLE "hofs" ADD COLUMN "progressRegisterExcludeRetired" BOOLEAN NOT NULL DEFAULT true;

-- Add progressRegisterExcludeDeceased (default: true)  
-- Excludes members with deceasedYear set from Progress Register
ALTER TABLE "hofs" ADD COLUMN "progressRegisterExcludeDeceased" BOOLEAN NOT NULL DEFAULT true;

-- Add progressRegisterExcludeInactive (default: true)
-- Excludes members with no activity within the configured inactivity period
ALTER TABLE "hofs" ADD COLUMN "progressRegisterExcludeInactive" BOOLEAN NOT NULL DEFAULT true;

-- Add progressRegisterInactivityYears (default: 2)
-- Defines how many years of inactivity before a member is considered inactive
ALTER TABLE "hofs" ADD COLUMN "progressRegisterInactivityYears" INTEGER NOT NULL DEFAULT 2;
