/*
  Warnings:

  - You are about to drop the `journal_issues` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `issueId` on the `journals` table. All the data in the column will be lost.
  - You are about to alter the column `isEdited` on the `ticket_notes` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `isInternal` on the `ticket_notes` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "journal_issues";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_journals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "parentId" TEXT,
    "editorId" TEXT,
    "coverPhotoId" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "journals_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "journals" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "journals_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "journals_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "journal_photos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "journals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "journals_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_journals" ("approvedById", "content", "coverPhotoId", "createdAt", "createdById", "id", "publishedAt", "slug", "status", "subtitle", "title", "updatedAt") SELECT "approvedById", "content", "coverPhotoId", "createdAt", "createdById", "id", "publishedAt", "slug", "status", "subtitle", "title", "updatedAt" FROM "journals";
DROP TABLE "journals";
ALTER TABLE "new_journals" RENAME TO "journals";
CREATE UNIQUE INDEX "journals_slug_key" ON "journals"("slug");
CREATE UNIQUE INDEX "journals_coverPhotoId_key" ON "journals"("coverPhotoId");
CREATE INDEX "journals_status_idx" ON "journals"("status");
CREATE INDEX "journals_slug_idx" ON "journals"("slug");
CREATE INDEX "journals_publishedAt_idx" ON "journals"("publishedAt");
CREATE INDEX "journals_parentId_idx" ON "journals"("parentId");
CREATE TABLE "new_ticket_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "lastEditedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ticket_notes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ticket_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ticket_notes" ("authorId", "content", "createdAt", "id", "isEdited", "isInternal", "lastEditedAt", "ticketId", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "isEdited", "isInternal", "lastEditedAt", "ticketId", "updatedAt" FROM "ticket_notes";
DROP TABLE "ticket_notes";
ALTER TABLE "new_ticket_notes" RENAME TO "ticket_notes";
CREATE INDEX "ticket_notes_ticketId_idx" ON "ticket_notes"("ticketId");
CREATE INDEX "ticket_notes_authorId_idx" ON "ticket_notes"("authorId");
CREATE INDEX "ticket_notes_createdAt_idx" ON "ticket_notes"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
