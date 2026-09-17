-- AlterTable
ALTER TABLE "consent_types" ADD COLUMN "internalNotes" TEXT;

-- CreateTable
CREATE TABLE "consent_type_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "consentTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consent_type_attachments_consentTypeId_fkey" FOREIGN KEY ("consentTypeId") REFERENCES "consent_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
