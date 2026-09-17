-- Expand AuditLog EventType enum values (SQLite)
--
-- SQLite enums are typically implemented as TEXT columns with CHECK constraints.
-- To add enum values we must rebuild the table. This migration:
-- 1) Ensures the table exists (fresh installs / drifted DBs)
-- 2) Rebuilds audit_logs with updated CHECK constraints
-- 3) Recreates indexes

-- Ensure audit_logs exists (no-op if already present)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "eventCategory" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddressHash" TEXT NOT NULL,
    "ipCountry" TEXT,
    "userAgent" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "actionDetails" TEXT,
    "errorMessage" TEXT,
    "retentionDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Redefine table to update CHECK constraints
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL CHECK (
      "eventType" IN (
        'AUTH_LOGIN_SUCCESS',
        'AUTH_LOGIN_FAILED',
        'AUTH_REGISTER_SUCCESS',
        'AUTH_REGISTER_FAILED',
        'AUTH_PASSWORD_RESET_REQUEST_SUCCESS',
        'AUTH_PASSWORD_RESET_REQUEST_FAILED',
        'AUTH_PASSWORD_RESET_COMPLETE_SUCCESS',
        'AUTH_PASSWORD_RESET_COMPLETE_FAILED',
        'AUTH_EMAIL_VERIFY_SUCCESS',
        'AUTH_EMAIL_VERIFY_FAILED',
        'AUTH_RESEND_VERIFY_SUCCESS',
        'AUTH_RESEND_VERIFY_FAILED',
        'AUTH_PASSWORD_CHANGE',
        'AUTH_EMAIL_CHANGE',
        'USER_PROFILE_UPDATE',
        'USER_BAG_UPDATE',
        'USER_BAG_DELETE',
        'USER_ROLE_ESCALATION',
        'ADMIN_USER_CREATE',
        'ADMIN_USER_UPDATE',
        'ADMIN_USER_DELETE',
        'ADMIN_DOCUMENT_CREATE',
        'ADMIN_DOCUMENT_UPDATE',
        'ADMIN_DOCUMENT_DELETE',
        'ADMIN_DOCUMENT_UPLOAD',
        'ADMIN_DOCUMENT_DOWNLOAD',
        'ADMIN_HOF_CREATE',
        'ADMIN_HOF_UPDATE',
        'ADMIN_HOF_DELETE',
        'ADMIN_YEAR_CREATE',
        'ADMIN_YEAR_UPDATE',
        'ADMIN_YEAR_DELETE',
        'ADMIN_HOF_YEAR_CONFIG_CREATE',
        'ADMIN_HOF_YEAR_CONFIG_UPDATE',
        'ADMIN_HOF_YEAR_CONFIG_DELETE',
        'ADMIN_DATA_ENTRY_CREATE',
        'ADMIN_DATA_ENTRY_UPDATE',
        'ADMIN_DATA_ENTRY_DELETE',
        'ADMIN_BACKUP_CREATE',
        'ADMIN_BACKUP_DOWNLOAD',
        'ADMIN_BACKUP_DELETE',
        'ADMIN_CHANGE_REQUEST_CREATE',
        'ADMIN_CHANGE_REQUEST_UPDATE',
        'ADMIN_CHANGE_REQUEST_DELETE'
      )
    ),
    "eventCategory" TEXT NOT NULL CHECK ("eventCategory" IN ('AUTH', 'ADMIN', 'USER')),
    "status" TEXT NOT NULL CHECK ("status" IN ('SUCCESS', 'FAILURE')),
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddressHash" TEXT NOT NULL,
    "ipCountry" TEXT,
    "userAgent" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "actionDetails" TEXT,
    "errorMessage" TEXT,
    "retentionDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_audit_logs" (
  "id",
  "eventType",
  "eventCategory",
  "status",
  "userId",
  "sessionId",
  "ipAddressHash",
  "ipCountry",
  "userAgent",
  "resourceType",
  "resourceId",
  "actionDetails",
  "errorMessage",
  "retentionDate",
  "createdAt"
)
SELECT
  "id",
  "eventType",
  "eventCategory",
  "status",
  "userId",
  "sessionId",
  "ipAddressHash",
  "ipCountry",
  "userAgent",
  "resourceType",
  "resourceId",
  "actionDetails",
  "errorMessage",
  "retentionDate",
  "createdAt"
FROM "audit_logs";

DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";

-- Recreate indexes
CREATE INDEX IF NOT EXISTS "audit_logs_eventType_idx" ON "audit_logs"("eventType");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_status_idx" ON "audit_logs"("status");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_ipCountry_idx" ON "audit_logs"("ipCountry");
CREATE INDEX IF NOT EXISTS "audit_logs_ipAddressHash_idx" ON "audit_logs"("ipAddressHash");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
