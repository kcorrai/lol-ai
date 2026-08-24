import { QueueType } from "@prisma/client";
import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { redisCacheGet, redisCacheSet } from "@/lib/cache/redisCache";

const TIER_ORDER: Record<string, number> = {
  IRON: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  EMERALD: 5,
  DIAMOND: 6,
  MASTER: 7,
  GRANDMASTER: 8,
  CHALLENGER: 9,
};
const DIVISION_ORDER: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };

/** The route cannot be cached — it reads searchParams, which forces dynamic rendering — so this is. */
const CACHE_TTL_SECONDS = 300;
const MIN_SNAPSHOTS = 2;
const MIN_GAMES = 3;
const MAX_ENTRIES = 50;

function toGlobalLp(tier: string, division: string, lp: number): number {
  const tierBase = (TIER_ORDER[tier] ?? 0) * 400;
  const divBase = (DIVISION_ORDER[division] ?? 0) * 100;
  return tierBase + divBase + lp;
}

export interface LeaderboardEntry {
  rank: number;
  profileSlug: string;
  displayName: string;
  profileIconId: number | null;
  currentTier: string;
  currentDivision: string;
  currentLp: number;
  lpGained: number;
  wins: number;
  losses: number;
  winRate: number;
}

/** One row per qualifying account: where it started the window and where it ended it. */
interface BoundsRow {
  gameName: string;
  tagLine: string;
  profileIconId: number | null;
  profileSlug: string;
  firstTier: string;
  firstDivision: string;
  firstLp: number;
  firstWins: number;
  firstLosses: number;
  lastTier: string;
  lastDivision: string;
  lastLp: number;
  lastWins: number;
  lastLosses: number;
}

/**
 * Raw SQL for `DISTINCT ON`, which is the whole point of this query and has no fluent equivalent.
 *
 * This used to be a `findMany` over the entire window. Rank snapshots are written once a day per
 * account, so a monthly leaderboard pulled roughly thirty rows per account — each carrying the
 * account's name, tag, icon and slug from the joined tables — and then used exactly two of them:
 * the first and the last. Around 93% of what crossed the network was discarded on arrival, on a
 * database billed by transfer (TASK-282) and behind a route that cannot be cached because it reads
 * `searchParams`. It is the same read-amplification shape that exhausted the quota in the first
 * place.
 *
 * `distinct: ["riotAccountId"]` is not the fix: Prisma 5.22 does not push it down. Logging the
 * emitted SQL shows a plain `SELECT ... ORDER BY` with no `DISTINCT ON` — the deduplication
 * happens in the client, after every row has already crossed the wire, which is precisely the cost
 * being removed here.
 *
 * The two thresholds are applied in SQL rather than in TypeScript for the same reason: an account
 * that does not qualify should not be transferred at all.
 */
async function loadBounds(since: Date): Promise<BoundsRow[]> {
  return prismaReadonly.$queryRaw<BoundsRow[]>`
    WITH scoped AS (
      SELECT rh."riotAccountId", rh."tier", rh."division", rh."lp",
             rh."wins", rh."losses", rh."recordedAt"
        FROM "ranked_history" rh
        JOIN "riot_accounts" ra ON ra."id" = rh."riotAccountId"
        JOIN "users" u ON u."id" = ra."userId"
       WHERE rh."queueType" = ${QueueType.RANKED_SOLO_5x5}::"QueueType"
         AND rh."recordedAt" >= ${since}
         AND ra."isPrimary" = TRUE
         AND u."profilePublic" = TRUE
         AND u."profileSlug" IS NOT NULL
    ),
    earliest AS (
      SELECT DISTINCT ON ("riotAccountId") *
        FROM scoped ORDER BY "riotAccountId", "recordedAt" ASC
    ),
    latest AS (
      SELECT DISTINCT ON ("riotAccountId") *
        FROM scoped ORDER BY "riotAccountId", "recordedAt" DESC
    ),
    counts AS (
      SELECT "riotAccountId", COUNT(*)::int AS snapshots
        FROM scoped GROUP BY "riotAccountId"
    )
    SELECT ra."gameName"                   AS "gameName",
           ra."tagLine"                    AS "tagLine",
           ra."profileIconId"              AS "profileIconId",
           u."profileSlug"                 AS "profileSlug",
           e."tier"::text                  AS "firstTier",
           e."division"::text              AS "firstDivision",
           e."lp"                          AS "firstLp",
           e."wins"                        AS "firstWins",
           e."losses"                      AS "firstLosses",
           l."tier"::text                  AS "lastTier",
           l."division"::text              AS "lastDivision",
           l."lp"                          AS "lastLp",
           l."wins"                        AS "lastWins",
           l."losses"                      AS "lastLosses"
      FROM latest l
      JOIN earliest e ON e."riotAccountId" = l."riotAccountId"
      JOIN counts   c ON c."riotAccountId" = l."riotAccountId"
      JOIN "riot_accounts" ra ON ra."id" = l."riotAccountId"
      JOIN "users" u ON u."id" = ra."userId"
     WHERE c."snapshots" >= ${MIN_SNAPSHOTS}
       AND (l."wins" - e."wins") + (l."losses" - e."losses") >= ${MIN_GAMES}
  `;
}

function toEntry(row: BoundsRow): LeaderboardEntry {
  const wins = row.lastWins - row.firstWins;
  const losses = row.lastLosses - row.firstLosses;
  const gamesPlayed = wins + losses;

  return {
    rank: 0,
    profileSlug: row.profileSlug,
    displayName: `${row.gameName}#${row.tagLine}`,
    profileIconId: row.profileIconId,
    currentTier: row.lastTier,
    currentDivision: row.lastDivision,
    currentLp: row.lastLp,
    lpGained:
      toGlobalLp(row.lastTier, row.lastDivision, row.lastLp) -
      toGlobalLp(row.firstTier, row.firstDivision, row.firstLp),
    wins,
    losses,
    winRate: Math.round((wins / gamesPlayed) * 100),
  };
}

export async function getLeaderboard(
  period: "week" | "month" = "week"
): Promise<LeaderboardEntry[]> {
  const cacheKey = `leaderboard:v1:${period}`;
  const cached = await redisCacheGet(cacheKey);
  if (cached !== null) return cached as LeaderboardEntry[];

  const since = new Date();
  since.setDate(since.getDate() - (period === "week" ? 7 : 30));

  const rows = await loadBounds(since);

  const results = rows
    .map(toEntry)
    .sort((a, b) => b.lpGained - a.lpGained)
    .slice(0, MAX_ENTRIES)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  await redisCacheSet(cacheKey, results, CACHE_TTL_SECONDS);
  return results;
}
