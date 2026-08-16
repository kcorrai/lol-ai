import { roleLabel } from "@/domains/esports/roles";
import type { EsportsTeam, MatchDetail, PlayerEntry } from "@/domains/esports/types";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
const SPORT = "League of Legends";

export type JsonLd = Record<string, unknown>;

export interface ListEntry {
  name: string;
  /** Site-relative path. Omitted for rows that have no page of their own. */
  href?: string;
}

/**
 * What a page is, stated in the page's own vocabulary rather than schema.org's.
 *
 * Pages describe themselves with the data they already loaded; the mapping to
 * `SportsEvent` / `SportsTeam` / `Person` / `ItemList` (ADR-017 §6) lives here
 * alone, so the markup for a page type is written once and cannot drift between
 * two pages of the same type.
 */
export type EsportsSchema =
  | { kind: "match"; match: MatchDetail; startTime: string | null }
  | { kind: "team"; team: EsportsTeam; roster: PlayerEntry[] }
  | { kind: "player"; entry: PlayerEntry }
  | { kind: "list"; name: string; items: ListEntry[] };

function teamRef(name: string, code: string | null, image: string | null, slug?: string): JsonLd {
  return {
    "@type": "SportsTeam",
    name,
    sport: SPORT,
    ...(code ? { alternateName: code } : {}),
    ...(image ? { logo: image } : {}),
    ...(slug ? { url: `${BASE_URL}/esports/teams/${slug}` } : {}),
  };
}

function matchSchema(match: MatchDetail, startTime: string | null): JsonLd {
  const [home, away] = match.teams;
  const url = `${BASE_URL}/esports/matches/${match.matchId}`;

  return {
    "@type": "SportsEvent",
    name: `${home?.name ?? "TBD"} vs ${away?.name ?? "TBD"} — ${match.league.name}`,
    url,
    sport: SPORT,
    // `getEventDetails` carries no kickoff time; the schedule does, and resolves
    // it while the match is still inside the feed's window. Older series keep
    // valid markup without it rather than carrying an invented date.
    ...(startTime ? { startDate: startTime } : {}),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url },
    competitor: match.teams.map((team) => teamRef(team.name, team.code, team.image)),
    ...(match.league.slug
      ? {
          superEvent: {
            "@type": "SportsEvent",
            name: match.league.name,
            url: `${BASE_URL}/esports/leagues/${match.league.slug}`,
          },
        }
      : {}),
  };
}

function teamSchema(team: EsportsTeam, roster: PlayerEntry[]): JsonLd {
  return {
    ...teamRef(team.name, team.code, team.image, team.slug),
    ...(team.league ? { memberOf: { "@type": "SportsOrganization", name: team.league.name } } : {}),
    ...(roster.length > 0
      ? {
          member: roster.map((entry) => ({
            "@type": "Person",
            name: entry.player.handle,
            url: `${BASE_URL}/esports/players/${entry.slug}`,
          })),
        }
      : {}),
  };
}

function playerSchema(entry: PlayerEntry): JsonLd {
  const { player, team } = entry;
  const job = roleLabel(player.role);

  return {
    "@type": "Person",
    name: player.handle,
    url: `${BASE_URL}/esports/players/${entry.slug}`,
    ...(player.fullName ? { alternateName: player.fullName } : {}),
    ...(player.image ? { image: player.image } : {}),
    ...(job ? { jobTitle: job } : {}),
    memberOf: teamRef(team.name, team.code, team.image, team.slug),
  };
}

function listSchema(name: string, items: ListEntry[]): JsonLd {
  return {
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { url: `${BASE_URL}${item.href}` } : {}),
    })),
  };
}

/** The schema.org object for a page, or null when the page has nothing to describe. */
export function buildJsonLd(schema: EsportsSchema): JsonLd | null {
  switch (schema.kind) {
    case "match":
      return { "@context": "https://schema.org", ...matchSchema(schema.match, schema.startTime) };
    case "team":
      return { "@context": "https://schema.org", ...teamSchema(schema.team, schema.roster) };
    case "player":
      return { "@context": "https://schema.org", ...playerSchema(schema.entry) };
    case "list":
      // An empty table describes nothing, and markup claiming otherwise is
      // worse than none (ADR-017 §4).
      return schema.items.length > 0
        ? { "@context": "https://schema.org", ...listSchema(schema.name, schema.items) }
        : null;
  }
}
