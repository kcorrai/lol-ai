import type { PreviewChampion, PreviewMatch } from "@/types/preview";

/**
 * Deterministic, zero-cost coaching blurb derived from the player's recent games.
 *
 * The full AI coaching report is a signed-in feature; the public preview stays free, so this has
 * to say something true and specific without costing a token. Split out of `previewService.ts`
 * only to keep that file inside the service size cap (CLAUDE.md §3.3) — the wording is unchanged.
 */
export function buildRuleBasedInsight(
  gameName: string,
  ranked: { tier: string; rank: string; wins: number; losses: number } | null,
  matches: PreviewMatch[],
  topChamps: PreviewChampion[]
): string {
  if (matches.length === 0) {
    return `We couldn't find recent ranked games for ${gameName}. Play a few ranked matches and check back to see where you can improve.`;
  }

  const wins = matches.filter((m) => m.win).length;
  const wr = Math.round((wins / matches.length) * 100);
  const avgDeaths = matches.reduce((s, m) => s + m.deaths, 0) / matches.length;
  const avgKda =
    matches.reduce((s, m) => s + (m.kills + m.assists) / Math.max(1, m.deaths), 0) / matches.length;
  const topChamp = topChamps[0];

  // Sentence 1 — recent form.
  let form: string;
  if (wr >= 60) {
    form = `You're on a strong run — ${wins}/${matches.length} wins in your last games${ranked ? ` at ${ranked.tier} ${ranked.rank}` : ""}.`;
  } else if (wr <= 40) {
    form = `You're in a rough patch — ${wins}/${matches.length} wins recently${ranked ? ` at ${ranked.tier} ${ranked.rank}` : ""}. Time to tighten up the fundamentals.`;
  } else {
    form = `Your recent form is steady at ${wr}% over your last ${matches.length} games${ranked ? ` (${ranked.tier} ${ranked.rank})` : ""}.`;
  }

  // Sentence 2 — the biggest lever.
  let lever: string;
  if (avgDeaths > 7) {
    lever = `You're averaging ${avgDeaths.toFixed(1)} deaths a game — cutting risky plays and warding more would swing your win rate the fastest.`;
  } else if (avgKda >= 3.5) {
    lever = `Your ${avgKda.toFixed(1)} average KDA is strong; converting that into objectives and closing games faster is your next step.`;
  } else if (topChamp && topChamp.games >= Math.ceil(matches.length * 0.5)) {
    lever = `You're leaning on ${topChamp.championName} (${topChamp.winRate}% win rate) — a focused 2-3 champion pool like this is exactly how you climb.`;
  } else {
    lever = `Tightening your champion pool and playing to your win conditions each game is the quickest path up.`;
  }

  return `${form} ${lever}`;
}
