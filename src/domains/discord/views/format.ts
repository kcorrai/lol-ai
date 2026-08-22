import type { PreviewMatch, PreviewResponse } from "@/types/preview";
import { POSITION_LABELS, tierLabel } from "@/lib/riot/rankDisplay";

export function riotIdLabel(summoner: PreviewResponse["summoner"]): string {
  return `${summoner.gameName}#${summoner.tagLine}`;
}

/** "Challenger · 1204 LP", or "Unranked" when solo queue has no entry. */
export function rankHeadline(rank: PreviewResponse["rank"]): string {
  if (!rank) return "Unranked";
  const division = rank.division ? ` ${rank.division}` : "";
  return `**${tierLabel(rank.tier)}${division}** · ${rank.lp} LP`;
}

export function winRateLine(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "No ranked games yet";
  return `${wins}W ${losses}L · ${Math.round((wins / total) * 100)}% win rate`;
}

/** Newest game first, the way every scoreboard in the game shows it. */
export function formDots(matches: PreviewMatch[]): string {
  if (matches.length === 0) return "No recent games";
  return matches
    .slice(0, 10)
    .map((m) => (m.win ? "🟢" : "🔴"))
    .join("");
}

export function kdaLine(match: PreviewMatch): string {
  return `${match.kills}/${match.deaths}/${match.assists}`;
}

export function positionLabel(position: string): string {
  return POSITION_LABELS[position] ?? position;
}

/** "`Ahri` 62% · `Azir` 55% · `Sylas` 51%" — a champion pool at a glance. */
export function championSummary(champions: PreviewResponse["topChampions"]): string {
  if (champions.length === 0) return "Not enough games to tell yet";
  return champions
    .slice(0, 3)
    .map((c) => `\`${c.championName}\` ${Math.round(c.winRate)}%`)
    .join(" · ");
}
