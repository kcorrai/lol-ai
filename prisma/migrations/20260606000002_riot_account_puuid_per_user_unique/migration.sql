-- Drop the global puuid unique constraint so multiple users can link the same Riot account
DROP INDEX "riot_accounts_puuid_key";

-- Enforce uniqueness per user instead (one row per user/puuid pair)
ALTER TABLE "riot_accounts" ADD CONSTRAINT "riot_accounts_userId_puuid_key" UNIQUE ("userId", "puuid");
