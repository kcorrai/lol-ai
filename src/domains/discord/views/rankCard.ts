import { BRAND_COLOR } from "@/domains/discord/brand";
import type { BotRequest } from "@/domains/discord/request";
import {
  formDots,
  rankHeadline,
  riotIdLabel,
  winRateLine,
} from "@/domains/discord/views/format";
import { card, cardActions, cardFooter } from "@/domains/discord/views/shell";
import { section, separator, textDisplay, thumbnail } from "@/lib/discord/components";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { TIER_HEX } from "@/lib/discord/embeds";
import { profileIconUrl, rankEmblemUrl } from "@/lib/ddragon";
import type { PreviewResponse } from "@/types/preview";

export function rankCard(
  preview: PreviewResponse,
  req: BotRequest,
  profilePath: string
): DiscordMessagePayload {
  const { summoner, rank } = preview;
  const name = riotIdLabel(summoner);

  // The accent stripe is the tier colour, so the rank is readable before a
  // single word is. Unranked has no tier, so it falls back to the brand colour.
  const accent = rank ? (TIER_HEX[rank.tier] ?? BRAND_COLOR) : BRAND_COLOR;
  const emblem = rank ? rankEmblemUrl(rank.tier) : profileIconUrl(summoner.profileIconId);

  return card(
    [
      section(
        [
          `### ${name}`,
          rankHeadline(rank),
          rank ? winRateLine(rank.wins, rank.losses) : `Level ${summoner.summonerLevel}`,
        ],
        thumbnail(emblem, rank ? `${rank.tier} emblem` : `${name} profile icon`)
      ),
      separator(),
      textDisplay(`**Recent form**\n${formDots(preview.recentMatches)}`),
      ...cardFooter(),
      cardActions(req, profilePath),
    ],
    { accentColor: accent }
  );
}
