import { getPlayer, roleLabel } from "@/domains/esports";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "LoL esports player — team, role and champion pool";

export default async function Image({ params }: { params: { slug: string } }): Promise<Response> {
  const entry = await getPlayer(params.slug);
  if (!entry) {
    return renderOgImage({
      badge: "Esports",
      title: "LoL Esports Players",
      subtitle: "Pro players by team and role, with the champions they actually play.",
    });
  }

  const { player, team } = entry;
  const role = roleLabel(player.role);

  return renderOgImage({
    badge: role ? `${team.name} · ${role}` : team.name,
    title: player.handle,
    // Champion pool is a walk of the game feed — too expensive for a card, and
    // the name and team are what a shared link needs to identify anyway.
    subtitle: player.fullName
      ? `${player.fullName} — champion pool, recent games and team.`
      : "Champion pool, recent games and team.",
  });
}
