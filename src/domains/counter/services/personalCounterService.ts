import { prisma } from "@/lib/db/prisma";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { computeKDA } from "@/domains/analysis/calculators/performanceCalculator";
import type { MatchupEntry, MatchupTrend, PersonalMatchupReport } from "../types/counter.types";

const MIN_GAMES = 3;
const CACHE_TTL_DAYS = 0.042; // ~1 hour (1/24)
const TREND_WINDOW = 5;

// A player with nothing to report is the common case for a new account, and re-running the
// self-join for them on every request is the most expensive way to learn nothing. Held briefly
// rather than for the full hour, so the first matchup that qualifies is not hidden for an hour
// after it lands.
const EMPTY_CACHE_TTL_DAYS = 0.0035; // ~5 minutes

// ── Raw query result shape ────────────────────────────────────────────────────

// Column names are quoted camelCase in the queries below because that is what the tables actually
// have: the schema maps table names with `@@map` and leaves column names alone. Getting this wrong
// fails at runtime and never at compile time — `$queryRaw` is untyped at the SQL level — which is
// exactly how LA-38 sat here unnoticed with every column in snake_case, so that every call to this
// service threw `42703: column opp.champion_id does not exist` and the feature never once worked.
interface MatchupRow {
  opponentChampionId: number;
  opponentChampionName: string;
  games: bigint;
  wins: bigint;
  killsSum: number;
  deathsSum: number;
  assistsSum: number;
}

// ── Trend helpers ─────────────────────────────────────────────────────────────

interface RecentGame {
  won: boolean;
}

function computeTrend(recent: RecentGame[]): MatchupTrend {
  if (recent.length < TREND_WINDOW * 2) return "insufficient_data";

  const newerWins = recent.slice(0, TREND_WINDOW).filter((g) => g.won).length;
  const olderWins = recent.slice(TREND_WINDOW, TREND_WINDOW * 2).filter((g) => g.won).length;
  const newerWr = newerWins / TREND_WINDOW;
  const olderWr = olderWins / TREND_WINDOW;

  if (newerWr - olderWr >= 0.15) return "improving";
  if (olderWr - newerWr >= 0.15) return "declining";
  return "stable";
}

// ── Core aggregation ──────────────────────────────────────────────────────────

async function fetchMatchupRows(riotAccountId: string, championId: number): Promise<MatchupRow[]> {
  // Prisma raw query: self-join match_participants to find same-lane opponent.
  // Fluent API cannot express same-match cross-team same-position join in one go.
  return prisma.$queryRaw<MatchupRow[]>`
    SELECT
      opp."championId"    AS "opponentChampionId",
      opp."championName"  AS "opponentChampionName",
      COUNT(*)::bigint    AS games,
      SUM(CASE WHEN mp."won" THEN 1 ELSE 0 END)::bigint AS wins,
      SUM(mp."kills")::float                            AS "killsSum",
      SUM(mp."deaths")::float                           AS "deathsSum",
      SUM(mp."assists")::float                          AS "assistsSum"
    FROM match_participants mp
    JOIN match_participants opp
      ON  opp."matchId"  = mp."matchId"
      AND opp."teamId"  != mp."teamId"
      AND opp."position" = mp."position"
    JOIN matches m ON m."id" = mp."matchId"
    WHERE mp."riotAccountId" = ${riotAccountId}::uuid
      AND mp."championId"    = ${championId}
      AND m."queueType"      = 'RANKED_SOLO_5x5'
    GROUP BY opp."championId", opp."championName"
    HAVING COUNT(*) >= ${MIN_GAMES}
    ORDER BY (SUM(CASE WHEN mp."won" THEN 1 ELSE 0 END)::float / COUNT(*)) DESC
  `;
}

async function fetchTrendGames(
  riotAccountId: string,
  championId: number,
  opponentChampionId: number
): Promise<RecentGame[]> {
  return prisma.$queryRaw<RecentGame[]>`
    SELECT mp."won"
    FROM match_participants mp
    JOIN match_participants opp
      ON  opp."matchId"  = mp."matchId"
      AND opp."teamId"  != mp."teamId"
      AND opp."position" = mp."position"
    JOIN matches m ON m."id" = mp."matchId"
    WHERE mp."riotAccountId" = ${riotAccountId}::uuid
      AND mp."championId"    = ${championId}
      AND opp."championId"   = ${opponentChampionId}
      AND m."queueType"      = 'RANKED_SOLO_5x5'
    ORDER BY m."gameStart" DESC
    LIMIT ${TREND_WINDOW * 2}
  `;
}

function rowToEntry(row: MatchupRow, trend: MatchupTrend): MatchupEntry {
  const games = Number(row.games);
  const wins = Number(row.wins);

  return {
    opponentChampionId: Number(row.opponentChampionId),
    opponentChampionName: row.opponentChampionName,
    games,
    wins,
    winRate: Math.round((wins / games) * 100),
    // Ratio of sums, via the shared calculator — the same aggregate KDA the archive reports and
    // what every LoL site means by the term. The previous arithmetic here counted assists twice
    // (the query already folded them into its kills total) and then divided the ratio by the game
    // count, which is not an average of anything.
    avgKda: computeKDA(row.killsSum, row.deathsSum, row.assistsSum),
    trend,
  };
}

// Ban suggestion: worst WR among those played ≥ 5 times (more reliable)
function pickBanSuggestion(worst: MatchupEntry[]): MatchupEntry | null {
  return worst.find((e) => e.games >= 5) ?? worst[0] ?? null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getPersonalMatchups(
  riotAccountId: string,
  championId: number
): Promise<PersonalMatchupReport> {
  const cacheKey = buildCacheKey("personal-matchups", {
    riotAccountId,
    championId: String(championId),
  });
  const cached = await getCached(cacheKey);
  if (cached) return cached as PersonalMatchupReport;

  const rows = await fetchMatchupRows(riotAccountId, championId);

  if (rows.length === 0) {
    const empty: PersonalMatchupReport = {
      championId,
      championName: "",
      best: [],
      worst: [],
      banSuggestion: null,
      totalMatchupsAnalyzed: 0,
    };
    // Cached, unlike before. "No qualifying matchups" is an answer, and it was the one answer this
    // function refused to remember — so the account least likely to have data was the one paying
    // for the full self-join on every single request, for ever.
    await setCached(cacheKey, "personal-matchups", empty, EMPTY_CACHE_TTL_DAYS);
    return empty;
  }

  const championName = await prisma.champion
    .findUnique({ where: { id: championId }, select: { name: true } })
    .then((c) => c?.name ?? "");

  // Fetch trends for top 5 best + worst candidates (avoid N+1 for all rows)
  const sorted = [...rows];
  const worstRows = [...rows].reverse().slice(0, 5);
  const bestRows = sorted.slice(0, 5);
  const trendTargets = new Map<number, MatchupTrend>();

  await Promise.all(
    [...bestRows, ...worstRows].map(async (row) => {
      const id = Number(row.opponentChampionId);
      if (trendTargets.has(id)) return;
      const recent = await fetchTrendGames(riotAccountId, championId, id);
      trendTargets.set(id, computeTrend(recent));
    })
  );

  const toEntry = (row: MatchupRow): MatchupEntry => {
    const id = Number(row.opponentChampionId);
    return rowToEntry(row, trendTargets.get(id) ?? "insufficient_data");
  };

  const allEntries = rows.map(toEntry);
  // Sorted desc by winRate from query; worst = reverse of last N
  const bestSlice = allEntries.slice(0, 5);
  const worstSlice = [...allEntries].reverse().slice(0, 5);

  const report: PersonalMatchupReport = {
    championId,
    championName,
    best: bestSlice,
    worst: worstSlice,
    banSuggestion: pickBanSuggestion(worstSlice),
    totalMatchupsAnalyzed: rows.length,
  };

  await setCached(cacheKey, "personal-matchups", report, CACHE_TTL_DAYS);
  return report;
}

/**
 * One matchup, asked for by name rather than found in a top-five list.
 *
 * `getPersonalMatchups` answers "what are my best and worst lanes"; the desktop
 * companion asks the opposite question — "what is my record in *this* lane, the
 * one starting right now" — and the answer for a matchup sitting sixth is not
 * "you have never played it". So this reads the pair directly.
 *
 * `MIN_GAMES` deliberately does not apply. A two-game record is a real record and
 * the caller is told the sample size; hiding it would leave the panel claiming no
 * history for a lane the player has played. A win rate over so few games means
 * little, which is the reader's problem to present and not this function's to
 * solve by lying about the games existing.
 */
export async function getPersonalMatchup(
  riotAccountId: string,
  championId: number,
  opponentChampionId: number
): Promise<MatchupEntry | null> {
  const rows = await prisma.$queryRaw<MatchupRow[]>`
    SELECT
      opp."championId"    AS "opponentChampionId",
      opp."championName"  AS "opponentChampionName",
      COUNT(*)::bigint    AS games,
      SUM(CASE WHEN mp."won" THEN 1 ELSE 0 END)::bigint AS wins,
      SUM(mp."kills")::float                            AS "killsSum",
      SUM(mp."deaths")::float                           AS "deathsSum",
      SUM(mp."assists")::float                          AS "assistsSum"
    FROM match_participants mp
    JOIN match_participants opp
      ON  opp."matchId"  = mp."matchId"
      AND opp."teamId"  != mp."teamId"
      AND opp."position" = mp."position"
    JOIN matches m ON m."id" = mp."matchId"
    WHERE mp."riotAccountId" = ${riotAccountId}::uuid
      AND mp."championId"    = ${championId}
      AND opp."championId"   = ${opponentChampionId}
      AND m."queueType"      = 'RANKED_SOLO_5x5'
    GROUP BY opp."championId", opp."championName"
  `;

  const row = rows[0];
  if (!row) return null;

  const trend = computeTrend(await fetchTrendGames(riotAccountId, championId, opponentChampionId));
  return rowToEntry(row, trend);
}
