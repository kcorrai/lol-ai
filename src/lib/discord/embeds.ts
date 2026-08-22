import type { DiscordEmbed } from "./webhookService";

const FOOTER = { text: "lolaicoach.com · AI-powered LoL coaching" };

export const TIER_HEX: Record<string, number> = {
  IRON:        0x4a4a5a,
  BRONZE:      0xa05336,
  SILVER:      0xa8b8c8,
  GOLD:        0xc89b3c,
  PLATINUM:    0x3cba8c,
  EMERALD:     0x00be93,
  DIAMOND:     0x576bce,
  MASTER:      0x9e4fc6,
  GRANDMASTER: 0xe84057,
  CHALLENGER:  0xf4c874,
};

const ACHIEVEMENT_TIER_HEX: Record<string, number> = {
  bronze:   0xcd7f32,
  silver:   0xc0c0c0,
  gold:     0xffd700,
  platinum: 0xe5e4e2,
};

export function rankUpEmbed(params: {
  gameName: string;
  tagLine: string;
  prevTier: string;
  prevDivision: string;
  prevLp: number;
  newTier: string;
  newDivision: string;
  newLp: number;
}): DiscordEmbed {
  return {
    title: "🏆 Rank Promotion!",
    description: `**${params.gameName}#${params.tagLine}** reached a new rank!`,
    color: TIER_HEX[params.newTier] ?? 0xffd700,
    fields: [
      { name: "Previous Rank", value: `${params.prevTier} ${params.prevDivision} (${params.prevLp} LP)`, inline: true },
      { name: "New Rank",   value: `${params.newTier} ${params.newDivision} (${params.newLp} LP)`, inline: true },
    ],
    footer: FOOTER,
  };
}

export function achievementEmbed(params: {
  gameName: string;
  achievementName: string;
  achievementDescription: string;
  tier: string;
  iconSlug: string;
}): DiscordEmbed {
  return {
    title: `🎖️ New Achievement: ${params.achievementName}`,
    description: `${params.iconSlug} ${params.achievementDescription}`,
    color: ACHIEVEMENT_TIER_HEX[params.tier] ?? 0xffd700,
    footer: FOOTER,
  };
}

export function weeklyRecapEmbed(params: {
  gameName: string;
  wins: number;
  losses: number;
  lpDelta: number;
  topChampion?: string;
}): DiscordEmbed {
  const total = params.wins + params.losses;
  const wr = total > 0 ? Math.round((params.wins / total) * 100) : 0;
  const lpStr = params.lpDelta >= 0 ? `+${params.lpDelta}` : String(params.lpDelta);

  return {
    title: "📊 Weekly Recap",
    description: `How did **${params.gameName}** play this week?`,
    color: params.lpDelta >= 0 ? 0x3cba8c : 0xe84057,
    fields: [
      { name: "Win Rate", value: `${wr}% (${params.wins}W/${params.losses}L)`, inline: true },
      { name: "LP",            value: lpStr, inline: true },
      ...(params.topChampion ? [{ name: "Top Champion", value: params.topChampion, inline: true }] : []),
    ],
    footer: FOOTER,
  };
}

export function testEmbed(): DiscordEmbed {
  return {
    title: "✅ Test Notification",
    description: "Your LoL AI Coach Discord integration is set up successfully!",
    color: 0x6366f1,
    footer: FOOTER,
  };
}
