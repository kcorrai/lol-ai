import type { CounterResult } from "@/domains/meta";
import { formatCount } from "@/lib/uiLocale";

const TIER_WORD: Record<number, string> = {
  1: "an S-tier",
  2: "a strong",
  3: "a balanced",
  4: "a situational",
  5: "an off-meta",
};

// A 150+ word, data-driven "how to play against X" paragraph. Combines real
// ranked numbers (win rate, hardest counters, scaling) with Data Dragon enemy
// tips so the copy is unique per champion and per patch.
export function counterHowToPlay(
  data: CounterResult,
  laneLabel: string,
  gamePatch: string,
  enemyTips: string[]
): string {
  const parts: string[] = [];
  const tier = TIER_WORD[data.overallTier] ?? "a viable";
  parts.push(
    `To beat ${data.name} in ${laneLabel} on patch ${gamePatch}, start by knowing what you are up against: ${data.name} is ${tier} pick this patch with a ${data.stats.winRate.toFixed(1)}% win rate across ${formatCount(data.stats.games)} ranked games at a ${data.stats.pickRate.toFixed(1)}% pick rate.`
  );

  const hard = data.strongAgainstSubject.slice(0, 3);
  if (hard.length > 0) {
    const lead = hard[0];
    parts.push(
      `The champions that beat ${data.name} hardest right now are ${hard.map((c) => c.name).join(", ")} — ${lead.name} wins ${lead.opponentWinRate.toFixed(1)}% of the lane against it. Any of these is a safe counter pick.`
    );
  }

  const scaling = scalingSentence(data);
  if (scaling) parts.push(scaling);

  const tips = enemyTips.slice(0, 3);
  if (tips.length > 0) {
    parts.push(`Playing the matchup itself: ${tips.join(" ")}`);
  }

  parts.push(
    `Pick a counter from the list below, respect ${data.name}'s power spikes, and track its cooldowns so you only commit to trades when its key abilities are down. Counter data updates automatically every patch.`
  );
  return parts.join(" ");
}

function scalingSentence(data: CounterResult): string {
  const early = data.build?.gameLengths.find((g) => g.minutes === 0)?.winRate;
  const late = data.build?.gameLengths.find((g) => g.minutes === 40)?.winRate;
  if (early === undefined || late === undefined) return "";
  if (late >= early + 1) {
    return `${data.name} scales — its win rate climbs to ${late.toFixed(1)}% past 40 minutes, so deny it farm early and force fights before it comes online.`;
  }
  if (early >= late + 1) {
    return `${data.name} is strongest early (${early.toFixed(1)}% before 25 minutes) and falls off, so survive the early game and the matchup swings your way.`;
  }
  return `${data.name} performs consistently across game lengths, so there is no single window to wait for — win lane on fundamentals.`;
}
