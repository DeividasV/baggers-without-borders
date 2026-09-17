-- Add manual ordering for Journal children within a parent
ALTER TABLE "journals" ADD COLUMN "childOrder" INTEGER NOT NULL DEFAULT 0;
