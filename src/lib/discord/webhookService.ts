import { logger } from "@/lib/utils/logger";

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  thumbnail?: { url: string };
}

export async function sendDiscordWebhook(webhookUrl: string, embed: DiscordEmbed): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.warn(`[discord] Webhook failed ${res.status}: ${text}`);
    throw new Error(`Discord webhook returned ${res.status}`);
  }
}
