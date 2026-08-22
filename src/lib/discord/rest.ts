import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { logger } from "@/lib/utils/logger";

export const DISCORD_API_BASE = "https://discord.com/api/v10";

// Interaction tokens are valid for 15 minutes and authenticate the request by
// themselves — these calls carry no bot token, which is why the worker can
// answer without ever holding one.
function webhookBase(applicationId: string, token: string): string {
  return `${DISCORD_API_BASE}/webhooks/${applicationId}/${token}`;
}

async function send(
  url: string,
  method: "POST" | "PATCH",
  payload: DiscordMessagePayload
): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.warn(`[discord] ${method} interaction response failed ${res.status}: ${text}`);
    throw new Error(`Discord interaction response returned ${res.status}`);
  }
}

/**
 * Replaces the "thinking…" placeholder Discord shows after a deferred ACK.
 * This is how every command answer actually reaches the channel.
 */
export async function editOriginalResponse(
  applicationId: string,
  token: string,
  payload: DiscordMessagePayload
): Promise<void> {
  await send(`${webhookBase(applicationId, token)}/messages/@original`, "PATCH", payload);
}

/** Sends an additional message on the same interaction. */
export async function followUp(
  applicationId: string,
  token: string,
  payload: DiscordMessagePayload
): Promise<void> {
  await send(webhookBase(applicationId, token), "POST", payload);
}
