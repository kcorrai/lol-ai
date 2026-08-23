import { championSplashUrl } from "@/lib/ddragon";
import {
  cleanAbilityText,
  type DdragonChampionDetail,
  type DdragonSkin,
} from "@/lib/ddragon/championsData";
import { fetchJsonLastGood } from "@/lib/http/lastGoodJson";
import { CDRAGON_ROOT, cdragonAssetUrl, skinRarity, type SkinRarity } from "@/lib/cdragon/assets";

export interface SkinChroma {
  id: number;
  name: string;
  colors: string[];
  tileUrl: string;
}

export interface SkinClip {
  description: string;
  videoUrl: string;
  posterUrl: string;
}

/**
 * Every viewable form of one skin.
 *
 * `splashUrl` comes from Data Dragon and is always present; everything else comes from
 * Community Dragon and is null when that catalogue could not be read. The nullability is
 * the degrade path, not an edge case — see `fetchChampionSkinMedia`.
 */
export interface SkinMedia {
  num: number;
  name: string;
  splashUrl: string;
  loadScreenUrl: string | null;
  tileUrl: string | null;
  uncenteredSplashUrl: string | null;
  rarity: SkinRarity | null;
  isLegacy: boolean;
  description: string | null;
  chromas: SkinChroma[];
  clips: SkinClip[];
}

interface CdragonChroma {
  id: number;
  name: string;
  colors: string[];
  tilePath: string;
}

interface CdragonFeaturePreview {
  description: string;
  iconPath: string;
  videoPath: string;
}

export interface CdragonSkin {
  id: number;
  name: string;
  isLegacy: boolean;
  rarity: string;
  description: string | null;
  uncenteredSplashPath: string;
  tilePath: string;
  loadScreenPath: string;
  chromas: CdragonChroma[] | null;
  skinFeaturePreviewData: CdragonFeaturePreview[] | null;
}

export interface CdragonChampion {
  skins: CdragonSkin[];
}

function toChroma(chroma: CdragonChroma): SkinChroma {
  return {
    id: chroma.id,
    name: chroma.name,
    colors: chroma.colors,
    tileUrl: cdragonAssetUrl(chroma.tilePath),
  };
}

function toClip(preview: CdragonFeaturePreview): SkinClip {
  return {
    description: preview.description,
    videoUrl: cdragonAssetUrl(preview.videoPath),
    posterUrl: cdragonAssetUrl(preview.iconPath),
  };
}

/**
 * Joins Data Dragon's skin list to Community Dragon's media for the same champion.
 *
 * Pure on purpose — the catalogue arrives as an argument so the join can be tested without
 * reaching the network, which CLAUDE.md 5.4 forbids in tests.
 */
export function mergeSkinMedia(
  ddragonSkins: DdragonSkin[],
  championName: string,
  cdragon: CdragonChampion | undefined
): SkinMedia[] {
  // A Community Dragon skin id is championId * 1000 + the Data Dragon skin number, so the
  // low three digits are the only part that says which skin it is.
  const byNum = new Map<number, CdragonSkin>(
    (cdragon?.skins ?? []).map((skin) => [skin.id % 1000, skin])
  );

  const merged = ddragonSkins.map((skin): SkinMedia => {
    const extra = byNum.get(skin.num);
    return {
      num: skin.num,
      name: skin.num === 0 ? `Default ${championName}` : skin.name,
      splashUrl: championSplashUrl(championName, skin.num),
      loadScreenUrl: extra ? cdragonAssetUrl(extra.loadScreenPath) : null,
      tileUrl: extra ? cdragonAssetUrl(extra.tilePath) : null,
      uncenteredSplashUrl: extra ? cdragonAssetUrl(extra.uncenteredSplashPath) : null,
      rarity: extra ? skinRarity(extra.rarity) : null,
      isLegacy: extra?.isLegacy ?? false,
      // 18 descriptions carry markup; the same cleaner the ability text uses handles them.
      description: extra?.description ? cleanAbilityText(extra.description) : null,
      chromas: (extra?.chromas ?? []).map(toChroma),
      clips: (extra?.skinFeaturePreviewData ?? []).map(toClip),
    };
  });

  // Data Dragon lists every chroma as a skin of its own — 74 of Ahri's 95 entries — and their
  // splash URLs 403, so the gallery was already padded with broken frames. The catalogue lists
  // only real skins and carries each chroma inside its parent, so when it is readable it
  // decides what the gallery contains. Without it, nothing is dropped: an unreachable
  // catalogue must not silently shrink the page.
  return cdragon ? merged.filter((skin) => byNum.has(skin.num)) : merged;
}

/**
 * Reads the champion's skin media, degrading to the Data Dragon splash gallery alone.
 *
 * `fetchJsonLastGood` resolves to `undefined` rather than rejecting (ADR-034), and
 * `mergeSkinMedia` treats that as "splash only" — so an unreachable Community Dragon costs
 * the badges and the in-game views, never the section or the page.
 */
export async function fetchChampionSkinMedia(champ: DdragonChampionDetail): Promise<SkinMedia[]> {
  const skins = champ.skins ?? [];

  // E2E replays every feed it depends on and must reach no network at all (CLAUDE.md 5.4).
  if (process.env.E2E_MOCK === "true") return mergeSkinMedia(skins, champ.name, undefined);

  const cdragon = await fetchJsonLastGood<CdragonChampion>(
    `${CDRAGON_ROOT}/v1/champions/${champ.key}.json`,
    { ttlSeconds: 86400 }
  );
  return mergeSkinMedia(skins, champ.name, cdragon);
}
