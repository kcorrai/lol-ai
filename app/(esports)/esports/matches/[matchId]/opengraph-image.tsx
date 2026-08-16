import { getMatch } from "@/domains/esports";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "LoL esports match — result, drafts and scoreboards";

export default async function Image({
  params,
}: {
  params: { matchId: string };
}): Promise<Response> {
  const match = await getMatch(params.matchId);
  if (!match) {
    return renderOgImage({
      badge: "Esports",
      title: "LoL Esports",
      subtitle: "Results, drafts and scoreboards from every pro league.",
    });
  }

  const [home, away] = match.teams;
  const played = (home?.gameWins ?? 0) + (away?.gameWins ?? 0) > 0;

  return renderOgImage({
    badge: match.bestOf ? `${match.league.name} · Bo${match.bestOf}` : match.league.name,
    title: `${home?.name ?? "TBD"} vs ${away?.name ?? "TBD"}`,
    // A finished series leads with the score — that is what the card is being
    // shared for. An upcoming one has no score to lead with.
    subtitle: played
      ? `${home?.name} ${home?.gameWins}–${away?.gameWins} ${away?.name} — drafts, scoreboards and player stats for every game.`
      : "Drafts, scoreboards and player stats, game by game, as the series is played.",
  });
}
