-- Existing rows were only ever written after a successful dispatch, so they are
-- genuinely processed and keep their timestamp. New rows are claimed with NULL
-- and stamped on success (TASK-270).
ALTER TABLE "webhook_events" ALTER COLUMN "processedAt" DROP DEFAULT;
ALTER TABLE "webhook_events" ALTER COLUMN "processedAt" DROP NOT NULL;
