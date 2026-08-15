import { getMetaSnapshot } from "@/domains/meta";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { prisma } from "@/lib/db/prisma";
import type { ChampionMetaStats } from "@/domains/meta/types";
import type { DraftCatalog, DraftChampion } from "@/domains/draft/draftCatalog.types";

const TTL_MS = 60 * 60 * 1000;
let cached: { catalog: DraftCatalog; at: number } | null = null;

// A champion "plays" a lane if it is their main one, or if it sees at least a
// fifth of their main lane's games. Data Dragon's `tags` cannot answer this —
// those are class labels (Mage, Tank), not positions — so the lane filter has to
// come from the patch's own play data or it is guesswork.
const SECONDARY_LANE_SHARE = 0.2;

function lanesFor(stats: ChampionMetaStats | undefined): DraftChampion["lanes"] {
  if (!stats || stats.positions.length === 0) return [];
  const ranked = [...stats.positions].sort((a, b) => b.games - a.games);
  const main = ranked[0];
  if (!main || main.games === 0) return [];
  return ranked.filter((p) => p.games >= main.games * SECONDARY_LANE_SHARE).map((p) => p.position);
}

export async function getDraftCatalog(nowMs: number = Date.now()): Promise<DraftCatalog> {
  if (cached && nowMs - cached.at < TTL_MS) return cached.catalog;

  const [rows, snapshot, ddragon] = await Promise.all([
    prisma.champion.findMany({
      select: { key: true, name: true, roles: true },
      orderBy: { name: "asc" },
    }),
    getMetaSnapshot().catch(() => null),
    fetchAllChampions().catch(() => []),
  ]);

  const byKey = new Map((snapshot?.champions ?? []).map((c) => [c.championKey.toLowerCase(), c]));
  const ddragonByKey = new Map(ddragon.map((c) => [c.id.toLowerCase(), c]));

  const champions: DraftChampion[] = rows.map((row) => {
    const lower = row.key.toLowerCase();
    const stats = byKey.get(lower);
    const summary = ddragonByKey.get(lower);
    return {
      key: row.key,
      name: row.name,
      lanes: lanesFor(stats),
      winRate: stats?.overallWinRate ?? 0,
      pickRate: stats?.overallPickRate ?? 0,
      banRate: stats?.overallBanRate ?? 0,
      tags: summary?.tags ?? row.roles,
      attack: summary?.info.attack ?? 5,
      magic: summary?.info.magic ?? 5,
    };
  });

  const catalog: DraftCatalog = { patch: snapshot?.patch ?? "", champions };
  cached = { catalog, at: nowMs };
  return catalog;
}

/** Test seam — the catalogue is memoised per process. */
export function __resetDraftCatalog(): void {
  cached = null;
}
