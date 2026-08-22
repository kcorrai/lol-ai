import { BRAND_COLOR } from "@/domains/discord/brand";
import type { BotRequest } from "@/domains/discord/request";
import {
  championSummary,
  formDots,
  rankHeadline,
  riotIdLabel,
  winRateLine,
} from "@/domains/discord/views/format";
import { card, cardActions, cardFooter } from "@/domains/discord/views/shell";
import { section, separator, textDisplay, thumbnail } from "@/lib/discord/components";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { TIER_HEX } from "@/lib/discord/embeds";
import { profileIconUrl } from "@/lib/ddragon";
import type { PreviewResponse } from "@/types/preview";

export function profileCard(
  preview: PreviewResponse,
  req: BotRequest,
  profilePath: string
): DiscordMessagePayload {
  const { summoner, rank } = preview;
  const accent = rank ? (TIER_HEX[rank.tier] ?? BRAND_COLOR) : BRAND_COLOR;

  return card(
    [
      section(
        [
          `### ${riotIdLabel(summoner)}`,
          `Level ${summoner.summonerLevel} · ${rankHeadline(rank)}`,
          rank ? winRateLine(rank.wins, rank.losses) : "No ranked solo queue games yet",
        ],
        thumbnail(profileIconUrl(summoner.profileIconId), "Profile icon")
      ),
      separator(),
      textDisplay(`**Best champions**\n${championSummary(preview.topChampions)}`),
      textDisplay(`**Recent form**\n${formDots(preview.recentMatches)}`),
      separator(),
      // The read is the reason to ask this bot instead of a stats site, so it
      // gets a blockquote of its own rather than a line in a list.
      textDisplay(`**Coach's read**\n> ${preview.aiInsight}`),
      ...cardFooter(),
      cardActions(req, profilePath),
    ],
    { accentColor: accent }
  );
}
