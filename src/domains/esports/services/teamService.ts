import { z } from "zod";
import {
  cachedResource,
  esportsFetch,
  httpsAsset,
  TTL,
} from "@/domains/esports/services/esportsApi";
import { getLeagues } from "@/domains/esports/services/leagueService";
import { getUpcoming, getCompleted } from "@/domains/esports/services/scheduleService";
import type {
  EsportsEvent,
  EsportsPlayer,
  EsportsTeam,
  PlayerRole,
  TeamStatus,
} from "@/domains/esports/types";

const CACHE_TYPE = "esports-team";

const ROLES: readonly string[] = ["top", "jungle", "mid", "bottom", "support"];

const PlayerSchema = z.object({
  id: z.string(),
  summonerName: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  image: z.string().nullish(),
  role: z.string().nullish(),
});

const TeamSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  code: z.string(),
  image: z.string().nullish(),
  backgroundImage: z.string().nullish(),
  status: z.string(),
  homeLeague: z.object({ name: z.string(), region: z.string().nullish() }).nullish(),
  players: z.array(PlayerSchema).nullish(),
});

const TeamsResponseSchema = z.object({
  data: z.object({ teams: z.array(TeamSchema) }),
});

function mapPlayer(raw: z.infer<typeof PlayerSchema>): EsportsPlayer {
  const role = (raw.role ?? "").toLowerCase();
  const fullName = [raw.firstName, raw.lastName].filter(Boolean).join(" ");
  return {
    id: raw.id,
    handle: raw.summonerName,
    fullName: fullName.length > 0 ? fullName : null,
    image: httpsAsset(raw.image),
    // The feed also uses "none" for staff and unassigned players; anything we do
    // not recognise becomes null rather than being shown as a lane.
    role: ROLES.includes(role) ? (role as PlayerRole) : null,
  };
}

const ROLE_ORDER: PlayerRole[] = ["top", "jungle", "mid", "bottom", "support"];

function byRole(a: EsportsPlayer, b: EsportsPlayer): number {
  const rankA = a.role ? ROLE_ORDER.indexOf(a.role) : ROLE_ORDER.length;
  const rankB = b.role ? ROLE_ORDER.indexOf(b.role) : ROLE_ORDER.length;
  if (rankA !== rankB) return rankA - rankB;
  return a.handle.localeCompare(b.handle);
}

function mapTeam(raw: z.infer<typeof TeamSchema>): EsportsTeam {
  const players = (raw.players ?? []).map(mapPlayer).sort(byRole);
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name.trim(),
    code: raw.code,
    image: httpsAsset(raw.image),
    backgroundImage: httpsAsset(raw.backgroundImage),
    status: raw.status === "active" ? "active" : ("archived" as TeamStatus),
    league: raw.homeLeague
      ? { name: raw.homeLeague.name, region: raw.homeLeague.region ?? null }
      : null,
    players,
  };
}

/** Every team the feed publishes, active and archived. */
export async function getTeams(): Promise<EsportsTeam[]> {
  const teams = await cachedResource({
    key: "teams",
    type: CACHE_TYPE,
    ttlDays: TTL.static,
    schema: TeamsResponseSchema,
    fetcher: () => esportsFetch("getTeams"),
    map: (parsed) => parsed.data.teams.map(mapTeam),
  });
  return teams ?? [];
}

/**
 * Ranks two entries sharing a slug. The feed reuses slugs — 53 of them today,
 * 17 with more than one active entry — typically an old roster archived under
 * the same name as the current org, or two records for one university team.
 *
 * Active always beats archived: an archived record often carries the *older*
 * roster, and showing a 2019 lineup as "the roster" is worse than showing none.
 * After that, the entry with players is the useful one.
 */
function teamRank(team: EsportsTeam): [number, number, number] {
  return [team.status === "active" ? 0 : 1, -team.players.length, team.league ? 0 : 1];
}

export function resolveTeamBySlug(teams: EsportsTeam[], slug: string): EsportsTeam | null {
  const needle = slug.toLowerCase();
  const matches = teams.filter((team) => team.slug.toLowerCase() === needle);
  if (matches.length === 0) return null;

  return [...matches].sort((a, b) => {
    const rankA = teamRank(a);
    const rankB = teamRank(b);
    for (let i = 0; i < rankA.length; i += 1) {
      if (rankA[i] !== rankB[i]) return rankA[i] - rankB[i];
    }
    // Stable last resort so the same slug always resolves to the same team.
    return a.id.localeCompare(b.id);
  })[0];
}

/** One team by slug, or null when the slug is unknown. */
export async function getTeam(slug: string): Promise<EsportsTeam | null> {
  return resolveTeamBySlug(await getTeams(), slug);
}

/**
 * Teams worth publishing an index of: active, in a league, with a roster.
 *
 * Of 1175 active teams, 405 have no roster at all and 485 no league — pages for
 * those would be the thin auto-generated filler ADR-017 §4 exists to prevent.
 */
export function indexableTeams(teams: EsportsTeam[]): EsportsTeam[] {
  const seen = new Set<string>();
  return teams
    .filter((team) => team.status === "active" && team.league !== null && team.players.length > 0)
    .filter((team) => {
      // A slug can only appear once in the index; keep whichever entry wins.
      if (seen.has(team.slug)) return false;
      seen.add(team.slug);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Team slugs by feed id, for pages that carry ids but need URLs.
 *
 * `getEventDetails` gives a match its teams as id/name/code with no slug, so a
 * match page cannot link to the two teams it is about without this — and those
 * are the most natural links on the page.
 */
export async function teamSlugsById(ids: string[]): Promise<Map<string, string>> {
  const wanted = new Set(ids);
  const slugs = new Map<string, string>();
  for (const team of await getTeams()) {
    if (wanted.has(team.id)) slugs.set(team.id, team.slug);
  }
  return slugs;
}

/** True when a team page would have nothing on it worth indexing. */
export function isThinTeam(team: EsportsTeam, matches: EsportsEvent[]): boolean {
  return team.players.length === 0 && matches.length === 0;
}

interface TeamMatches {
  upcoming: EsportsEvent[];
  results: EsportsEvent[];
}

/**
 * A team's fixtures and results.
 *
 * The schedule payload identifies teams by name and code only — no ids — so
 * matches are found by scoping the schedule to the team's own league and then
 * matching on code. Scoping first is what makes matching on a three-letter code
 * safe.
 */
export async function getTeamMatches(team: EsportsTeam): Promise<TeamMatches> {
  if (!team.league) return { upcoming: [], results: [] };

  const leagues = await getLeagues();
  const league = leagues.find((l) => l.name.toLowerCase() === team.league?.name.toLowerCase());
  if (!league) return { upcoming: [], results: [] };

  const [upcoming, completed] = await Promise.all([
    getUpcoming({ leagueId: league.id, limit: 60 }),
    getCompleted({ leagueId: league.id, limit: 60 }),
  ]);

  const isTeam = (event: EsportsEvent): boolean =>
    event.teams.some(
      (t) =>
        t.code.toLowerCase() === team.code.toLowerCase() ||
        t.name.toLowerCase() === team.name.toLowerCase()
    );

  return {
    upcoming: upcoming.filter(isTeam).slice(0, 5),
    results: completed.filter(isTeam).slice(0, 10),
  };
}

/** W/L over a team's most recent series, most recent first. */
export function recentForm(team: EsportsTeam, results: EsportsEvent[]): ("W" | "L")[] {
  const form: ("W" | "L")[] = [];
  for (const event of results) {
    const side = event.teams.find(
      (t) =>
        t.code.toLowerCase() === team.code.toLowerCase() ||
        t.name.toLowerCase() === team.name.toLowerCase()
    );
    if (side?.outcome === "win") form.push("W");
    else if (side?.outcome === "loss") form.push("L");
  }
  return form;
}
