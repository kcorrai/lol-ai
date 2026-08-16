import { getLeague } from "@/domains/esports";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "LoL esports league — standings, schedule and results";

export default async function Image({ params }: { params: { slug: string } }): Promise<Response> {
  const league = await getLeague(params.slug);
  if (!league) {
    return renderOgImage({
      badge: "Esports",
      title: "LoL Esports Leagues",
      subtitle: "Standings, schedule and results for every league Riot publishes.",
    });
  }

  return renderOgImage({
    badge: league.region.charAt(0) + league.region.slice(1).toLowerCase(),
    title: league.name,
    subtitle: "Standings, upcoming matches and the latest results — updated automatically.",
  });
}
