-- The leaderboard asks for every ranked snapshot recorded in the last 7 or 30 days, across all
-- public accounts. ranked_history has two indexes and both lead with "riotAccountId", so neither
-- can serve a query that names no account — Postgres sequentially scanned the table on every
-- request, and /api/leaderboard cannot be cached by the route layer because it reads searchParams.
CREATE INDEX IF NOT EXISTS "ranked_history_queueType_recordedAt_idx"
  ON "ranked_history" ("queueType", "recordedAt");
