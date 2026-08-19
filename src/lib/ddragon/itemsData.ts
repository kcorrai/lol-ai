import { getLatestDdragonVersion } from "@/lib/ddragon";
import { fetchJsonLastGood } from "@/lib/http/lastGoodJson";

export interface ItemInfo {
  id: number;
  name: string;
  iconUrl: string;
  gold: number;
  /**
   * True when nothing builds out of this item — a legendary, a finished pair of
   * boots, a trinket. Components like B. F. Sword are false, which is how a
   * final inventory can be read as a build rather than a shopping list.
   */
  finished: boolean;
  /** Potions, elixirs, control wards — bought to be used up, not built into. */
  consumable: boolean;
}

interface RawItem {
  name: string;
  image: { full: string };
  gold: { total: number };
  into?: string[];
  consumed?: boolean;
  tags?: string[];
}

// Cached catalog of Data Dragon items (id → name/icon/gold). Cached for 24h via
// the framework fetch cache.
export async function fetchItems(): Promise<Map<number, ItemInfo>> {
  // No network in an E2E run (CLAUDE.md 5.4). An empty catalogue is a state
  // every caller already handles — each one wraps this in a catch that falls
  // back to exactly this — so the pages render, minus item names. What the
  // catalogue is *for* is covered by proBuild.test.ts against fixed input.
  if (process.env.E2E_MOCK === "true") return new Map();

  const version = await getLatestDdragonVersion();
  const json = await fetchJsonLastGood<{ data: Record<string, RawItem> }>(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
    { ttlSeconds: 86400 }
  );

  const map = new Map<number, ItemInfo>();
  if (!json) return map;
  for (const [idStr, raw] of Object.entries(json.data)) {
    const id = Number(idStr);
    map.set(id, {
      id,
      name: raw.name,
      iconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${raw.image.full}`,
      gold: raw.gold.total,
      finished: (raw.into ?? []).length === 0,
      consumable: raw.consumed === true || (raw.tags ?? []).includes("Consumable"),
    });
  }
  return map;
}
