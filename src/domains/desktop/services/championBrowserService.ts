import { getCounterData, getTierList } from "@/domains/meta";
import type { CanonicalPosition, ChampionBuild } from "@/domains/meta";
import type {
  DesktopChampion,
  DesktopChampionList,
  DesktopCounter,
} from "@/domains/desktop/championsContract";
import { readChampionIdentity } from "@/domains/desktop/services/championAbilities";
import { toLiveBuild } from "@/domains/desktop/services/liveBuild";
import { fetchItems, type ItemInfo } from "@/lib/ddragon/itemsData";

// The champion browser's reading, for the desktop companion (LA-75, ADR-042).
//
// Two reads, both through `@/domains/meta`'s public API and neither of them new: the
// same lane list the website's tier list page ranks, and the same counter page a
// player would open in a browser. Nothing is computed here that the website does not
// already compute for its own pages.
//
// This is also the whole of the app's exposure to the op.gg feed for these screens.
// LA-70 exists to leave that feed, and when it lands this file is what changes — not
// the two routes above it and not the screens above those.
//
// Nothing on this path may call a language model. `getCounterData` reaches
// `getChampionDetail`, which reads op.gg and a key-value cache; `getChampionDeepDive`
// is the one that generates prose and is deliberately not used here.

/**
 * One lane's champions, best first.
 *
 * `getTierList` drops picks under 0.3% of the lane, so an off-meta champion in a lane
 * nobody plays it in is absent rather than listed at the bottom. That is the same list
 * the website shows, and the same reason: this is a read of the meta, not a roster.
 *
 * Null means the patch snapshot could not be reached at all, which the route answers as
 * a 503 — a state the app can retry rather than one it should render as "no champions".
 */
export async function listChampions(
  position: CanonicalPosition
): Promise<DesktopChampionList | null> {
  const list = await getTierList(position);
  if (!list) return null;

  return {
    position: list.position,
    patch: list.patch,
    entries: list.entries.map((entry) => ({
      championKey: entry.championKey,
      name: entry.name,
      tier: entry.tier,
      rank: entry.rank,
      winRate: entry.winRate,
      pickRate: entry.pickRate,
      banRate: entry.banRate,
      games: entry.games,
      lowConfidence: entry.lowConfidence,
    })),
  };
}

/**
 * One champion in one lane: how it does, how it is built, and what beats it.
 *
 * A single `getCounterData` call, which already carries the stats, the build, the lanes
 * the champion is played in and both matchup lists with opponent names resolved. Asking
 * for those separately would be three round trips to the same snapshot.
 *
 * The lane in the answer is the one the website resolved, not necessarily the one asked
 * for: a champion nobody plays in the requested lane is answered in the lane it is
 * played in, and `availablePositions` is what lets the app say so.
 */
export async function readChampion(
  championKey: string,
  position: CanonicalPosition
): Promise<DesktopChampion | null> {
  const data = await getCounterData(championKey, position);
  if (!data) return null;

  // The build and the kit come from two different feeds — the patch snapshot and the
  // Data Dragon catalogue — so they are read together rather than in sequence. Keyed on
  // the champion the snapshot resolved, not the one that was asked for: those differ
  // whenever the app sends a display name and the snapshot answers with an id.
  const [build, identity] = await Promise.all([
    readBuild(data.build),
    readChampionIdentity(data.championKey),
  ]);

  return {
    champion: { key: data.championKey, name: data.name },
    position: data.position,
    patch: data.patch,
    availablePositions: data.availablePositions,
    stats: {
      games: data.stats.games,
      winRate: data.stats.winRate,
      pickRate: data.stats.pickRate,
      banRate: data.stats.banRate,
      tier: data.stats.tier,
    },
    build,
    title: identity.title,
    tags: identity.tags,
    abilities: identity.abilities,
    counteredBy: data.strongAgainstSubject.map(toCounter),
    goodInto: data.weakAgainstSubject.map(toCounter),
  };
}

/**
 * `subjectWinRate` in both lists, deliberately. op.gg names the opponent's rate too, but
 * a number that flips meaning between two lists on the same screen is one the player has
 * to translate before they can read it.
 */
function toCounter(matchup: {
  championKey: string;
  name: string;
  games: number;
  subjectWinRate: number;
}): DesktopCounter {
  return {
    championKey: matchup.championKey,
    name: matchup.name,
    games: matchup.games,
    subjectWinRate: matchup.subjectWinRate,
  };
}

/** Item ids become names here because the app's content policy forbids remote icons. */
async function readBuild(build: ChampionBuild | null): Promise<DesktopChampion["build"]> {
  if (!build) return null;

  // A catalogue that will not load is not a reason to drop the build: the ids still
  // carry the order, and the app renders an unnamed item as its id.
  const catalogue = await fetchItems().catch(() => new Map<number, ItemInfo>());
  return toLiveBuild(build, catalogue);
}
