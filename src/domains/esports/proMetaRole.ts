import { ROLE_SHORT } from "@/domains/esports/roles";
import type { PlayerRole, ProChampionStat } from "@/domains/esports/types";

/** Lane order as a draft reads it, top to support — not alphabetical. */
export const PRO_META_ROLES: { key: PlayerRole; label: string }[] = (
  ["top", "jungle", "mid", "bottom", "support"] as const
).map((key) => ({ key, label: ROLE_SHORT[key] }));

const KEYS = new Set<string>(PRO_META_ROLES.map((role) => role.key));

/** The role scope named in the URL, or null for the unfiltered table. */
export function parseProMetaRole(raw: string | undefined): PlayerRole | null {
  return raw !== undefined && KEYS.has(raw) ? (raw as PlayerRole) : null;
}

/**
 * The table narrowed to one lane.
 *
 * A champion is kept when it was picked in that role at all, not only when the
 * role is its most common one: filtering "jungle" out of a champion pros played
 * nine times in the jungle — because they played it ten times mid — would hide
 * exactly the flex pick the filter was opened to find. The row still names its
 * top role and flags the flex, so nothing about that is hidden either.
 */
export function filterByRole(
  champions: ProChampionStat[],
  role: PlayerRole | null
): ProChampionStat[] {
  if (role === null) return champions;
  return champions.filter((champion) => (champion.roles[role] ?? 0) > 0);
}
