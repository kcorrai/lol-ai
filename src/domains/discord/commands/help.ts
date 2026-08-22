import { APP_URL } from "@/domains/discord/brand";
import { card, cardFooter } from "@/domains/discord/views/shell";
import { actionRow, linkButton, separator, textDisplay } from "@/lib/discord/components";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";

const LOOKUPS = [
  "`/rank` — current rank, LP and recent form",
  "`/profile` — rank, top champions and a coaching read in one card",
  "`/champions` — most-played champions with win rates",
  "`/match` — a breakdown of the last game",
  "`/live` — who is in the game right now, by lane",
];

const ACCOUNT = [
  "`/lolai link` — connect your Discord to your LoL AI Coach account",
  "`/lolai status` — show what is currently linked",
  "`/lolai unlink` — disconnect it again",
  "`/coach` — your active habits and where to focus next",
];

export function helpCommand(): DiscordMessagePayload {
  return card(
    [
      textDisplay("## LoL AI Coach"),
      textDisplay(
        "Look up any Riot ID — no account needed. Link yours and the `riot-id` argument becomes optional."
      ),
      separator(),
      textDisplay(`**Lookups**\n${LOOKUPS.join("\n")}`),
      textDisplay(`**Your account**\n${ACCOUNT.join("\n")}`),
      ...cardFooter(),
      actionRow(linkButton("Open lolaicoach.com", APP_URL, "🔗")),
    ],
    { ephemeral: true }
  );
}
