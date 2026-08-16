import type { ProChampionAverages } from "@/domains/esports/types";

/**
 * Below this many games on the champion, a player's averages are noise.
 *
 * The comparison still renders — refusing to show someone their own numbers is
 * worse than showing them with a caveat — but every row is labelled and the
 * readings are withheld.
 */
export const MIN_PLAYER_GAMES = 3;

export type MetricFormat = "ratio" | "integer" | "percent" | "rate";

export interface PlayerChampionAverages {
  games: number;
  kda: number;
  winRate: number;
  /** Only the signed-in path has these; the public preview publishes KDA and results only. */
  creepScore: number | null;
  gold: number | null;
  wardsPlaced: number | null;
  /** Mean length of the player's games on the champion, in seconds. */
  gameLengthSeconds: number | null;
  creepScorePerMin: number | null;
  goldPerMin: number | null;
}

export interface ComparisonRow {
  key: string;
  label: string;
  pro: number;
  you: number;
  /** you − pro, signed. */
  gap: number;
  /** The gap as a share of the pro figure, or null when the pro figure is zero. */
  gapPercent: number | null;
  format: MetricFormat;
  /** One line on what the gap means, or null when the sample is too thin to say. */
  reading: string | null;
}

interface Metric {
  key: string;
  label: string;
  format: MetricFormat;
  pro: (averages: ProChampionAverages) => number | null;
  you: (averages: PlayerChampionAverages) => number | null;
  /** Said when the player is meaningfully below the pro figure. */
  below: string;
  /** Said when they are at or above it. */
  atOrAbove: string;
}

/**
 * What the two sides can honestly be compared on.
 *
 * CS/min and gold/min used to be missing here, because neither esports endpoint
 * publishes a game's length. It is now derived from the feed's own opening and
 * closing frames (`duration.ts`), so the two rates are real measurements on both
 * sides and the rows are back. A game the feed published no opening window for
 * still has no length, and the row drops out for that champion rather than being
 * computed against an assumed one.
 *
 * Still genuinely absent: vision score exists on our side and not on Riot's
 * esports side, and kill participation and damage share exist on theirs and not
 * in what we store.
 */
const METRICS: Metric[] = [
  {
    key: "kda",
    label: "KDA",
    format: "ratio",
    pro: (pro) => pro.kda,
    you: (you) => you.kda,
    below:
      "Pros die less than this on the champion — usually a matter of when they take fights, not how they play them.",
    atOrAbove: "Your KDA on this champion is holding up against pro play.",
  },
  {
    key: "winRate",
    label: "Win rate",
    format: "percent",
    pro: (pro) => pro.winRate,
    you: (you) => you.winRate,
    below: "The champion is winning more in pro hands than in yours right now.",
    atOrAbove: "You are winning on this champion at least as often as the pros are.",
  },
  {
    key: "creepScore",
    label: "CS per game",
    format: "integer",
    pro: (pro) => pro.creepScore,
    you: (you) => you.creepScore,
    below: "Fewer minions per game than pro play — the most reliable single thing to work on.",
    atOrAbove: "Your farm on this champion is at pro volume.",
  },
  {
    // The rate rather than the total, because it is the one the two sides can be
    // compared on without game length getting in the way: pro games run long, so
    // a per-game CS gap can be entirely an artefact of a shorter solo queue game.
    key: "creepScorePerMin",
    label: "CS per minute",
    format: "rate",
    pro: (pro) => pro.creepScorePerMin,
    you: (you) => you.creepScorePerMin,
    below: "Pros farm faster on this champion, minute for minute — the gap the per-game figure hides.",
    atOrAbove: "Minute for minute, you farm this champion as fast as the pros do.",
  },
  {
    key: "gold",
    label: "Gold per game",
    format: "integer",
    pro: (pro) => pro.gold,
    you: (you) => you.gold,
    below: "Less gold per game, which usually follows the CS gap rather than causing it.",
    atOrAbove: "You are ending games with as much gold as pros do on this champion.",
  },
  {
    key: "goldPerMin",
    label: "Gold per minute",
    format: "integer",
    pro: (pro) => pro.goldPerMin,
    you: (you) => you.goldPerMin,
    below: "Income per minute trails pro play — usually farm and objectives rather than kills.",
    atOrAbove: "Your income rate on this champion matches pro play.",
  },
  {
    key: "wardsPlaced",
    label: "Wards per game",
    format: "integer",
    pro: (pro) => pro.wardsPlaced,
    you: (you) => you.wardsPlaced,
    below: "Pros ward more on this champion than you do.",
    atOrAbove: "You ward as much as pro players do on this champion.",
  },
];

/** How far off a figure has to be before the difference is worth a sentence. */
const MEANINGFUL_GAP = 0.05;

function reading(metric: Metric, gapPercent: number | null, enoughGames: boolean): string | null {
  // A reading over one or two games would be a claim the sample cannot support.
  if (!enoughGames) return null;
  if (gapPercent === null || Math.abs(gapPercent) < MEANINGFUL_GAP * 100) return null;
  return gapPercent < 0 ? metric.below : metric.atOrAbove;
}

/**
 * The player's line against the pro line, row by row.
 *
 * A row appears only when both sides have the number. That is not defensive
 * coding: signed out, the public preview publishes results and KDA and nothing
 * else, so the same champion shows two rows to a visitor and five to someone
 * whose account is connected — and the page has to say which it is looking at.
 */
export function buildComparison(
  pro: ProChampionAverages,
  you: PlayerChampionAverages
): ComparisonRow[] {
  const enoughGames = you.games >= MIN_PLAYER_GAMES;

  return METRICS.flatMap((metric) => {
    const proValue = metric.pro(pro);
    const youValue = metric.you(you);
    if (proValue === null || youValue === null) return [];

    const gap = youValue - proValue;
    const gapPercent = proValue === 0 ? null : (gap / proValue) * 100;

    return [
      {
        key: metric.key,
        label: metric.label,
        pro: proValue,
        you: youValue,
        gap,
        gapPercent,
        format: metric.format,
        reading: reading(metric, gapPercent, enoughGames),
      },
    ];
  });
}

/** True when the player's sample is too small for the rows to mean much. */
export function isLowSample(you: PlayerChampionAverages): boolean {
  return you.games < MIN_PLAYER_GAMES;
}

export function formatMetric(value: number, format: MetricFormat): string {
  switch (format) {
    case "ratio":
      return value.toFixed(2);
    case "percent":
      return `${Math.round(value)}%`;
    case "integer":
      return String(Math.round(value));
    // A CS/min of 8 and one of 8.4 are a real difference to a reader working on
    // farm, and rounding to a whole number would hide it.
    case "rate":
      return value.toFixed(1);
  }
}
