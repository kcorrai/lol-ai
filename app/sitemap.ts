import type { MetadataRoute } from "next";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { getMatchupPairs, ALL_POSITIONS, POSITION_SLUG } from "@/domains/meta";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [champions, matchupPairs] = await Promise.all([fetchAllChampions(), getMatchupPairs(1500)]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/champions`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/tools`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/meta`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/tools/counter-picker`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/tools/matchup`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/tools/draft-analyzer`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/tier-list`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/builds`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/aram/tier-list`, changeFrequency: "daily", priority: 0.8 },
    ...ALL_POSITIONS.map((pos) => ({
      url: `${BASE_URL}/tools/tier-list/${POSITION_SLUG[pos]}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  const buildRoutes: MetadataRoute.Sitemap = champions.map((c) => ({
    url: `${BASE_URL}/builds/${c.id}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const aramBuildRoutes: MetadataRoute.Sitemap = champions.map((c) => ({
    url: `${BASE_URL}/aram/${c.id}`,
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
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const matchupRoutes: MetadataRoute.Sitemap = matchupPairs.map((p) => ({
    url: `${BASE_URL}/matchups/${p.a.toLowerCase()}-vs-${p.b.toLowerCase()}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...championRoutes,
    ...counterRoutes,
    ...buildRoutes,
    ...aramBuildRoutes,
    ...matchupRoutes,
  ];
}
