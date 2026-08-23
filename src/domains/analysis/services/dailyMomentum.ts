export interface MomentumRow {
  gameStart: Date;
  kills: number;
  deaths: number;
  assists: number;
  csPerMinute: number;
  visionScore: number;
  won: boolean;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  games: number;
  wins: number;
  winRate: number; // 0-100
  kda: number;
  csPerMin: number;
  visionScore: number;
}

export const MOMENTUM_METRICS = ["kda", "csPerMin", "visionScore", "winRate"] as const;
export type MomentumMetric = (typeof MOMENTUM_METRICS)[number];

export interface MomentumChartPoint {
  date: string;
  self: number | null;
  duo: number | null;
}

/**
 * Aligns the player's series with their duo's onto a shared date axis for plotting.
 *
 * A day one of them didn't play becomes null rather than 0, so the chart can bridge the gap
 * instead of drawing a drop to the floor.
 */
export function mergeSeries(
  self: DailyPoint[],
  duo: DailyPoint[],
  metric: MomentumMetric
): MomentumChartPoint[] {
  const selfByDate = new Map(self.map((p) => [p.date, p[metric]]));
  const duoByDate = new Map(duo.map((p) => [p.date, p[metric]]));

  return [...new Set([...selfByDate.keys(), ...duoByDate.keys()])]
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({
      date,
      self: selfByDate.get(date) ?? null,
      duo: duoByDate.get(date) ?? null,
    }));
}

const dayKey = (d: Date): string => d.toISOString().slice(0, 10);
const round = (n: number, dp = 1): number => Math.round(n * 10 ** dp) / 10 ** dp;

/**
 * Collapses matches into one point per day.
 *
 * Days with no games are left out rather than emitted as zeros — a day off is a gap in the line,
 * not a collapse in performance.
 *
 * KDA is computed from the day's totals, not as the mean of per-game ratios: one 10/0/10 game
 * would otherwise swamp the average and read as a day that never happened.
 */
export function buildDailySeries(rows: MomentumRow[]): DailyPoint[] {
  const byDay = new Map<
    string,
    { k: number; d: number; a: number; cs: number; vision: number; games: number; wins: number }
  >();

  for (const row of rows) {
    const key = dayKey(row.gameStart);
    const acc = byDay.get(key) ?? { k: 0, d: 0, a: 0, cs: 0, vision: 0, games: 0, wins: 0 };
    acc.k += row.kills;
    acc.d += row.deaths;
    acc.a += row.assists;
    acc.cs += row.csPerMinute;
    acc.vision += row.visionScore;
    acc.games += 1;
    if (row.won) acc.wins += 1;
    byDay.set(key, acc);
  }

  return [...byDay.entries()]
    .map(([date, v]) => ({
      date,
      games: v.games,
      wins: v.wins,
      winRate: Math.round((v.wins / v.games) * 100),
      kda: round((v.k + v.a) / Math.max(v.d, 1), 2),
      csPerMin: round(v.cs / v.games),
      visionScore: Math.round(v.vision / v.games),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
