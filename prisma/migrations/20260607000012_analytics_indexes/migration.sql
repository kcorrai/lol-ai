-- Analytics query optimization indexes
-- These indexes target the admin dashboard and leaderboard queries
-- identified as the most expensive read-only workloads.

-- Leaderboard: ranked history by account + time range (getLeaderboard query)
CREATE INDEX IF NOT EXISTS idx_ranked_history_account_recorded
  ON ranked_histories ("riotAccountId", "recordedAt" DESC);

-- Admin DAU/MAU proxy: riot accounts by updatedAt (getAdminMetrics)
CREATE INDEX IF NOT EXISTS idx_riot_accounts_updated_at
  ON riot_accounts ("updatedAt" DESC);

-- Match history list: participants by account + game start (match history page)
CREATE INDEX IF NOT EXISTS idx_match_participants_account_id
  ON match_participants ("riotAccountId", "matchId");

-- Coaching reports range queries (admin feature usage counts)
CREATE INDEX IF NOT EXISTS idx_coaching_reports_created_at
  ON coaching_reports ("createdAt" DESC);

-- AI analyses range queries (admin cost tracking)
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at
  ON ai_analyses ("createdAt" DESC);
