import type { MetadataRoute } from "next";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { getMatchupPairs, getMetaSnapshot, ALL_POSITIONS, POSITION_SLUG } from "@/domains/meta";
import { esportsSitemapEntries } from "@/domains/esports";
import { marketplaceSitemapEntries } from "@/domains/marketplace";
import { TRACKS, allLessons } from "@/domains/academy";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [champions, matchupPairs, snapshot, esports, marketplace] = await Promise.all([
    fetchAllChampions(),
    getMatchupPairs(1500),
    getMetaSnapshot(),
    esportsSitemapEntries(),
    marketplaceSitemapEntries(),
  ]);

  // Real last-modified for data pages: when the meta snapshot was last fetched.
  const dataLastMod = snapshot ? new Date(snapshot.fetchedAt) : undefined;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/champions`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/tools`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/meta`, lastModified: dataLastMod, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/tools/counter-picker`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/tools/matchup`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/tools/draft-analyzer`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/multi-search`, changeFrequency: "weekly", priority: 0.7 },
    // The create page only. Individual rooms are private scrim links and carry
    // `robots: noindex`, so they are deliberately absent.
    { url: `${BASE_URL}/draft`, changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${BASE_URL}/tools/tier-list`,
      lastModified: dataLastMod,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/builds`,
      lastModified: dataLastMod,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/aram/tier-list`,
      lastModified: dataLastMod,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...ALL_POSITIONS.map((pos) => ({
      url: `${BASE_URL}/tools/tier-list/${POSITION_SLUG[pos]}`,
      lastModified: dataLastMod,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  // The curriculum is code, so these are exact and never go stale against the routes.
  const academyRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/academy`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE_URL}/academy/roles`, changeFrequency: "weekly" as const, priority: 0.7 },
    ...TRACKS.map((track) => ({
      url: `${BASE_URL}/academy/${track.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...allLessons().map((lesson) => ({
      url: `${BASE_URL}/academy/${lesson.trackId}/${lesson.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const buildRoutes: MetadataRoute.Sitemap = champions.map((c) => ({
    url: `${BASE_URL}/builds/${c.id}`,
    lastModified: dataLastMod,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  /**
   * `/builds/[champion]/[role]` — "ahri mid build", which is how people actually search, and a
   * page we have been rendering without ever telling a crawler it exists.
   *
   * Emitted per *played* lane rather than per champion × five: a Yuumi top page is real but empty,
   * and filling a sitemap with thin pages is worse than omitting them.
   *
   * The floor is higher than the tier list's 0.3 because this list has a second job. op.gg's
   * per-lane build detail does not always exist for a lane its own snapshot reports — Syndra bot
   * and Galio support both render "not found" — and those misses cluster in the marginal lanes.
   * Measured against the running app, 2% clears them, and a lane nobody plays was not worth a
   * page anyway.
   */
  const MIN_LANE_PICK_RATE = 2;
  const roleBuildRoutes: MetadataRoute.Sitemap = (snapshot?.champions ?? []).flatMap((champ) =>
    champ.positions
      .filter((pos) => pos.pickRate >= MIN_LANE_PICK_RATE)
      .map((pos) => ({
        url: `${BASE_URL}/builds/${champ.championKey}/${POSITION_SLUG[pos.position]}`,
        lastModified: dataLastMod,
        changeFrequency: "daily" as const,
        // Below the champion's own build page: that one is the canonical entry for the champion.
        priority: 0.7,
      }))
  );

  const aramBuildRoutes: MetadataRoute.Sitemap = champions.map((c) => ({
    url: `${BASE_URL}/aram/${c.id}`,
    lastModified: dataLastMod,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const championRoutes: MetadataRoute.Sitemap = champions.map((c) => ({
    url: `${BASE_URL}/champions/${c.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const counterRoutes: MetadataRoute.Sitemap = champions.map((c) => ({
    url: `${BASE_URL}/counters/${c.id}`,
    lastModified: dataLastMod,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const matchupRoutes: MetadataRoute.Sitemap = matchupPairs.map((p) => ({
    url: `${BASE_URL}/matchups/${p.a.toLowerCase()}-vs-${p.b.toLowerCase()}`,
    lastModified: dataLastMod,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Computed from the cached esports indexes and already filtered by the
  // has-content rule (ADR-017 §4), so it is mapped rather than re-decided here.
  const esportsRoutes: MetadataRoute.Sitemap = esports.map((entry) => ({
    url: `${BASE_URL}${entry.path}`,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  // Coach profiles that have something on sale. Filtered storefront URLs are
  // deliberately absent — the filter space is combinatorial and every
  // combination renders the same handful of coaches (ADR-017 §4's reasoning).
  const marketplaceRoutes: MetadataRoute.Sitemap = marketplace.map((entry) => ({
    url: `${BASE_URL}${entry.path}`,
    lastModified: entry.lastModified,
    changeFrequency: "weekly" as const,
    priority: entry.path === "/coaches" ? 0.9 : 0.7,
  }));

  return [
    ...staticRoutes,
    ...academyRoutes,
    ...championRoutes,
    ...counterRoutes,
    ...buildRoutes,
    ...roleBuildRoutes,
    ...aramBuildRoutes,
    ...matchupRoutes,
    ...esportsRoutes,
    ...marketplaceRoutes,
  ];
}
