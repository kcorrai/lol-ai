/**
 * What a duo is actually worth, computed from the matches both players appear in.
 *
 * All of it is derived — there is nothing to store. The one thing that is stored is which
 * teammate the player picked (`duo_partners`, TASK-244); everything here is read back out of
 * `match_participants` each time.
 */

/** The player's own row in one of their matches. */
export interface OwnRow {
  matchId: string;
  teamId: number;
  gameStart: Date;
  won: boolean;
  championName: string;
  position: string;
  kills: number;
  deaths: number;
  assists: number;
  visionScore: number;
  csPerMinute: number;
}

/** The partner's row, in whichever of those matches they appear. */
export interface PartnerRow {
  matchId: string;
  teamId: number;
  championName: string;
  position: string;
  kills: number;
  deaths: number;
  assists: number;
}

export interface Record {
  games: number;
  wins: number;
  /** 0–100, or null when there are no games to divide by. */
  winRate: number | null;
}

export interface PlayerAverages {
  kda: number;
  deaths: number;
  visionScore: number;
  csPerMinute: number;
}

export interface ChampionPair {
  ownChampion: string;
  partnerChampion: string;
  games: number;
  wins: number;
  winRate: number;
}

export interface RolePair {
  ownPosition: string;
  partnerPosition: string;
  games: number;
  winRate: number;
}

export interface SharedMatch {
  matchId: string;
  playedAt: string;
  won: boolean;
  ownChampion: string;
  partnerChampion: string;
  kills: number;
  deaths: number;
  assists: number;
}

export interface DuoSynergy {
  /** False below {@link MIN_SAMPLE} shared games — the caller must not print numbers. */
  hasEnoughData: boolean;
  together: Record;
  apart: Record;
  /** Together minus apart, in win-rate points. Null when either side has no games. */
  synergyDelta: number | null;
  /** Positive for a win streak together, negative for a loss streak. */
  streak: number;
  averagesTogether: PlayerAverages | null;
  averagesApart: PlayerAverages | null;
  championPairs: ChampionPair[];
  rolePairs: RolePair[];
  recentShared: SharedMatch[];
}

/**
 * Below this the comparison is noise: at four games together one result moves the win rate 25
 * points, which would print a confident "+25 synergy" off a single game. TASK-295 shipped exactly
 * that mistake in `AnalysisDeltas` and it read as a real finding.
 */
export const MIN_SAMPLE = 5;

/** A pairing seen once is a coincidence, not a combination worth naming. */
const MIN_PAIR_GAMES = 2;

const TOP_PAIRS = 3;
const RECENT_SHARED = 5;

const pct = (wins: number, games: number): number | null =>
  games === 0 ? null : Math.round((wins / games) * 100);

function record(rows: readonly { won: boolean }[]): Record {
  const wins = rows.filter((r) => r.won).length;
  return { games: rows.length, wins, winRate: pct(wins, rows.length) };
}

function averages(rows: readonly OwnRow[]): PlayerAverages | null {
  if (rows.length === 0) return null;

  const mean = (pick: (r: OwnRow) => number): number =>
    rows.reduce((sum, r) => sum + pick(r), 0) / rows.length;

  return {
    // Averaging per-game KDA rather than dividing the totals: one 0-death game would otherwise
    // dominate the whole average.
    kda: Number(mean((r) => (r.kills + r.assists) / Math.max(r.deaths, 1)).toFixed(2)),
    deaths: Number(mean((r) => r.deaths).toFixed(1)),
    visionScore: Number(mean((r) => r.visionScore).toFixed(1)),
    csPerMinute: Number(mean((r) => r.csPerMinute).toFixed(1)),
  };
}

/** Consecutive same-result games from the most recent shared match back. */
function currentStreak(shared: readonly OwnRow[]): number {
  if (shared.length === 0) return 0;

  const newestFirst = [...shared].sort((a, b) => b.gameStart.getTime() - a.gameStart.getTime());
  const won = newestFirst[0]!.won;

  let run = 0;
  for (const row of newestFirst) {
    if (row.won !== won) break;
    run += 1;
  }
  return won ? run : -run;
}

function championPairs(
  shared: readonly OwnRow[],
  partnerByMatch: ReadonlyMap<string, PartnerRow>,
): ChampionPair[] {
  const counts = new Map<string, { own: string; partner: string; games: number; wins: number }>();

  for (const row of shared) {
    const partner = partnerByMatch.get(row.matchId);
    if (!partner) continue;

    const key = `${row.championName}|${partner.championName}`;
    const entry = counts.get(key) ?? {
      own: row.championName,
      partner: partner.championName,
      games: 0,
      wins: 0,
    };
    entry.games += 1;
    if (row.won) entry.wins += 1;
    counts.set(key, entry);
  }

  return [...counts.values()]
    .filter((c) => c.games >= MIN_PAIR_GAMES)
    .map((c) => ({
      ownChampion: c.own,
      partnerChampion: c.partner,
      games: c.games,
      wins: c.wins,
      winRate: pct(c.wins, c.games) ?? 0,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games)
    .slice(0, TOP_PAIRS);
}

function rolePairs(
  shared: readonly OwnRow[],
  partnerByMatch: ReadonlyMap<string, PartnerRow>,
): RolePair[] {
  const counts = new Map<string, { own: string; partner: string; games: number; wins: number }>();

  for (const row of shared) {
    const partner = partnerByMatch.get(row.matchId);
    if (!partner) continue;

    const key = `${row.position}|${partner.position}`;
    const entry = counts.get(key) ?? {
      own: row.position,
      partner: partner.position,
      games: 0,
      wins: 0,
    };
    entry.games += 1;
    if (row.won) entry.wins += 1;
    counts.set(key, entry);
  }

  return [...counts.values()]
    .map((c) => ({
      ownPosition: c.own,
      partnerPosition: c.partner,
      games: c.games,
      winRate: pct(c.wins, c.games) ?? 0,
    }))
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
    .slice(0, TOP_PAIRS);
}

/**
 * @param ownRows      the player's own participant rows over the scan window
 * @param partnerRows  the partner's rows in those same matches, both teams
 */
export function computeDuoSynergy(
  ownRows: readonly OwnRow[],
  partnerRows: readonly PartnerRow[],
): DuoSynergy {
  // Same match and same team. A partner who was on the enemy side that game is not a duo game,
  // and counting it would credit the pairing for beating each other.
  const ownTeamByMatch = new Map(ownRows.map((r) => [r.matchId, r.teamId]));
  const partnerByMatch = new Map(
    partnerRows.filter((p) => ownTeamByMatch.get(p.matchId) === p.teamId).map((p) => [p.matchId, p]),
  );

  const shared = ownRows.filter((r) => partnerByMatch.has(r.matchId));
  const apart = ownRows.filter((r) => !partnerByMatch.has(r.matchId));

  const together = record(shared);
  const apartRecord = record(apart);

  const recentShared = [...shared]
    .sort((a, b) => b.gameStart.getTime() - a.gameStart.getTime())
    .slice(0, RECENT_SHARED)
    .map((r) => ({
      matchId: r.matchId,
      playedAt: r.gameStart.toISOString(),
      won: r.won,
      ownChampion: r.championName,
      partnerChampion: partnerByMatch.get(r.matchId)!.championName,
      kills: r.kills,
      deaths: r.deaths,
      assists: r.assists,
    }));

  return {
    hasEnoughData: shared.length >= MIN_SAMPLE,
    together,
    apart: apartRecord,
    synergyDelta:
      together.winRate === null || apartRecord.winRate === null
        ? null
        : together.winRate - apartRecord.winRate,
    streak: currentStreak(shared),
    averagesTogether: averages(shared),
    averagesApart: averages(apart),
    championPairs: championPairs(shared, partnerByMatch),
    rolePairs: rolePairs(shared, partnerByMatch),
    recentShared,
  };
}
