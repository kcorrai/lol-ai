import type { RankBenchmarks } from "@/domains/analysis";
import type { PreviewMatch } from "@/types/preview";

/** Averages over the loaded games, and how each reads against the player's own tier. */
export interface FormMetric {
  label: string;
  value: string;
  /** Points above (positive) or below (negative) the tier average, or null when there is none. */
  delta: number | null;
  /** The tier average, formatted the same way as `value`, for the "vs Gold 6.5" line. */
  benchmark: string | null;
}

export interface ProfileForm {
  wins: number;
  losses: number;
  winRate: number;
  metrics: FormMetric[];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Aggregate KDA — the ratio of the sums, not the mean of each game's ratio.
 *
 * Both because it is what every LoL site means by an aggregate KDA, and because the mean is not
 * robust: one deathless game scores enormously under the deaths floor and drags the sample with
 * it. Mirrors `aggregateKDA` in `src/lib/kda`, computed here off the row shape.
 */
function aggregateKda(matches: PreviewMatch[]): number {
  const kills = matches.reduce((s, m) => s + m.kills, 0);
  const deaths = matches.reduce((s, m) => s + m.deaths, 0);
  const assists = matches.reduce((s, m) => s + m.assists, 0);
  return (kills + assists) / Math.max(deaths, 1);
}

/**
 * The form strip's numbers.
 *
 * `benchmarks` is null for an unranked player, and every metric then simply has nothing to
 * compare against — the strip still shows the averages, which is the part that is always true.
 */
export function buildProfileForm(
  matches: PreviewMatch[],
  benchmarks: RankBenchmarks | null
): ProfileForm {
  const wins = matches.filter((m) => m.win).length;

  const kda = aggregateKda(matches);
  // Only games with a lane have a meaningful CS rate; ARAM and Arena would drag it down for
  // reasons that say nothing about the player.
  const laned = matches.filter((m) => m.position !== "FILL");
  const csPerMin = mean(laned.map((m) => m.csPerMinute));
  const vision = mean(matches.map((m) => m.visionScore));
  const kp = mean(matches.map((m) => m.killParticipation)) * 100;

  const metrics: FormMetric[] = [
    metric("KDA", kda, benchmarks?.avgKDA ?? null, 2),
    ...(laned.length > 0
      ? [metric("CS / min", csPerMin, benchmarks?.avgCSPerMinute ?? null, 1)]
      : []),
    metric("Vision", vision, benchmarks?.avgVisionScore ?? null, 0),
    // Kill participation has no published tier average, so it stands on its own.
    metric("Kill part.", kp, null, 0, "%"),
  ];

  return {
    wins,
    losses: matches.length - wins,
    winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
    metrics,
  };
}

function metric(
  label: string,
  value: number,
  benchmark: number | null,
  digits: number,
  suffix = ""
): FormMetric {
  const format = (n: number): string => `${n.toFixed(digits)}${suffix}`;
  return {
    label,
    value: format(value),
    delta: benchmark === null ? null : value - benchmark,
    benchmark: benchmark === null ? null : format(benchmark),
  };
}
