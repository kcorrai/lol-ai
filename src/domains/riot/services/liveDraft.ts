import type { CanonicalPosition } from "@/domains/meta/types";

/** Summoner spell id for Smite — the one unambiguous role signal a live game gives us. */
export const SMITE_SPELL_ID = 11;

const LANES: CanonicalPosition[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
const BLUE_TEAM = 100;

export interface LiveParticipant {
  championId: number;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
}

/** How often a champion is played in each lane, from the meta snapshot. */
export type LaneFrequency = Map<number, { position: CanonicalPosition; games: number }[]>;

export interface LiveDraftTeams {
  blue: Partial<Record<CanonicalPosition, string>>;
  red: Partial<Record<CanonicalPosition, string>>;
}

export interface LiveMatchup {
  champion: string;
  opponent: string;
  position: CanonicalPosition;
}

/**
 * The player's own lane matchup: their champion against whoever the other team put in the same
 * inferred lane.
 *
 * This trusts the lane inference more than the draft view does. A mis-assigned lane there is one
 * champion in the wrong row; here it names the wrong opponent and the entire answer changes — so
 * callers must let the player correct it rather than presenting it as certain.
 *
 * Returns null when the player's champion couldn't be placed or nobody opposes their lane.
 */
export function findMatchup(
  draft: LiveDraftTeams,
  yourSide: "blue" | "red",
  yourChampion: string | undefined
): LiveMatchup | null {
  if (!yourChampion) return null;

  const own = yourSide === "blue" ? draft.blue : draft.red;
  const enemy = yourSide === "blue" ? draft.red : draft.blue;

  const position = (Object.keys(own) as CanonicalPosition[]).find((p) => own[p] === yourChampion);
  if (!position) return null;

  const opponent = enemy[position];
  return opponent ? { champion: yourChampion, opponent, position } : null;
}

/**
 * Guesses each player's lane from a live game.
 *
 * The Spectator API gives champions and summoner spells but **no lane assignments**, so this is
 * inference, not fact — the UI presents it as a starting point the player can correct.
 *
 * Two signals, in order of trust:
 *  1. Smite. A player carrying it is the jungler, full stop.
 *  2. How often the champion is actually played in each lane this patch. Assigned greedily by
 *     confidence, so a champion that is 95% mid claims mid before one that is 40% mid.
 *
 * @param participants  the ten players in the game
 * @param laneFrequency championId → lane play counts, most-played first
 * @param championKeys  championId → Data Dragon id, which is what the draft analyzer takes
 */
export function assignLanes(
  participants: LiveParticipant[],
  laneFrequency: LaneFrequency,
  championKeys: Map<number, string>
): LiveDraftTeams {
  const result: LiveDraftTeams = { blue: {}, red: {} };

  for (const teamId of [BLUE_TEAM, 200]) {
    const side = teamId === BLUE_TEAM ? result.blue : result.red;
    const team = participants.filter((p) => p.teamId === teamId);
    const taken = new Set<CanonicalPosition>();
    const unplaced: LiveParticipant[] = [];

    for (const p of team) {
      const hasSmite = p.spell1Id === SMITE_SPELL_ID || p.spell2Id === SMITE_SPELL_ID;
      if (hasSmite && !taken.has("JUNGLE")) {
        place(side, taken, "JUNGLE", p.championId, championKeys);
      } else {
        unplaced.push(p);
      }
    }

    // Strongest signal first: whoever is most concentrated in one lane gets to claim it, so a
    // 95%-mid champion isn't pushed off mid by a flex pick that merely happens to come first.
    const ranked = unplaced
      .map((p) => {
        const entries = rankLanes(p.championId, laneFrequency);
        return {
          participant: p,
          lanes: entries.map((e) => e.position),
          confidence: concentration(entries),
        };
      })
      .sort((a, b) => b.confidence - a.confidence);

    for (const { participant, lanes } of ranked) {
      const lane = lanes.find((l) => !taken.has(l)) ?? LANES.find((l) => !taken.has(l)) ?? null;
      if (lane) place(side, taken, lane, participant.championId, championKeys);
    }
  }

  return result;
}

function place(
  side: Partial<Record<CanonicalPosition, string>>,
  taken: Set<CanonicalPosition>,
  lane: CanonicalPosition,
  championId: number,
  championKeys: Map<number, string>
): void {
  const key = championKeys.get(championId);
  // A champion we can't name is one the draft analyzer couldn't evaluate anyway — leave the slot
  // empty rather than filling it with an id the form can't render.
  if (!key) return;
  side[lane] = key;
  taken.add(lane);
}

/** The champion's lanes, most-played first. */
function rankLanes(
  championId: number,
  laneFrequency: LaneFrequency
): { position: CanonicalPosition; games: number }[] {
  return [...(laneFrequency.get(championId) ?? [])].sort((a, b) => b.games - a.games);
}

/**
 * What share of a champion's games happen in its best lane, 0-1.
 *
 * A near-exclusively-mid champion scores ~0.95 and gets to claim mid ahead of a flex pick that
 * only plays there 40% of the time. Counting lanes instead of weighting them would treat a
 * 95/5 split and a 50/50 split as equally confident.
 */
function concentration(lanes: { games: number }[]): number {
  const total = lanes.reduce((sum, l) => sum + l.games, 0);
  return total === 0 ? 0 : lanes[0].games / total;
}
