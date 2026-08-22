import { APP_URL, BRAND_COLOR, FOOTER_LINE } from "@/domains/discord/brand";
import { encodeCustomId, type BotRequest } from "@/domains/discord/request";
import {
  actionRow,
  button,
  componentsV2Message,
  container,
  linkButton,
  separator,
  textDisplay,
} from "@/lib/discord/components";
import type {
  ActionRowComponent,
  ContainerChild,
  DiscordMessagePayload,
} from "@/lib/discord/componentTypes";

/**
 * The strip every card ends with: a link out to the full view on the site, and a
 * Refresh that re-runs the same lookup in place. Refresh is dropped rather than
 * broken when the arguments do not fit in a custom_id.
 */
export function cardActions(req: BotRequest, path: string): ActionRowComponent {
  const open = linkButton("Open on lolaicoach.com", `${APP_URL}${path}`, "🔗");
  const customId = encodeCustomId(req);
  return customId
    ? actionRow(open, button({ label: "Refresh", customId, emoji: "🔄" }))
    : actionRow(open);
}

/** Closes a card with a divider and the shared footer line. */
export function cardFooter(): ContainerChild[] {
  return [separator(), textDisplay(FOOTER_LINE)];
}

export function card(
  children: ContainerChild[],
  opts: { accentColor?: number; ephemeral?: boolean } = {}
): DiscordMessagePayload {
  return componentsV2Message([container(children, opts.accentColor ?? BRAND_COLOR)], {
    ephemeral: opts.ephemeral,
  });
}

/**
 * Failures are ephemeral on purpose: a mistyped Riot ID should not leave a red
 * box sitting in the channel for everyone else.
 */
export function errorCard(title: string, detail: string): DiscordMessagePayload {
  return card([textDisplay(`### ⚠️ ${title}`), textDisplay(detail)], {
    accentColor: 0xe84057,
    ephemeral: true,
  });
}
