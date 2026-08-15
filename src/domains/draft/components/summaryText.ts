import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta/positions";
import type { DraftTeam } from "@/domains/meta";
import type { DraftGameState, DraftSeriesState } from "@/domains/draft";

/** Comps in lane order, the encoding `/tools/draft-analyzer` already reads. */
export function encodeTeam(team: DraftTeam): string {
  return ALL_POSITIONS.map((lane) => team[lane] ?? "").join(",");
}

export function analyzerUrl(blue: DraftTeam, red: DraftTeam): string {
  const params = new URLSearchParams({ blue: encodeTeam(blue), red: encodeTeam(red) });
  return `/tools/draft-analyzer?${params.toString()}`;
}

function bansFor(game: DraftGameState, side: "BLUE" | "RED"): string {
  const bans = game.actions
    .filter((a) => a.kind === "BAN" && a.side === side)
    .map((a) => a.championKey ?? "—");
  return bans.length > 0 ? bans.join(", ") : "none";
}

function compLine(team: DraftTeam): string {
  return ALL_POSITIONS.filter((lane) => team[lane])
    .map((lane) => `${POSITION_LABELS[lane]} ${team[lane]}`)
    .join(" · ");
}

/**
 * The draft as plain text, for the Discord message someone always sends after a
 * scrim. A screenshot is not searchable and not quotable; this is both.
 */
export function buildSummaryText(
  state: DraftSeriesState,
  game: DraftGameState,
  blue: DraftTeam,
  red: DraftTeam,
  verdict: string | null,
  spectatorUrl: string
): string {
  const blueName = game.blueTeam === 1 ? state.team1Name : state.team2Name;
  const redName = game.blueTeam === 1 ? state.team2Name : state.team1Name;

  const lines = [
    `${blueName} (blue) vs ${redName} (red) — game ${game.gameNumber}`,
    "",
    `${blueName}: ${compLine(blue) || "no picks"}`,
    `  bans: ${bansFor(game, "BLUE")}`,
    `${redName}: ${compLine(red) || "no picks"}`,
    `  bans: ${bansFor(game, "RED")}`,
  ];

  if (verdict) lines.push("", verdict);
  lines.push("", spectatorUrl);
  return lines.join("\n");
}
