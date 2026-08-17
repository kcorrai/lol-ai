-- Reconcile schema.prisma with the migration history (LA-15).
--
-- `migrate dev` had drifted into proposing thirty-odd statements that had nothing to do with
-- whatever you were actually adding — including dropping five deliberate performance indexes and
-- `match_death_events.createdAt`. Those were model-side omissions and are fixed in schema.prisma,
-- not here. What is left is this file: the residue of hand-written migrations that spelled two
-- things differently from the ones Prisma generates.
--
--   1. `DEFAULT gen_random_uuid()` on `id`, and `DEFAULT CURRENT_TIMESTAMP` on `@updatedAt`
--      columns. Prisma generates both values in the client and emits no database default, so it
--      wants these gone. Dropping them is a no-op in practice: every write goes through the
--      Prisma client (the codebase has no raw INSERT — only two `$queryRaw` reads and an
--      advisory lock), so nothing has ever relied on the database to fill these in.
--
--   2. `TIMESTAMP` (microsecond precision) where Prisma's `DateTime` is `TIMESTAMP(3)`. Only the
--      hand-written migrations did this, so the database is currently inconsistent with itself;
--      converging on `TIMESTAMP(3)` matches every other table. This rewrites those tables and
--      truncates sub-millisecond precision, which nothing reads — these are ingest timestamps,
--      not orderings that could tie at the millisecond.
--
-- After this, `migrate diff --from-migrations --to-schema-datamodel` prints nothing, and the
-- next `migrate dev` contains only what its author asked for.

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "challenges" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "champion_stats" ALTER COLUMN "coachingSummaryAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "masteryScoreAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "discord_integrations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "feature_flags" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "improvement_plans" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "patch_versions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "player_habits" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "firstDetected" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lastDetected" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "resolvedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "push_subscriptions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "shareable_cards" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "team_activities" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "team_invites" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "team_members" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "teams" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tilt_alerts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_challenges" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "totpBackupCodes" DROP DEFAULT;
