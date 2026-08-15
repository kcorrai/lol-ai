import { getMetaSnapshot } from "@/domains/meta";
import { normaliseKey } from "@/domains/draft/engine/draft.types";
import { prisma } from "@/lib/db/prisma";

export interface ChampionPool {
  /** Every champion key, strongest first. Drives the auto-lock on an expired pick. */
  ranked: string[];
  /** Lowercase keys of every champion that exists, for the unknown-champion check. */
  known: ReadonlySet<string>;
}

const TTL_MS = 60 * 60 * 1000;
let cached: { pool: ChampionPool; at: number } | null = null;

/**
 * The champion catalogue, ordered by this patch's win rate.
 *
 * The order matters because `resolveTimeout` takes the first legal entry: a
 * drafter whose turn expires gets the best available champion rather than
 * whatever happened to sort first alphabetically. Champions the meta feed does
 * not cover are appended alphabetically so the pool is always complete.
 */
export async function getChampionPool(nowMs: number = Date.now()): Promise<ChampionPool> {
  if (cached && nowMs - cached.at < TTL_MS) return cached.pool;

  const [rows, snapshot] = await Promise.all([
    prisma.champion.findMany({ select: { key: true }, orderBy: { key: "asc" } }),
    getMetaSnapshot().catch(() => null),
  ]);

  const known = new Set(rows.map((r) => normaliseKey(r.key)));
  const byKey = new Map(rows.map((r) => [normaliseKey(r.key), r.key]));

  const ranked: string[] = [];
  const seen = new Set<string>();
  for (const champion of [...(snapshot?.champions ?? [])].sort(
    (a, b) => b.overallWinRate - a.overallWinRate
  )) {
    const lower = normaliseKey(champion.championKey);
    if (!known.has(lower) || seen.has(lower)) continue;
    seen.add(lower);
    ranked.push(byKey.get(lower) ?? champion.championKey);
  }
  for (const row of rows) {
    if (!seen.has(normaliseKey(row.key))) ranked.push(row.key);
  }

  const pool: ChampionPool = { ranked, known };
  cached = { pool, at: nowMs };
  return pool;
}

/** Test seam — the pool is memoised per process. */
export function __resetChampionPool(): void {
  cached = null;
}
