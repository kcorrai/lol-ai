-- Renames the incorrectly-cased column and ensures the correct camelCase column exists.
-- Safe to run multiple times: RENAME is a no-op if target name already exists; ADD uses IF NOT EXISTS.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaching_reports' AND column_name = 'focus_area'
  ) THEN
    ALTER TABLE "coaching_reports" RENAME COLUMN "focus_area" TO "focusArea";
  END IF;
END $$;
ALTER TABLE "coaching_reports" ADD COLUMN IF NOT EXISTS "focusArea" TEXT;
