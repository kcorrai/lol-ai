import type { EsportsEvent, EsportsTeam } from "@/domains/esports/types";

export interface PlayingTeam {
  team: EsportsTeam;
  /** Kickoff of the earliest match that put this team on the list, ISO 8601. */
  startTime: string;
  /** That match is already under way. */
  live: boolean;
}

interface Options {
  /** How far ahead to look, in hours. */
  withinHours: number;
  now: Date;
  limit: number;
}

/**
 * Resolves a team named on a fixture back to the team index.
 *
 * `getSchedule` publishes teams as name/code/image only, so an id is not always
 * there to match on. Codes are the fallback — but they are not unique across
 * regions, and a code claimed by two teams is dropped rather than guessed at: a
 * strip that says the wrong team is playing tonight is worse than one that is a
 * card shorter.
 */
function buildIndex(teams: EsportsTeam[]): {
  byId: Map<string, EsportsTeam>;
  byCode: Map<string, EsportsTeam | null>;
} {
  const byId = new Map<string, EsportsTeam>();
  const byCode = new Map<string, EsportsTeam | null>();

  for (const team of teams) {
    byId.set(team.id, team);
    if (!team.code) continue;
    const key = team.code.toUpperCase();
    byCode.set(key, byCode.has(key) ? null : team);
  }

  return { byId, byCode };
}

/**
 * The teams with a match under way or starting soon, earliest first.
 *
 * Deduplicated by team rather than by match: a team playing twice in the window
 * is one entry carrying its earlier kickoff, because the strip answers "who is
 * on" and not "what is on".
 */
export function teamsPlayingSoon(
  teams: EsportsTeam[],
  events: EsportsEvent[],
  { withinHours, now, limit }: Options
): PlayingTeam[] {
  const { byId, byCode } = buildIndex(teams);
  const horizon = now.getTime() + withinHours * 60 * 60 * 1000;
  const found = new Map<string, PlayingTeam>();

  const ordered = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));

  for (const event of ordered) {
    const at = new Date(event.startTime).getTime();
    if (Number.isNaN(at) || at > horizon) continue;
    const live = event.state === "inProgress";
    if (!live && at < now.getTime()) continue;

    for (const side of event.teams) {
      const team = (side.id ? byId.get(side.id) : undefined) ?? byCode.get(side.code.toUpperCase());
      if (!team) continue;

      const existing = found.get(team.id);
      // A live match outranks a later kickoff even though it started earlier.
      if (existing && !(live && !existing.live)) continue;
      found.set(team.id, { team, startTime: event.startTime, live });
    }
  }

  return [...found.values()]
    .sort((a, b) => Number(b.live) - Number(a.live) || a.startTime.localeCompare(b.startTime))
    .slice(0, limit);
}
