-- CreateTable: Journal Issues (magazine/issue grouping)
CREATE TABLE IF NOT EXISTS "journal_issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Journal Photos (with metadata)
CREATE TABLE IF NOT EXISTS "journal_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "attribution" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "journalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "journal_photos_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journals" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: Journals (articles)
CREATE TABLE IF NOT EXISTS "journals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueId" TEXT,
    "coverPhotoId" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "journals_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "journal_issues" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "journals_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "journal_photos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "journals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "journals_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: Journal Authors (member or external)
CREATE TABLE IF NOT EXISTS "journal_authors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "journal_authors_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "journal_authors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "journals_slug_key" ON "journals"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "journals_coverPhotoId_key" ON "journals"("coverPhotoId");
CREATE UNIQUE INDEX IF NOT EXISTS "journal_authors_journalId_userId_key" ON "journal_authors"("journalId", "userId");
CREATE INDEX IF NOT EXISTS "journals_status_idx" ON "journals"("status");
CREATE INDEX IF NOT EXISTS "journals_slug_idx" ON "journals"("slug");
CREATE INDEX IF NOT EXISTS "journals_publishedAt_idx" ON "journals"("publishedAt");
