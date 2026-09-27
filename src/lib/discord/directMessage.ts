import { DISCORD_API_BASE } from "@/lib/discord/rest";
import { logger } from "@/lib/utils/logger";

/**
 * Send a plain direct message from the bot to one Discord user.
 *
 * Two calls, because Discord has no "message this user" endpoint: open (or get)
 * the DM channel, then post into it. The user must share a server with the bot
 * or have installed the app; if they do not, Discord refuses and we say so in
 * the log rather than to a caller. Never throws — a missed DM is a nuisance,
 * never a reason for the thing that triggered it to fail.
 */
export async function sendDirectMessage(
  discordUserId: string,
  content: string,
  botToken: string
): Promise<boolean> {
  const headers = { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" };
  try {
    const opened = await fetch(`${DISCORD_API_BASE}/users/@me/channels`, {
      method: "POST",
      headers,
      body: JSON.stringify({ recipient_id: discordUserId }),
    });
    if (!opened.ok) {
      logger.warn(`[discord] could not open a DM channel: ${opened.status}`);
      return false;
    }
    const channel = (await opened.json()) as { id?: string };
    if (!channel.id) return false;

    const sent = await fetch(`${DISCORD_API_BASE}/channels/${channel.id}/messages`, {
      method: "POST",
      headers,
      // No pings: a DM already notifies, and mentions in bot text are an injection surface.
      body: JSON.stringify({ content: content.slice(0, 2000), allowed_mentions: { parse: [] } }),
    });
    if (!sent.ok) logger.warn(`[discord] DM was refused: ${sent.status}`);
    return sent.ok;
  } catch (error) {
    logger.warn("[discord] DM failed", { error });
    return false;
  }
}
