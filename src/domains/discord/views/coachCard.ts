import { APP_URL, BRAND_COLOR } from "@/domains/discord/brand";
import { card, cardFooter } from "@/domains/discord/views/shell";
import type { DetectedHabit, PlayerPerformanceProfile } from "@/domains/analysis";
import { actionRow, linkButton, section, separator, textDisplay, thumbnail } from "@/lib/discord/components";
import type { ContainerChild, DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { championIconUrl } from "@/lib/ddragon";

// Three is what fits before the card turns into a list nobody finishes. They
// arrive severity-ordered, so the three that matter most are the three shown.
const MAX_HABITS = 3;

const SEVERITY_DOT: Record<string, string> = {
  high: "🔴",
  medium: "🟠",
  low: "🟡",
};

function habitLines(habits: DetectedHabit[]): ContainerChild {
  if (habits.length === 0) {
    return textDisplay(
      "**No recurring habits detected**\nNothing has shown up often enough to call a pattern. Play a few more ranked games and check back."
    );
  }

  return textDisplay(
    habits
      .slice(0, MAX_HABITS)
      .map(
        (h) =>
          `${SEVERITY_DOT[h.severity] ?? "⚪"} **${h.displayName}** · ${h.weekCount} week${h.weekCount === 1 ? "" : "s"} running\n> ${h.message}`
      )
      .join("\n\n")
  );
}

export function coachCard(params: {
  riotId: string;
  profile: PlayerPerformanceProfile;
  habits: DetectedHabit[];
}): DiscordMessagePayload {
  const { profile } = params;
  const champion = profile.mostPlayedChampions[0];

  const headline = [
    "### 🎯 Where to focus",
    `**${params.riotId}** · ${profile.gamesAnalyzed} games · ${Math.round(profile.winRate)}% win rate`,
    `Strongest: **${profile.strongestArea}** · Weakest: **${profile.weakestArea}**`,
  ];

  return card(
    [
      champion
        ? section(headline, thumbnail(championIconUrl(champion), champion))
        : textDisplay(headline.join("\n")),
      separator(),
      habitLines(params.habits),
      ...cardFooter(),
      actionRow(linkButton("Full improvement plan", `${APP_URL}/improvement`, "🔗")),
    ],
    { accentColor: BRAND_COLOR, ephemeral: true }
  );
}

/** What a free plan sees. An upsell, not an error — nothing has gone wrong. */
export function coachUpsellCard(): DiscordMessagePayload {
  return card(
    [
      textDisplay("### 🎯 Coaching is a Pro feature"),
      textDisplay(
        "`/coach` reads your habit history and tells you what to work on next. Everything else this bot does stays free."
      ),
      actionRow(linkButton("See Pro", `${APP_URL}/settings/billing`, "⭐")),
    ],
    { accentColor: BRAND_COLOR, ephemeral: true }
  );
}
