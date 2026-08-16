import { getLatestDdragonVersion } from "@/lib/ddragon";

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
  const version = await getLatestDdragonVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
    { next: { revalidate: 86400 } }
  );
  const json = (await res.json()) as { data: Record<string, RawItem> };

  const map = new Map<number, ItemInfo>();
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
