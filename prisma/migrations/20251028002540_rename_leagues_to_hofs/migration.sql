/*
  Warnings:

  - You are about to drop the `leagues` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "leagues";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "hofs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "minProminence" INTEGER NOT NULL DEFAULT 0,
    "minIsolation" INTEGER NOT NULL DEFAULT 0,
    "minAltitude" INTEGER NOT NULL DEFAULT 0,
    "minClimbs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "hofs_code_key" ON "hofs"("code");
