import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

export interface MatchInsight {
  text: string;
  sentiment: "positive" | "neutral" | "negative";
}

const NON_CS_POSITIONS = new Set(["UTILITY", "JUNGLE"]);

export function deriveMatchInsights(match: MatchPerformance): MatchInsight[] {
  const { kills, deaths, assists, csPerMinute, visionScore, won, position } = match;
  const insights: MatchInsight[] = [];

  // Deaths — highest priority signal
  if (deaths >= 7) {
    insights.push({
      text: `${deaths} deaths — identify the 2-3 fights you could have avoided instead of taking bad trades.`,
      sentiment: "negative",
    });
  } else if (deaths === 0) {
    insights.push({
      text: `Zero deaths — excellent positioning and decision-making this game.`,
      sentiment: "positive",
    });
  } else if (deaths >= 5) {
    insights.push({
      text: `${deaths} deaths — review the moments you died and ask if the trade was worth it.`,
      sentiment: "negative",
    });
  }

  // Vision
  if (visionScore < 10 && !NON_CS_POSITIONS.has(position)) {
    insights.push({
      text: `Vision score ${visionScore} — ward before dragon/baron and on your lane's river brushes.`,
      sentiment: "negative",
    });
  } else if (visionScore >= 35) {
    insights.push({
      text: `Vision score ${visionScore} — outstanding map control, keep this up.`,
      sentiment: "positive",
    });
  }

  // CS for laners
  if (!NON_CS_POSITIONS.has(position)) {
    if (csPerMinute < 5) {
      insights.push({
        text: `${csPerMinute} CS/min — focus on clearing waves before looking for fights.`,
        sentiment: "negative",
      });
    } else if (csPerMinute >= 8) {
      insights.push({
        text: `${csPerMinute} CS/min — strong farming consistency.`,
        sentiment: "positive",
      });
    }
  }

  // Win/loss context
  if (!won && kills >= 5) {
    insights.push({
      text: `${kills}/${deaths}/${assists} but still lost — the game was decided on objectives. Individual performance alone doesn't win games.`,
      sentiment: "neutral",
    });
  } else if (won && deaths >= 5) {
    insights.push({
      text: `Won despite ${deaths} deaths — your team carried the weight. Work on surviving longer.`,
      sentiment: "neutral",
    });
  }

  // Damage share context
  if (won && match.damageShare >= 0.35) {
    insights.push({
      text: `${Math.round(match.damageShare * 100)}% team damage share — you were the damage engine this game.`,
      sentiment: "positive",
    });
  }

  return insights.slice(0, 3);
}
