-- Migration: 20260607000014_audit_logs
-- Adds append-only audit_logs table for SOC2 compliance

CREATE TABLE "audit_logs" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "userId"     UUID,
  "actorId"    UUID,
  "action"     TEXT         NOT NULL,
  "resource"   TEXT         NOT NULL,
  "resourceId" TEXT,
  "metadata"   JSONB,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt" DESC);
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt" DESC);

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Immutability enforced at application layer (no UPDATE/DELETE).
-- Row-level security or a DB trigger can be added for additional protection.
