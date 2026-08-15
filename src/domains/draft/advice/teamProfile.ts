import { ALL_POSITIONS } from "@/domains/meta/positions";
import type { CanonicalPosition } from "@/domains/meta/types";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";
import type { TeamProfile } from "./advice.types";

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Which lane each locked champion is most likely playing.
 *
 * A draft never says who goes where, so this is an inference: take the champions
 * with the fewest options first and give each one its best remaining lane. That
 * ordering matters — assigning a flex pick early can strand a one-lane champion
 * with nowhere to go.
 */
export function assignLanes(champions: readonly DraftChampion[]): Map<string, CanonicalPosition> {
  const assigned = new Map<string, CanonicalPosition>();
  const taken = new Set<CanonicalPosition>();

  const ordered = [...champions].sort((a, b) => a.lanes.length - b.lanes.length);
  for (const champion of ordered) {
    const lane = champion.lanes.find((l) => !taken.has(l));
    if (!lane) continue;
    taken.add(lane);
    assigned.set(champion.key.toLowerCase(), lane);
  }
  return assigned;
}

export function missingLanes(champions: readonly DraftChampion[]): CanonicalPosition[] {
  const taken = new Set(assignLanes(champions).values());
  return ALL_POSITIONS.filter((lane) => !taken.has(lane));
}

/**
 * The comp as it stands. Deliberately the same shape and the same arithmetic as
 * `draftTeamEval` on the server, so the live readout and the post-draft verdict
 * cannot disagree about what a team looks like.
 */
export function buildTeamProfile(champions: readonly DraftChampion[]): TeamProfile {
  if (champions.length === 0) {
    return {
      adShare: 0,
      apShare: 0,
      frontlineScore: 0,
      engageScore: 0,
      missingLanes: [...ALL_POSITIONS],
      avgWinRate: 0,
    };
  }

  let attack = 0;
  let magic = 0;
  let tanks = 0;
  let fighters = 0;
  let supports = 0;
  let winRateSum = 0;

  for (const champion of champions) {
    attack += champion.attack;
    magic += champion.magic;
    if (champion.tags.includes("Tank")) tanks += 1;
    if (champion.tags.includes("Fighter")) fighters += 1;
    if (champion.tags.includes("Support")) supports += 1;
    winRateSum += champion.winRate || 50;
  }

  const damage = attack + magic || 1;
  return {
    adShare: clamp((attack / damage) * 100),
    apShare: clamp((magic / damage) * 100),
    frontlineScore: clamp(tanks * 40 + fighters * 15),
    engageScore: clamp(tanks * 35 + supports * 20 + fighters * 10),
    missingLanes: missingLanes(champions),
    avgWinRate: Math.round((winRateSum / champions.length) * 10) / 10,
  };
}
