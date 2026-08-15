import { getChampionCounters } from "@/domains/meta";
import { prisma } from "@/lib/db/prisma";
import type { CounterTables } from "@/domains/draft/advice/advice.types";
import { getDraftCatalog } from "./draftCatalogService";

const MAX_KEYS = 10; // ten champions on a board, and never more

/**
 * Head-to-head win rates for the champions already locked in a draft.
 *
 * Shipping the whole matchup matrix would be roughly 170 × 170 numbers; the room
 * only ever needs the ten rows belonging to champions actually on the board, and
 * it needs each one exactly once — so this is fetched per lock, not per turn.
 */
export async function getCounterTables(keys: readonly string[]): Promise<CounterTables> {
  const wanted = [...new Set(keys.map((k) => k.toLowerCase()))].slice(0, MAX_KEYS);
  if (wanted.length === 0) return {};

  const [rows, catalog] = await Promise.all([
    prisma.champion.findMany({ select: { id: true, key: true } }),
    getDraftCatalog(),
  ]);

  const idByKey = new Map(rows.map((r) => [r.key.toLowerCase(), r.id]));
  const keyById = new Map(rows.map((r) => [r.id, r.key.toLowerCase()]));
  const lanesByKey = new Map(catalog.champions.map((c) => [c.key.toLowerCase(), c.lanes]));

  const tables: CounterTables = {};
  await Promise.all(
    wanted.map(async (key) => {
      const championId = idByKey.get(key);
      const lane = lanesByKey.get(key)?.[0] ?? null;
      if (!championId || !lane) {
        tables[key] = { lane, vs: {} };
        return;
      }

      const matchups = await getChampionCounters(championId, lane).catch(() => null);
      const vs: Record<string, number> = {};
      for (const entry of matchups ?? []) {
        const opponent = keyById.get(entry.opponentId);
        if (opponent) vs[opponent] = entry.subjectWinRate;
      }
      tables[key] = { lane, vs };
    })
  );

  return tables;
}
