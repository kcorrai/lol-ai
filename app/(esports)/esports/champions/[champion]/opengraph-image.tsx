import { getProBuild } from "@/domains/esports";
import { fetchChampionDetail } from "@/lib/ddragon/championsData";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Champion in pro play — builds, runes and pick rate";

export default async function Image({
  params,
}: {
  params: { champion: string };
}): Promise<Response> {
  const [result, detail] = await Promise.all([
    getProBuild(params.champion),
    fetchChampionDetail(params.champion),
  ]);
  const name = detail?.name ?? params.champion;

  if (!result) {
    return renderOgImage({
      badge: "Pro play",
      title: `${name} in Pro Play`,
      subtitle: `No pro team has picked ${name} in the games on record.`,
    });
  }

  const { build } = result;
  const winRate = build.games > 0 ? Math.round((build.wins / build.games) * 100) : 0;
  const players = build.topPlayers
    .slice(0, 3)
    .map((player) => player.handle)
    .join(" · ");

  return renderOgImage({
    badge: `${build.games} pro ${build.games === 1 ? "game" : "games"} · ${winRate}% win rate`,
    title: `${name} Pro Builds`,
    subtitle: players.length > 0 ? `Played by ${players}` : "Items, runes and skill order from pro games.",
  });
}
