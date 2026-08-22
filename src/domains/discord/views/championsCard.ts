import { BRAND_COLOR } from "@/domains/discord/brand";
import type { BotRequest } from "@/domains/discord/request";
import { riotIdLabel } from "@/domains/discord/views/format";
import { card, cardActions, cardFooter } from "@/domains/discord/views/shell";
import { section, separator, textDisplay, thumbnail } from "@/lib/discord/components";
import type { ContainerChild, DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { championIconUrl } from "@/lib/ddragon";
import type { PreviewResponse } from "@/types/preview";

// Five is where the list stops being a champion pool and starts being a match
// history. It also keeps the message well inside Discord's 40-component cap.
const MAX_CHAMPIONS = 5;

export function championsCard(
  preview: PreviewResponse,
  req: BotRequest,
  profilePath: string
): DiscordMessagePayload {
  const name = riotIdLabel(preview.summoner);
  const champions = preview.topChampions.slice(0, MAX_CHAMPIONS);

  const rows: ContainerChild[] = champions.length
    ? champions.map((c) =>
        section(
          [
            `**${c.championName}** · ${c.games} game${c.games === 1 ? "" : "s"}`,
            `${Math.round(c.winRate)}% win rate (${c.wins}W ${c.games - c.wins}L)`,
          ],
          thumbnail(championIconUrl(c.championName), c.championName)
        )
      )
    : [textDisplay("No ranked games in the recent history to build a pool from.")];

  return card(
    [
      textDisplay(`### Champion pool — ${name}`),
      separator(),
      ...rows,
      ...cardFooter(),
      cardActions(req, profilePath),
    ],
    { accentColor: BRAND_COLOR }
  );
}
