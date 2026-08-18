import { z } from "zod";
import { Position, QueueType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// Every facet the archive can be sliced by. Kept apart from the service because the same shape is
// parsed from a query string, stored as JSON on a saved search, and re-parsed on the way back out —
// so it needs one definition all three agree on.

// Both lists come from Prisma's generated enums rather than being retyped here, so a queue added
// to the schema (LA-37 is widening QueueType so no game is dropped on ingest) becomes searchable
// without anyone remembering to edit this file.
export const POSITIONS = Object.values(Position);
export const QUEUE_TYPES = Object.values(QueueType);

/** Which side of the game the named player has to have been on. */
export const PLAYER_SIDES = ["with", "against", "either"] as const;

const numeric = z.coerce.number().finite();

export const archiveFilterSchema = z.object({
  // ── Core ───────────────────────────────────────────────────────────────────
  champions: z.array(z.string().min(1)).max(30).optional(),
  positions: z.array(z.nativeEnum(Position)).max(POSITIONS.length).optional(),
  queueTypes: z.array(z.nativeEnum(QueueType)).max(QUEUE_TYPES.length).optional(),
  result: z.enum(["win", "loss"]).optional(),
  /** ISO dates. Inclusive at both ends; `to` is widened to end-of-day by the builder. */
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  /** Matched as a prefix, so "15.14" catches every hotfix of that patch. */
  patch: z.string().min(1).max(16).optional(),

  // ── Played with / against ──────────────────────────────────────────────────
  playerPuuid: z.string().min(1).max(128).optional(),
  playerSide: z.enum(PLAYER_SIDES).default("either"),

  // ── Stat thresholds ────────────────────────────────────────────────────────
  minKda: numeric.min(0).max(100).optional(),
  minCsPerMinute: numeric.min(0).max(20).optional(),
  minVisionScore: numeric.min(0).max(500).optional(),
  minKills: numeric.int().min(0).max(100).optional(),
  maxDeaths: numeric.int().min(0).max(100).optional(),
  /** Game length in minutes. */
  minDuration: numeric.min(0).max(200).optional(),
  maxDuration: numeric.min(0).max(200).optional(),
});

export type ArchiveFilters = z.infer<typeof archiveFilterSchema>;

/** Parses filters off a URL query string. Repeated keys (`champions=Ahri&champions=Zed`) become arrays. */
export function parseArchiveFilters(params: URLSearchParams): ArchiveFilters {
  const list = (key: string): string[] | undefined => {
    const all = params.getAll(key).flatMap((v) => v.split(",")).filter(Boolean);
    return all.length > 0 ? all : undefined;
  };
  const one = (key: string): string | undefined => params.get(key) ?? undefined;

  return archiveFilterSchema.parse({
    champions: list("champions"),
    positions: list("positions"),
    queueTypes: list("queueTypes"),
    result: one("result"),
    from: one("from"),
    to: one("to"),
    patch: one("patch"),
    playerPuuid: one("playerPuuid"),
    playerSide: one("playerSide") ?? "either",
    minKda: one("minKda"),
    minCsPerMinute: one("minCsPerMinute"),
    minVisionScore: one("minVisionScore"),
    minKills: one("minKills"),
    maxDeaths: one("maxDeaths"),
    minDuration: one("minDuration"),
    maxDuration: one("maxDuration"),
  });
}

/** The `(matchId, teamId)` rows of the other player, resolved by the service before the where is built. */
export type CoPlayerRow = { matchId: string; teamId: number };

/**
 * Facets that cannot live in a `where` on their own, resolved to id sets by the service first.
 *
 * Two of them need this, for the same underlying reason — a `where` constrains one row's columns,
 * and neither of these is a column on one row:
 *
 * - `coPlayer` correlates *two rows of the same table* ("was this person on my team, in this
 *   match"). Resolved to the other player's `(matchId, teamId)` pairs.
 * - `kdaParticipantIds` filters on `(kills + assists) / max(deaths, 1)`, which is computed rather
 *   than stored, so no operator on any single column expresses it.
 *
 * Resolving them to ids here keeps the rest of the search in the Prisma fluent API instead of
 * dragging the whole query — pagination, aggregates and all — down to raw SQL for two facets.
 */
export type ResolvedFacets = {
  coPlayer?: CoPlayerRow[];
  kdaParticipantIds?: string[];
};

/** Builds the Prisma `where` for a search. */
export function buildArchiveWhere(
  puuid: string,
  filters: ArchiveFilters,
  resolved: ResolvedFacets = {}
): Prisma.MatchParticipantWhereInput {
  const where: Prisma.MatchParticipantWhereInput = { puuid };
  const match: Prisma.MatchWhereInput = {};

  if (filters.champions?.length) where.championName = { in: filters.champions };
  if (filters.positions?.length) where.position = { in: filters.positions };
  if (filters.result) where.won = filters.result === "win";

  if (filters.minCsPerMinute !== undefined) where.csPerMinute = { gte: filters.minCsPerMinute };
  if (filters.minVisionScore !== undefined) where.visionScore = { gte: filters.minVisionScore };
  if (filters.minKills !== undefined) where.kills = { gte: filters.minKills };
  if (filters.maxDeaths !== undefined) where.deaths = { lte: filters.maxDeaths };

  if (filters.queueTypes?.length) match.queueType = { in: filters.queueTypes };
  if (filters.patch) match.gameVersion = { startsWith: filters.patch };

  if (filters.from || filters.to) {
    match.gameStart = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }

  // Stored in seconds; the filter is expressed in minutes because that is how a player thinks
  // about game length.
  if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
    match.gameDuration = {
      ...(filters.minDuration !== undefined ? { gte: Math.round(filters.minDuration * 60) } : {}),
      ...(filters.maxDuration !== undefined ? { lte: Math.round(filters.maxDuration * 60) } : {}),
    };
  }

  if (Object.keys(match).length > 0) where.match = match;

  const and: Prisma.MatchParticipantWhereInput[] = [];
  if (resolved.coPlayer) and.push(coPlayerCondition(resolved.coPlayer, filters.playerSide));
  // An empty id set is a real answer — nothing cleared the threshold — so it must narrow to
  // nothing rather than be dropped as "no filter".
  if (resolved.kdaParticipantIds) and.push({ id: { in: resolved.kdaParticipantIds } });
  if (and.length > 0) where.AND = and;

  return where;
}

function coPlayerCondition(
  rows: CoPlayerRow[],
  side: ArchiveFilters["playerSide"]
): Prisma.MatchParticipantWhereInput {
  // An empty set means the named player shares no match with us — which must match nothing at
  // all, not everything. `id: { in: [] }` is the honest way to say that.
  if (rows.length === 0) return { id: { in: [] } };

  const byTeam = new Map<number, string[]>();
  for (const r of rows) {
    const bucket = byTeam.get(r.teamId);
    if (bucket) bucket.push(r.matchId);
    else byTeam.set(r.teamId, [r.matchId]);
  }

  if (side === "either") {
    return { matchId: { in: rows.map((r) => r.matchId) } };
  }

  // "with" keeps the matches where our row shares their team; "against" keeps the opposite side.
  // Expressed per team bucket, because which team is "theirs" changes match to match.
  return {
    OR: [...byTeam.entries()].map(([teamId, matchIds]) => ({
      matchId: { in: matchIds },
      teamId: side === "with" ? teamId : { not: teamId },
    })),
  };
}

/** True when no facet is set — lets the UI tell "everything" apart from "nothing matched". */
export function isEmptyFilter(filters: ArchiveFilters): boolean {
  return Object.entries(filters).every(
    ([key, value]) =>
      value === undefined ||
      (key === "playerSide" && value === "either") ||
      (Array.isArray(value) && value.length === 0)
  );
}
