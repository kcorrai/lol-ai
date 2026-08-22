import type { BotRequest } from "@/domains/discord/request";
import { searchPlayers, VALID_REGIONS } from "@/domains/riot";
import { splitRiotId } from "@/lib/riot/riotId";

/** Used only when nothing else identifies a region — the largest shard. */
export const DEFAULT_REGION = "euw1";

export interface RiotTarget {
  gameName: string;
  tagLine: string;
  region: string;
  /** True when the region was guessed rather than given, so errors can say so. */
  regionInferred: boolean;
}

export type TargetResolution =
  | { ok: true; target: RiotTarget }
  | { ok: false; reason: "missing" | "malformed" | "bad-region" };

/**
 * Turns what someone typed into a Riot account to look up.
 *
 * When no region is given the player index is consulted first — it already
 * holds every Riot ID seen in a synced match, so the common case resolves to
 * the right shard without anybody having to name it. Only when that misses does
 * it fall back to a default, and the caller is told it guessed so the failure
 * message can suggest the region argument.
 */
export async function resolveTarget(req: BotRequest): Promise<TargetResolution> {
  if (!req.riotId) return { ok: false, reason: "missing" };

  const split = splitRiotId(req.riotId);
  if (!split) return { ok: false, reason: "malformed" };

  if (req.region) {
    if (!VALID_REGIONS.includes(req.region)) return { ok: false, reason: "bad-region" };
    return { ok: true, target: { ...split, region: req.region, regionInferred: false } };
  }

  const [hit] = await searchPlayers(req.riotId, { limit: 1 });
  const exact =
    hit &&
    hit.gameName.toLowerCase() === split.gameName.toLowerCase() &&
    hit.tagLine.toLowerCase() === split.tagLine.toLowerCase();

  return {
    ok: true,
    target: {
      ...split,
      region: exact ? hit.region : DEFAULT_REGION,
      regionInferred: !exact,
    },
  };
}
