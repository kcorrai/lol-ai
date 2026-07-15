import {
  getMetaSnapshot,
  findChampionStats,
  getChampionDetail,
  formatGamePatch,
} from "@/domains/meta";
import type { CanonicalPosition, MatchupEntry, MetaSnapshot, SnapshotMode } from "@/domains/meta";
import { fetchChampionDetail } from "@/lib/ddragon/championsData";
import { fetchItems } from "@/lib/ddragon/itemsData";
import { fetchRunes } from "@/lib/ddragon/runesData";
import type { BuildViewData } from "./BuildView";

// "Best counters" = opponents this champion loses to (low subject win rate),
// resolved to routable champion keys via the snapshot index.
function topCounters(
  snapshot: MetaSnapshot,
  counters: MatchupEntry[]
): { key: string; name: string }[] {
  const index = new Map(snapshot.champions.map((c) => [c.championId, c]));
  return counters
    .filter((c) => c.subjectWinRate < 50)
    .slice(0, 8)
    .map((c) => index.get(c.opponentId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ key: c.championKey, name: c.name }));
}

// Loads everything a build page needs (stats, build, catalogs, enriched counters),
// resolving the champion's lane. Returns null if the champion or build is missing.
export async function loadBuildData(
  championKey: string,
  requestedPosition?: CanonicalPosition,
  mode: SnapshotMode = "ranked"
): Promise<BuildViewData | null> {
  const snapshot = await getMetaSnapshot({ mode });
  if (!snapshot) return null;

  const champ = findChampionStats(snapshot, championKey);
  if (!champ || champ.positions.length === 0) return null;

  const availablePositions = champ.positions.map((p) => p.position);
  const position: CanonicalPosition =
    requestedPosition && availablePositions.includes(requestedPosition)
      ? requestedPosition
      : [...champ.positions].sort((a, b) => b.games - a.games)[0].position;

  const stats = champ.positions.find((p) => p.position === position)!;

  const [detail, ddragon, items, runes] = await Promise.all([
    getChampionDetail(champ.championId, position, { mode }),
    fetchChampionDetail(champ.championKey),
    fetchItems(),
    fetchRunes(),
  ]);
  if (!detail) return null;

  return {
    championKey: champ.championKey,
    name: champ.name,
    title: ddragon?.title ?? "",
    tags: ddragon?.tags ?? [],
    gamePatch: formatGamePatch(snapshot.patch),
    rawPatch: snapshot.patch,
    fetchedAt: snapshot.fetchedAt,
    matchCount: snapshot.matchCount,
    overallTier: champ.overallTier,
    position,
    availablePositions,
    stats,
    build: detail.build,
    items,
    runes,
    counters: topCounters(snapshot, detail.counters),
  };
}

// ARAM has no lanes: stats come from the champion's overall (mode-wide) numbers
// and the detail endpoint uses the NONE position segment. Returns null if the
// champion or its ARAM build is missing.
export async function loadAramBuildData(championKey: string): Promise<BuildViewData | null> {
  const snapshot = await getMetaSnapshot({ mode: "aram" });
  if (!snapshot) return null;

  const champ = findChampionStats(snapshot, championKey);
  if (!champ) return null;

  const [detail, ddragon, items, runes] = await Promise.all([
    getChampionDetail(champ.championId, "MIDDLE", { mode: "aram" }), // position ignored → NONE
    fetchChampionDetail(champ.championKey),
    fetchItems(),
    fetchRunes(),
  ]);
  if (!detail) return null;

  // Prefer the snapshot's game count; fall back to the top rune page's sample.
  const games = champ.overallGames || detail.build.runes?.games || 0;
  const stats = {
    position: "MIDDLE" as CanonicalPosition,
    games,
    winRate: champ.overallWinRate,
    pickRate: champ.overallPickRate,
    banRate: 0,
    tier: champ.overallTier,
    rank: champ.overallRank,
    prevPatchRank: champ.prevPatchRank,
    counters: detail.counters,
  };

  return {
    championKey: champ.championKey,
    name: champ.name,
    title: ddragon?.title ?? "",
    tags: ddragon?.tags ?? [],
    gamePatch: formatGamePatch(snapshot.patch),
    rawPatch: snapshot.patch,
    fetchedAt: snapshot.fetchedAt,
    matchCount: snapshot.matchCount,
    overallTier: champ.overallTier,
    position: "MIDDLE",
    availablePositions: [],
    stats,
    build: detail.build,
    items,
    runes,
    counters: topCounters(snapshot, detail.counters),
    mode: "aram",
  };
}
