import type { ChampionBuild } from "@/domains/meta";
import type { LiveBuild, LiveItem } from "@/domains/desktop/contract";
import type { ItemInfo } from "@/lib/ddragon/itemsData";

/**
 * A patch build, in the shape the desktop app can render.
 *
 * The one thing this does that a cast could not is resolve item ids to names. Not for
 * want of permission at the other end — the app's content policy admits Data Dragon — but
 * because the catalogue is here: the ids are turned into words on the server that already
 * has it cached, rather than shipped to a client that would have to fetch one.
 *
 * Shared by the live game panel and the champion browser, which show the same build from
 * two directions: one for the champion being played right now, one for a champion being
 * read about. Neither computes it — both ask `@/domains/meta` and send this.
 */
export function toLiveBuild(build: ChampionBuild, catalogue: Map<number, ItemInfo>): LiveBuild {
  // An id the catalogue did not carry keeps its place with an empty name. The app renders
  // that as "item 3078", which is a gap the player can see — better than a build that is
  // quietly one item shorter.
  const name = (itemId: number): LiveItem => ({
    id: itemId,
    name: catalogue.get(itemId)?.name ?? "",
  });

  return {
    skillOrder: build.skillOrder,
    skillMaxOrder: build.skillMaxOrder,
    starters: (build.starterItems?.ids ?? []).map(name),
    core: (build.coreItems?.ids ?? []).map(name),
    boots: (build.boots?.ids ?? []).map(name),
    // The core build is what the sample belongs to; the starters and boots are read
    // against it rather than carrying their own.
    games: build.coreItems?.games ?? 0,
    winRate: build.coreItems?.winRate ?? 0,
  };
}
