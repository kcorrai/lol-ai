import type { DraftChampion } from "@/domains/draft/draftCatalog.types";
import type { CounterTables, ScoreParts, TeamProfile } from "./advice.types";

// Everything is in win-rate points, so the parts are comparable and the total
// means something: "+3.1" is roughly three points of expected win rate, not an
// opaque index. A number with no unit is a number nobody can argue with.

const SKEW_THRESHOLD = 70; // a damage split past this is exploitable
const THIN_FRONTLINE = 40;
const COUNTER_WEIGHT = 0.5; // matchup data is noisier than overall win rate
const COMP_BONUS = 1.5;

/** How far above 50% the champion sits on this patch. */
export function metaScore(champion: DraftChampion): number {
  if (!champion.winRate) return 0;
  return round(champion.winRate - 50);
}

/**
 * Mean advantage into the enemy champions already on the board.
 *
 * The tables are the *enemy's* — `vs[candidate]` is how well that enemy does
 * against our candidate — so the candidate's edge is the mirror of it. Enemies
 * with no matchup entry are skipped rather than counted as even, because a
 * missing sample is not evidence of a coin flip.
 */
export function counterScore(
  champion: DraftChampion,
  enemyKeys: readonly string[],
  tables: CounterTables
): number {
  const key = champion.key.toLowerCase();
  const edges: number[] = [];

  for (const enemy of enemyKeys) {
    const enemyWinRate = tables[enemy.toLowerCase()]?.vs[key];
    if (enemyWinRate === undefined) continue;
    edges.push(50 - enemyWinRate);
  }

  if (edges.length === 0) return 0;
  return round((edges.reduce((a, b) => a + b, 0) / edges.length) * COUNTER_WEIGHT);
}

/** What the pick does for a comp that is skewed or short of a frontline. */
export function compScore(champion: DraftChampion, ally: TeamProfile): number {
  if (ally.adShare === 0 && ally.apShare === 0) return 0;

  let score = 0;
  const magicHeavy = champion.magic > champion.attack;

  if (ally.adShare >= SKEW_THRESHOLD && magicHeavy) score += COMP_BONUS;
  if (ally.apShare >= SKEW_THRESHOLD && !magicHeavy) score += COMP_BONUS;

  if (ally.frontlineScore < THIN_FRONTLINE) {
    if (champion.tags.includes("Tank")) score += COMP_BONUS;
    else if (champion.tags.includes("Fighter")) score += COMP_BONUS / 2;
  }

  return round(score);
}

/** How badly the enemy wants it — ban rate, in the same points as everything else. */
export function priorityScore(champion: DraftChampion): number {
  return round(champion.banRate / 10);
}

export function pickTotal(parts: ScoreParts): number {
  return round(parts.meta + parts.counter + parts.comp);
}

/**
 * A ban is worth making when the champion is strong, widely wanted, and beats
 * what we have already committed to.
 *
 * `parts.counter` is computed with our *own* locked picks as the opposing set,
 * so a high value means the candidate beats us — which is exactly the reason to
 * take it off the board.
 */
export function banTotal(parts: ScoreParts): number {
  return round(parts.meta + parts.priority + parts.counter);
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
