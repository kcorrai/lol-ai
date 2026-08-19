import { prisma } from "@/lib/db/prisma";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import type { MatchupEntry, MatchupTrend, PersonalMatchupReport } from "../types/counter.types";

const MIN_GAMES = 3;
const CACHE_TTL_DAYS = 0.042; // ~1 hour (1/24)
const TREND_WINDOW = 5;

// ── Raw query result shape ────────────────────────────────────────────────────

interface MatchupRow {
  opponent_champion_id: number;
  opponent_champion_name: string;
  games: bigint;
  wins: bigint;
  kills_sum: number;
  deaths_sum: number;
  assists_sum: number;
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

async function fetchMatchupRows(
  riotAccountId: string,
  championId: number
): Promise<MatchupRow[]> {
  // Self-join match_participants to find the same-lane opponent. The fluent API cannot
  // express a same-match, cross-team, same-position join in one go.
  //
  // Column names are quoted camelCase because that is what the tables actually have:
  // Prisma maps table names through `@@map` and leaves column names alone. The snake_case
  // this used to spell (`mp.riot_account_id`, `m.queue_type`) matches no column, and an
  // unquoted camelCase name would be folded to lower case and match none either — so every
  // request to the personal matchup endpoint failed with "column does not exist" (LA-38).
  // Nothing catches that at compile time; `matchArchiveService` carries the same warning.
  return prisma.$queryRaw<MatchupRow[]>`
    SELECT
      opp."championId"        AS opponent_champion_id,
      opp."championName"      AS opponent_champion_name,
      COUNT(*)::bigint        AS games,
      SUM(CASE WHEN mp."won" THEN 1 ELSE 0 END)::bigint AS wins,
      SUM(mp."kills")::float                            AS kills_sum,
      SUM(mp."deaths")::float                           AS deaths_sum,
      SUM(mp."assists")::float                          AS assists_sum
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
  // Aggregate KDA over the whole matchup: (all kills + all assists) / all deaths, matching
  // `computeKDA`. It read `(kills_sum + assists_sum) / deaths / games` against a `kills_sum`
  // that was itself `SUM(kills + assists)` — so assists were counted twice and the ratio was
  // then divided by the game count a second time, which put every KDA on this panel out by
  // roughly the number of games played.
  const deaths = row.deaths_sum === 0 ? 1 : row.deaths_sum;
  const avgKda = Math.round(((row.kills_sum + row.assists_sum) / deaths) * 10) / 10;

  return {
    opponentChampionId: Number(row.opponent_champion_id),
    opponentChampionName: row.opponent_champion_name,
    games,
    wins,
    winRate: Math.round((wins / games) * 100),
    avgKda,
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
    return empty;
  }

  const championName = rows[0]
    ? await prisma.champion
        .findUnique({ where: { id: championId }, select: { name: true } })
        .then((c) => c?.name ?? "")
    : "";

  // Fetch trends for top 5 best + worst candidates (avoid N+1 for all rows)
  const sorted = [...rows];
  const worstRows = [...rows].reverse().slice(0, 5);
  const bestRows = sorted.slice(0, 5);
  const trendTargets = new Map<number, MatchupTrend>();

  await Promise.all(
    [...bestRows, ...worstRows].map(async (row) => {
      const id = Number(row.opponent_champion_id);
      if (trendTargets.has(id)) return;
      const recent = await fetchTrendGames(riotAccountId, championId, id);
      trendTargets.set(id, computeTrend(recent));
    })
  );

  const toEntry = (row: MatchupRow): MatchupEntry => {
    const id = Number(row.opponent_champion_id);
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
