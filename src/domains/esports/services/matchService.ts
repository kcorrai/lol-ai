import { z } from "zod";
import {
  cachedResource,
  esportsFetch,
  httpsAsset,
  TTL,
} from "@/domains/esports/services/esportsApi";
import type { MatchDetail } from "@/domains/esports/types";

const CACHE_TYPE = "esports-match";

const GameSchema = z.object({
  number: z.number(),
  id: z.string(),
  state: z.string(),
  teams: z.array(z.object({ id: z.string(), side: z.string() })).nullish(),
  vods: z.array(z.object({ parameter: z.string().nullish() })).nullish(),
});

const EventDetailsSchema = z.object({
  data: z.object({
    event: z.object({
      id: z.string(),
      league: z.object({
        id: z.string().nullish(),
        slug: z.string().nullish(),
        name: z.string(),
        image: z.string().nullish(),
      }),
      tournament: z.object({ id: z.string() }).nullish(),
      match: z.object({
        strategy: z.object({ count: z.number().nullish() }).nullish(),
        teams: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            code: z.string(),
            image: z.string().nullish(),
            result: z.object({ gameWins: z.number().nullish() }).nullish(),
          })
        ),
        games: z.array(GameSchema),
      }),
    }),
  }),
});

function mapMatch(parsed: z.infer<typeof EventDetailsSchema>): MatchDetail {
  const event = parsed.data.event;
  const match = event.match;

  return {
    matchId: event.id,
    bestOf: match.strategy?.count ?? null,
    league: {
      id: event.league.id ?? null,
      slug: event.league.slug ?? null,
      name: event.league.name,
      image: httpsAsset(event.league.image),
    },
    tournamentId: event.tournament?.id ?? null,
    teams: match.teams.map((team) => ({
      id: team.id,
      name: team.name,
      code: team.code,
      image: httpsAsset(team.image),
      gameWins: team.result?.gameWins ?? 0,
    })),
    games: match.games.map((game) => ({
      number: game.number,
      id: game.id,
      state: game.state,
      blueTeamId: game.teams?.find((t) => t.side === "blue")?.id ?? null,
      redTeamId: game.teams?.find((t) => t.side === "red")?.id ?? null,
      hasVod: (game.vods ?? []).length > 0,
    })),
  };
}

/**
 * One series: teams, format, and the games in it.
 *
 * `getEventDetails` carries no kickoff time and no block name — the schedule
 * payload has those — so a match page states what it can prove and leaves the
 * rest to the league context around it.
 *
 * A finished series never changes, but that cannot be known before fetching it,
 * so everything is cached for an hour and the caller re-caches the games it
 * knows are complete for a month (`gameStatsService`).
 */
export async function getMatch(matchId: string): Promise<MatchDetail | null> {
  return cachedResource({
    key: `match:${matchId}`,
    type: CACHE_TYPE,
    ttlDays: TTL.standings,
    schema: EventDetailsSchema,
    fetcher: () => esportsFetch("getEventDetails", { params: { id: matchId } }),
    map: mapMatch,
  });
}

/**
 * The game a match page opens on with no `?g=`.
 *
 * Game 1 by default, because that URL is the canonical one (ADR-017 §2) and a
 * canonical page whose content shifts as a series progresses is a canonical page
 * in name only. The exception is a game being played right now, which is what
 * anyone arriving mid-series came for.
 */
export function defaultGame(match: MatchDetail): MatchDetail["games"][number] | null {
  const playable = match.games.filter((game) => game.state !== "unneeded");
  if (playable.length === 0) return null;

  return playable.find((game) => game.state === "inProgress") ?? playable[0];
}
