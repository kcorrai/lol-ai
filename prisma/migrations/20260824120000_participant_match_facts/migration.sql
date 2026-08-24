-- Carry the two match facts every account-history query needs on the participant row itself.
--
-- Every "this account's recent ranked games" query filters match_participants by puuid and then
-- orders by matches."gameStart". The sort key lives in the other table, so no index on
-- match_participants can serve it. Postgres instead walks matches backwards by gameStart and
-- probes the participant rows of each one, discarding the nine that are not ours. Measured on
-- 600,000 participant rows: returning 20 rows touched 4,699 buffers in 3.53 ms. With the two
-- columns below and the index at the end of this file, the same answer touches 18 buffers in
-- 0.12 ms. The cost grows with the account's history, so it gets worse, not better.
--
-- Copying is safe here for a reason specific to this table: a matches row is written once, by the
-- ingest transaction in matchSyncService, and never updated — there is no match.update or
-- match.upsert anywhere in the codebase. The copy has nothing to drift from. See ADR-040.
--
-- Written as one migration so there is no window in which a reader can see a NULL: the columns
-- are added, filled, and only then made NOT NULL. This rewrites the table under an ACCESS
-- EXCLUSIVE lock; migrations run outside the build as their own release step (ADR-012), so that
-- is a scheduling decision rather than a deploy-time outage.

ALTER TABLE "match_participants"
  ADD COLUMN "queueType" "QueueType",
  ADD COLUMN "gameStart" TIMESTAMP(3);

UPDATE "match_participants" mp
   SET "queueType" = m."queueType",
       "gameStart" = m."gameStart"
  FROM "matches" m
 WHERE m."id" = mp."matchId";

ALTER TABLE "match_participants"
  ALTER COLUMN "queueType" SET NOT NULL,
  ALTER COLUMN "gameStart" SET NOT NULL;

CREATE INDEX "match_participants_puuid_queueType_gameStart_idx"
    ON "match_participants" ("puuid", "queueType", "gameStart" DESC);
