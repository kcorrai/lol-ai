import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type {
  AbilitySlot,
  Position,
  QuizChampion,
  RangeType,
} from "../src/domains/quiz/types/quiz.types";

// Builds src/domains/quiz/data/championAttributes.json, the quiz's only source of
// champion facts. Run it after a champion release, review the diff, commit the JSON.
//
// Why a build step and not a runtime fetch: the quiz must not depend on a third
// party being up (LA-13 — a Data Dragon outage 500s any page on a stale cache
// entry). Baking the answers into the repo removes that failure mode entirely.
//
// Gender, species and region have no live source anywhere — verified against Data
// Dragon, CommunityDragon, Meraki, Riot's Universe API (403) and the Fandom wiki
// (402). Every project in this category hand-maintains them, and so do we, in
// data/curatedOverlay.json.

const DDRAGON = "https://ddragon.leagueoflegends.com";
const MERAKI = "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions";
const OUT = resolve(process.cwd(), "src/domains/quiz/data/championAttributes.json");
const OVERLAY = resolve(process.cwd(), "src/domains/quiz/data/curatedOverlay.json");
const FETCH_TIMEOUT_MS = 20_000;

interface DdragonChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  tags: string[];
  partype: string;
  stats: { attackrange: number };
}

interface MerakiChampion {
  positions?: string[];
  resource?: string;
  attackType?: string;
  releaseDate?: string;
  faction?: string;
}

interface OverlayEntry {
  gender: QuizChampion["gender"];
  species: string[];
  regions?: string[];
  positions?: Position[];
  resource?: string;
  rangeType?: RangeType;
  releaseYear?: number;
}

const FACTION_NAMES: Record<string, string> = {
  "bandle-city": "Bandle City",
  bilgewater: "Bilgewater",
  demacia: "Demacia",
  freljord: "Freljord",
  ionia: "Ionia",
  ixtal: "Ixtal",
  "mount-targon": "Targon",
  noxus: "Noxus",
  piltover: "Piltover",
  "shadow-isles": "Shadow Isles",
  shurima: "Shurima",
  void: "Void",
  zaun: "Zaun",
};

// Meraki says SUPPORT where the Riot match API says UTILITY; both are accepted so
// the map keeps working if the upstream vocabulary shifts back.
const POSITION_NAMES: Record<string, Position> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  MIDDLE_LANE: "Mid",
  BOTTOM: "Bot",
  ADC: "Bot",
  SUPPORT: "Support",
  UTILITY: "Support",
};

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Data Dragon spells an empty resource two ways; the grid needs one.
function normalizeResource(partype: string): string {
  const trimmed = partype.trim();
  return trimmed === "" || trimmed === "None" ? "Manaless" : trimmed;
}

interface DdragonDetail {
  lore: string;
  skins: { num: number }[];
  passive: { name: string; image: { full: string } };
  spells: { name: string; image: { full: string } }[];
}

/** Lore and ability icons are baked in for the same reason everything else is:
 *  a Data Dragon outage must not be able to reach the quiz (LA-13). */
async function fetchDetail(
  version: string,
  id: string
): Promise<Pick<QuizChampion, "skinNums" | "lore" | "abilities">> {
  const payload = await fetchJson<{ data: Record<string, DdragonDetail> }>(
    `${DDRAGON}/cdn/${version}/data/en_US/champion/${id}.json`
  );
  const detail = payload ? Object.values(payload.data)[0] : undefined;
  if (!detail) return { skinNums: [0], lore: "", abilities: [] };

  const slots: AbilitySlot[] = ["Q", "W", "E", "R"];
  return {
    skinNums: detail.skins.map((s) => s.num),
    lore: detail.lore
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
    abilities: [
      { slot: "P" as AbilitySlot, name: detail.passive.name, image: detail.passive.image.full },
      ...detail.spells.slice(0, 4).map((spell, i) => ({
        slot: slots[i],
        name: spell.name,
        image: spell.image.full,
      })),
    ],
  };
}

function build(
  champ: DdragonChampion,
  meraki: MerakiChampion | null,
  overlay: OverlayEntry,
  detail: Pick<QuizChampion, "skinNums" | "lore" | "abilities">
): QuizChampion {
  const merakiRegion = meraki?.faction ? FACTION_NAMES[meraki.faction] : undefined;
  const positions = (meraki?.positions ?? [])
    .map((p) => POSITION_NAMES[p])
    .filter((p): p is Position => Boolean(p));

  return {
    id: champ.id,
    key: Number(champ.key),
    name: champ.name,
    title: champ.title,
    gender: overlay.gender,
    species: overlay.species,
    // Meraki's faction is single-valued and buckets 20 champions as
    // "unaffiliated", so the overlay wins wherever it has an opinion.
    regions: overlay.regions ?? (merakiRegion ? [merakiRegion] : []),
    positions: overlay.positions ?? positions,
    classes: champ.tags,
    resource: overlay.resource ?? normalizeResource(champ.partype),
    rangeType:
      overlay.rangeType ??
      (meraki?.attackType === "RANGED" || meraki?.attackType === "MELEE"
        ? meraki.attackType === "RANGED"
          ? "Ranged"
          : "Melee"
        : champ.stats.attackrange > 325
          ? "Ranged"
          : "Melee"),
    releaseYear:
      overlay.releaseYear ?? (meraki?.releaseDate ? Number(meraki.releaseDate.slice(0, 4)) : 0),
    ...detail,
  };
}

async function main(): Promise<void> {
  const versions = await fetchJson<string[]>(`${DDRAGON}/api/versions.json`);
  const version = versions?.[0];
  if (!version) throw new Error("Data Dragon versions feed unreachable");

  const list = await fetchJson<{ data: Record<string, DdragonChampion> }>(
    `${DDRAGON}/cdn/${version}/data/en_US/champion.json`
  );
  if (!list) throw new Error("Data Dragon champion.json unreachable");

  const overlay = JSON.parse(readFileSync(OVERLAY, "utf-8")) as Record<string, OverlayEntry>;
  const champs = Object.values(list.data).sort((a, b) => a.id.localeCompare(b.id));
  process.stdout.write(`  patch ${version}, ${champs.length} champions\n`);

  const missing: string[] = [];
  const noMeraki: string[] = [];

  const result = await Promise.all(
    champs.map(async (champ) => {
      const entry = overlay[champ.id];
      if (!entry) {
        missing.push(champ.id);
        return null;
      }
      const [meraki, detail] = await Promise.all([
        fetchJson<MerakiChampion>(`${MERAKI}/${champ.id}.json`),
        fetchDetail(version, champ.id),
      ]);
      if (!meraki) noMeraki.push(champ.id);
      return build(champ, meraki, entry, detail);
    })
  );

  if (missing.length > 0) {
    // Hard failure: a champion with no curated row would silently become an
    // unanswerable Classic puzzle on whatever day the deck dealt it.
    throw new Error(
      `${missing.length} champion(s) missing from curatedOverlay.json: ${missing.join(", ")}`
    );
  }

  const champions = result.filter((c): c is QuizChampion => c !== null);
  const incomplete = champions.filter(
    (c) =>
      c.regions.length === 0 ||
      c.positions.length === 0 ||
      c.releaseYear === 0 ||
      c.lore.length === 0 ||
      c.abilities.length !== 5
  );
  if (incomplete.length > 0) {
    throw new Error(
      `${incomplete.length} champion(s) are missing regions/positions/releaseYear/lore/abilities: ${incomplete
        .map((c) => c.id)
        .join(", ")}`
    );
  }

  writeFileSync(OUT, `${JSON.stringify({ version, champions }, null, 2)}\n`, "utf-8");
  process.stdout.write(`  ✓ wrote ${champions.length} champions to championAttributes.json\n`);
  if (noMeraki.length > 0) {
    process.stdout.write(`  ⚠ overlay-only (Meraki has no entry): ${noMeraki.join(", ")}\n`);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`❌ ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
