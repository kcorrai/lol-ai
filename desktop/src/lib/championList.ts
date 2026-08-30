import { tierLetter } from "@/domains/meta/tierLetter";
import type { DesktopChampionEntry } from "./champions";

/**
 * The champion browser's list, as the screen reads it: sorted, then cut into tiers.
 *
 * Separated from `champions.ts` because that module is the IPC boundary and this is a view
 * of what comes back. It is also the half worth testing — the ordering is the claim the
 * screen makes about which champion is better, and it has to survive a filter, a sort and a
 * regrouping without changing its mind.
 */

export const SORTS = ["Tier", "Win rate", "Pick rate"] as const;
export type Sort = (typeof SORTS)[number];

/**
 * Sorted, without touching the array it was given.
 *
 * "Tier" is the list's own order and therefore does nothing: the website already ranked the
 * lane by tier and then by rank, with small samples sunk below every trustworthy row, and
 * re-deriving that here from the two fields left on the wire would be a second opinion the
 * screen has no business having. The other two are plain descending sorts on one number,
 * which is exactly what a player asking for them wants.
 */
export function sortChampions(
  entries: readonly DesktopChampionEntry[],
  sort: Sort
): readonly DesktopChampionEntry[] {
  if (sort === "Tier") return entries;

  const by = sort === "Win rate" ? "winRate" : "pickRate";
  return [...entries].sort((a, b) => b[by] - a[by]);
}

/** One tier's run of champions, in the order they arrived. */
export interface TierGroup {
  /** "S" … "D", or "?" for a snapshot that gave no tier. */
  letter: string;
  /** What the tier means, in the words the tier list itself uses. */
  note: string;
  entries: readonly DesktopChampionEntry[];
}

/**
 * The reading of each tier, said once at the top of its run.
 *
 * Editorial, and deliberately so: a letter is a grade with no units, and a player who has
 * not read the tier list's methodology has no way to know whether B is fine or bad. These
 * are claims about the grade, not about any champion — the numbers in every row are what
 * carry the claims about those.
 */
const TIER_NOTES: Record<string, string> = {
  S: "Pick these blind",
  A: "Strong, needs a decent lane",
  B: "Playable, not why you win",
  C: "Falling off this patch",
  D: "Thin sample",
  "?": "The snapshot gave no tier",
};

/**
 * Champions cut into tiers, in the order the sorted list put them.
 *
 * Walked in order rather than collected per tier, which is the same rule `railGroups` in
 * `routes.ts` follows and for the same reason: the array *is* the ordering. Under a win-rate
 * sort a tier really can appear twice — an A-tier champion out-winning an S-tier one is a
 * fact about this patch, and quietly merging the two runs would hide it.
 *
 * An empty run is never emitted, so a tier nobody in this lane is in does not draw a header
 * over nothing.
 */
export function groupByTier(entries: readonly DesktopChampionEntry[]): TierGroup[] {
  const groups: TierGroup[] = [];

  for (const entry of entries) {
    const letter = tierLetter(entry.tier);
    const last = groups[groups.length - 1];

    if (last && last.letter === letter) {
      (last.entries as DesktopChampionEntry[]).push(entry);
      continue;
    }
    groups.push({ letter, note: TIER_NOTES[letter] ?? TIER_NOTES["?"], entries: [entry] });
  }

  return groups;
}

/**
 * How full a win-rate bar is drawn.
 *
 * 46–54 rather than 0–100. A champion's win rate lives in about eight points either side of
 * even, so a bar scaled from zero would be four-fifths full for everybody and would say
 * nothing at all — which is the difference between a chart and a decoration.
 */
export function winRateFill(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 46) / 8) * 100));
}

/** Above the field, at it, or below it — the website's own reading of a win rate. */
export function winRateTone(winRate: number): "good" | "even" | "bad" {
  if (winRate >= 52) return "good";
  if (winRate < 50) return "bad";
  return "even";
}
