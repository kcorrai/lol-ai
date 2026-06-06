-- Idempotent fix: previous migration may have been recorded as applied without
-- actually executing (pooled-connection DDL issue). IF NOT EXISTS makes this safe.
ALTER TABLE "coaching_reports" ADD COLUMN IF NOT EXISTS "focus_area" TEXT;
