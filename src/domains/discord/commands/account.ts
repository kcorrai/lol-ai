import { APP_URL, BRAND_COLOR } from "@/domains/discord/brand";
import { getLinkedIdentity, unlinkDiscordAccount } from "@/domains/discord/linkService";
import { createLinkToken } from "@/domains/discord/linkToken";
import type { BotRequest } from "@/domains/discord/request";
import { card, errorCard } from "@/domains/discord/views/shell";
import { actionRow, linkButton, separator, textDisplay } from "@/lib/discord/components";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";

function accountLine(riotAccount: { gameName: string; tagLine: string; region: string } | null): string {
  return riotAccount
    ? `**${riotAccount.gameName}#${riotAccount.tagLine}** · ${riotAccount.region.toUpperCase()}`
    : "_No Riot account connected yet._";
}

export async function linkCommand(req: BotRequest): Promise<DiscordMessagePayload> {
  const existing = await getLinkedIdentity(req.discordUserId);
  if (existing) return statusCommand(req);

  const token = createLinkToken({
    discordUserId: req.discordUserId,
    discordUsername: req.discordUsername,
  });
  const url = `${APP_URL}/settings/discord/link?token=${token}`;

  // Ephemeral without exception: the token is a bearer credential for this
  // Discord account, and posting it into a channel would hand it to everyone.
  return card(
    [
      textDisplay("### Link your account"),
      textDisplay(
        `Open the link below and confirm as **${req.discordUsername}**. You will need to be signed in to lolaicoach.com.`
      ),
      separator(),
      textDisplay("-# The link is good for 10 minutes and only works for you."),
      actionRow(linkButton("Link my account", url, "🔗")),
    ],
    { accentColor: BRAND_COLOR, ephemeral: true }
  );
}

export async function statusCommand(req: BotRequest): Promise<DiscordMessagePayload> {
  const identity = await getLinkedIdentity(req.discordUserId);
  if (!identity) {
    return errorCard("Not linked", "Run `/lolai link` to connect your LoL AI Coach account.");
  }

  return card(
    [
      textDisplay("### ✅ Linked"),
      textDisplay(
        `Commands with no \`riot-id\` answer for:\n${accountLine(identity.riotAccount)}`
      ),
      separator(),
      textDisplay("-# `/lolai unlink` disconnects it again."),
      actionRow(linkButton("Open dashboard", `${APP_URL}/dashboard`, "🔗")),
    ],
    { accentColor: BRAND_COLOR, ephemeral: true }
  );
}

export async function unlinkCommand(req: BotRequest): Promise<DiscordMessagePayload> {
  const removed = await unlinkDiscordAccount(req.discordUserId);
  if (!removed) {
    return errorCard("Nothing to unlink", "This Discord account is not linked to anything.");
  }

  return card(
    [
      textDisplay("### Unlinked"),
      textDisplay(
        "Commands will need a `riot-id` again. Any channel notifications you set up on the website are untouched."
      ),
    ],
    { accentColor: BRAND_COLOR, ephemeral: true }
  );
}
