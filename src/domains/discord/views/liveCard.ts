import { BRAND_COLOR } from "@/domains/discord/brand";
import type { BotRequest } from "@/domains/discord/request";
import { duration } from "@/domains/discord/views/format";
import { card, cardActions, cardFooter } from "@/domains/discord/views/shell";
import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta";
import type { LiveDraft } from "@/domains/riot";
import { section, separator, textDisplay, thumbnail } from "@/lib/discord/components";
import type { ContainerChild, DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { championIconUrl } from "@/lib/ddragon";
import { gameModeLabel } from "@/lib/riot/gameModes";

const EMPTY_LANE = "—";
// Wide enough for the longest lane label ("Support", 7) and the longest champion
// key ("Fiddlesticks", 12) to still be followed by a gap. Without the slack the
// board runs words together — "SupportThresh".
const LANE_WIDTH = 9;
const CHAMPION_WIDTH = 15;

/**
 * The draft as a fixed-width board.
 *
 * Discord has no columns, so the only way to get five lanes to line up against
 * their opponents is a code fence — which also renders in a monospace face that
 * makes it read like a loading screen rather than a paragraph.
 */
function draftBoard(draft: LiveDraft["draft"]): string {
  const rows = ALL_POSITIONS.map((position) => {
    const blue = draft.blue[position] ?? EMPTY_LANE;
    const red = draft.red[position] ?? EMPTY_LANE;
    return `${POSITION_LABELS[position].padEnd(LANE_WIDTH)}${blue.padEnd(CHAMPION_WIDTH)}${red}`;
  });

  return [
    "```",
    `${"".padEnd(LANE_WIDTH)}${"BLUE".padEnd(CHAMPION_WIDTH)}RED`,
    ...rows,
    "```",
  ].join("\n");
}

/** Their own champion when the lane is known, otherwise anyone on their side. */
function heroChampion(live: LiveDraft): string | undefined {
  if (live.yourMatchup) return live.yourMatchup.champion;
  const side = live.draft[live.yourSide];
  return ALL_POSITIONS.map((p) => side[p]).find(Boolean);
}

export function liveCard(
  live: LiveDraft,
  riotId: string,
  req: BotRequest,
  profilePath: string
): DiscordMessagePayload {
  const matchup = live.yourMatchup;
  const side = live.yourSide === "blue" ? "🔵 Blue" : "🔴 Red";
  const hero = heroChampion(live);

  const headlines = [
    `### 🔴 In game · ${duration(live.gameLength)}`,
    `**${riotId}** · ${side} side · ${gameModeLabel(live.gameMode)}`,
    matchup
      ? `Playing **${matchup.champion}** into **${matchup.opponent}**`
      : "Lane could not be worked out from the draft",
  ];

  // A section must carry an accessory, so with no champion to show it degrades
  // to plain text rather than to a broken thumbnail.
  const header: ContainerChild = hero
    ? section(headlines, thumbnail(championIconUrl(hero), hero))
    : textDisplay(headlines.join("\n"));

  return card(
    [
      header,
      separator(),
      textDisplay(draftBoard(live.draft)),
      // Lanes come from champion pick-rate history, not from Riot — the
      // Spectator API does not report them. Saying so is cheaper than being
      // quietly wrong about a jungler who went mid.
      textDisplay("-# Lanes are inferred from pick rates and can be wrong."),
      ...cardFooter(),
      cardActions(req, profilePath),
    ],
    { accentColor: BRAND_COLOR }
  );
}
