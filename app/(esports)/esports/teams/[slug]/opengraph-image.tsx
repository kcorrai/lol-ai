import { getTeam } from "@/domains/esports";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "LoL esports team — roster, schedule and results";

export default async function Image({ params }: { params: { slug: string } }): Promise<Response> {
  const team = await getTeam(params.slug);
  if (!team) {
    return renderOgImage({
      badge: "Esports",
      title: "LoL Esports Teams",
      subtitle: "Every active pro team: roster, next match, recent results and form.",
    });
  }

  // The starting five is the most recognisable thing about a team, and it comes
  // from the same cached payload as the name — no second request for a card.
  const starters = team.players
    .filter((player) => player.role !== null)
    .slice(0, 5)
    .map((player) => player.handle)
    .join(" · ");

  return renderOgImage({
    badge: team.league?.name ?? "Esports",
    title: team.name,
    subtitle: starters.length > 0 ? starters : "Roster, next match, recent results and form.",
  });
}
