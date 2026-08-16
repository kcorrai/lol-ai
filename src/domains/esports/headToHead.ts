import type { EsportsEvent, EsportsEventTeam } from "@/domains/esports/types";

/**
 * What happened the last times these two met.
 *
 * Derived rather than fetched: the feed has no head-to-head endpoint, so this
 * reads the completed schedule windows the section already caches. That bounds
 * what it can honestly claim — it is "recent meetings in this league", not an
 * all-time record, and the component says so.
 */

export interface TeamKey {
  name: string;
  code: string;
}

export interface HeadToHeadMeeting {
  matchId: string;
  startTime: string;
  blockName: string | null;
  bestOf: number | null;
  /** Series score, first team first. */
  score: { a: number; b: number };
  /** Null for a draw, or a series the feed recorded no outcome for. */
  winner: "a" | "b" | null;
}

export interface HeadToHeadRecord {
  /** Most recent first. */
  meetings: HeadToHeadMeeting[];
  seriesWins: { a: number; b: number };
  /** Individual games won across those series — a 2-1 and a 2-0 is 4-1 on games. */
  gameWins: { a: number; b: number };
}

/**
 * The schedule payload identifies teams by name and code only — no id — so
 * matching is on those. Code first because it is the shorter, stabler handle;
 * name as a fallback because a handful of tier-two teams share a code.
 */
function isTeam(entry: EsportsEventTeam, team: TeamKey): boolean {
  return (
    entry.code.toLowerCase() === team.code.toLowerCase() ||
    entry.name.toLowerCase() === team.name.toLowerCase()
  );
}

function meeting(
  event: EsportsEvent,
  a: EsportsEventTeam,
  b: EsportsEventTeam
): HeadToHeadMeeting {
  const winner = a.outcome === "win" ? "a" : b.outcome === "win" ? "b" : null;

  return {
    matchId: event.matchId,
    startTime: event.startTime,
    blockName: event.blockName,
    bestOf: event.bestOf,
    score: { a: a.gameWins, b: b.gameWins },
    winner,
  };
}

/**
 * Every completed meeting between two teams in a window of events.
 *
 * Excludes the match being read about, when one is given — a match page showing
 * "these two have met once, here" with a link back to itself is noise, and the
 * scoreline is already at the top of the page.
 */
export function headToHead(
  events: EsportsEvent[],
  a: TeamKey,
  b: TeamKey,
  { excludeMatchId }: { excludeMatchId?: string } = {}
): HeadToHeadRecord {
  const record: HeadToHeadRecord = {
    meetings: [],
    seriesWins: { a: 0, b: 0 },
    gameWins: { a: 0, b: 0 },
  };

  for (const event of events) {
    if (event.state !== "completed") continue;
    if (excludeMatchId && event.matchId === excludeMatchId) continue;

    const sideA = event.teams.find((team) => isTeam(team, a));
    const sideB = event.teams.find((team) => isTeam(team, b));
    // Both, and not the same entry twice — a team that shares a code with its
    // own academy squad would otherwise match itself on both sides.
    if (!sideA || !sideB || sideA === sideB) continue;

    const entry = meeting(event, sideA, sideB);
    record.meetings.push(entry);

    if (entry.winner === "a") record.seriesWins.a += 1;
    if (entry.winner === "b") record.seriesWins.b += 1;
    record.gameWins.a += entry.score.a;
    record.gameWins.b += entry.score.b;
  }

  record.meetings.sort((first, second) => second.startTime.localeCompare(first.startTime));
  return record;
}
