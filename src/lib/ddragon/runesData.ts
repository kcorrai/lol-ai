import { getLatestDdragonVersion } from "@/lib/ddragon";
import { fetchJsonLastGood } from "@/lib/http/lastGoodJson";

export interface RuneInfo {
  id: number;
  name: string;
  iconUrl: string;
}

interface RawRune {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots?: { runes: RawRune[] }[];
}

const runeIconUrl = (icon: string): string =>
  `https://ddragon.leagueoflegends.com/cdn/img/${icon}`;

// Stat shards are not in runesReforged.json — small static catalog (id → label +
// Community Dragon icon). The rcp-fe-lol-perks image path 404s; the shard icons
// live under the game assets tree.
const SHARD_BASE = "https://raw.communitydragon.org/latest/game/assets/perks";
export const STAT_SHARDS: Record<number, RuneInfo> = {
  5008: { id: 5008, name: "Adaptive Force", iconUrl: `${SHARD_BASE}/statmods/statmodsadaptiveforceicon.png` },
  5005: { id: 5005, name: "Attack Speed", iconUrl: `${SHARD_BASE}/statmods/statmodsattackspeedicon.png` },
  5007: { id: 5007, name: "Ability Haste", iconUrl: `${SHARD_BASE}/statmods/statmodscdrscalingicon.png` },
  5001: { id: 5001, name: "Health Scaling", iconUrl: `${SHARD_BASE}/statmods/statmodshealthscalingicon.png` },
  5011: { id: 5011, name: "Health", iconUrl: `${SHARD_BASE}/statmods/statmodshealthplusicon.png` },
  5013: { id: 5013, name: "Tenacity", iconUrl: `${SHARD_BASE}/statmods/statmodstenacityicon.png` },
  5010: { id: 5010, name: "Move Speed", iconUrl: `${SHARD_BASE}/statmods/statmodsmovementspeedicon.png` },
  5002: { id: 5002, name: "Armor", iconUrl: `${SHARD_BASE}/statmods/statmodsarmoricon.png` },
  5003: { id: 5003, name: "Magic Resist", iconUrl: `${SHARD_BASE}/statmods/statmodsmagicresicon.png` },
};

// Cached catalog of every rune AND rune path (id → name/icon), plus stat shards.
export async function fetchRunes(): Promise<Map<number, RuneInfo>> {
  const version = await getLatestDdragonVersion();
  const paths = await fetchJsonLastGood<RawRune[]>(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`,
    { ttlSeconds: 86400 }
  );

  const map = new Map<number, RuneInfo>();
  for (const path of paths ?? []) {
    map.set(path.id, { id: path.id, name: path.name, iconUrl: runeIconUrl(path.icon) });
    for (const slot of path.slots ?? []) {
      for (const rune of slot.runes) {
        map.set(rune.id, { id: rune.id, name: rune.name, iconUrl: runeIconUrl(rune.icon) });
      }
    }
  }
  for (const [id, shard] of Object.entries(STAT_SHARDS)) {
    map.set(Number(id), shard);
  }
  return map;
}
