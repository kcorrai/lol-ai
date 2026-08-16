import { z } from "zod";
import {
  cachedResource,
  esportsFetch,
  httpsAsset,
  TTL,
} from "@/domains/esports/services/esportsApi";
import type {
  StandingsStage,
  StandingsRow,
  BracketMatch,
  EsportsTeamRef,
} from "@/domains/esports/types";

const CACHE_TYPE = "esports-standings";

// The feed uses id "0" / slug "tbd" for a bracket slot whose team is not decided.
const TBD_TEAM_ID = "0";

const TeamRefSchema = z.object({
  id: z.string(),
  slug: z.string().nullish(),
  name: z.string(),
  code: z.string(),
  image: z.string().nullish(),
});

const RankingSchema = z.object({
  ordinal: z.number(),
  teams: z.array(
    TeamRefSchema.extend({ record: z.object({ wins: z.number(), losses: z.number() }) })
  ),
});

const BracketMatchSchema = z.object({
  id: z.string(),
  state: z.string(),
  previousMatchIds: z.array(z.string()).nullish(),
  teams: z.array(
    TeamRefSchema.extend({
      result: z.object({ outcome: z.string().nullish(), gameWins: z.number().nullish() }).nullish(),
    })
  ),
});

const SectionSchema = z.object({
  name: z.string(),
  rankings: z.array(RankingSchema).nullish(),
  matches: z.array(BracketMatchSchema).nullish(),
});

const StageSchema = z.object({
  name: z.string(),
  slug: z.string().nullish(),
  sections: z.array(SectionSchema),
});

const StandingsResponseSchema = z.object({
  data: z.object({
    standings: z.array(z.object({ stages: z.array(StageSchema) })),
  }),
});

function mapTeamRef(raw: z.infer<typeof TeamRefSchema>): EsportsTeamRef {
  return {
    id: raw.id,
    slug: raw.slug ?? null,
    name: raw.name,
    code: raw.code,
    image: httpsAsset(raw.image),
  };
}

/**
 * Flattens the feed's ordinal groups into rows.
 *
 * Teams sharing an ordinal are tied, and the feed expresses that by putting
 * them in the same group rather than by repeating a rank — so the tie has to be
 * read off the group size, not inferred from equal records.
 */
function mapRankings(rankings: z.infer<typeof RankingSchema>[]): StandingsRow[] {
  const rows: StandingsRow[] = [];

  for (const group of rankings) {
    const tied = group.teams.length > 1;
    for (const team of group.teams) {
      const played = team.record.wins + team.record.losses;
      rows.push({
        rank: group.ordinal,
        tied,
        team: mapTeamRef(team),
        wins: team.record.wins,
        losses: team.record.losses,
        // Undefined rather than 0 for a team that has not played: a 0% win rate
        // and no games yet are different things and must not read the same.
        winRate: played > 0 ? Math.round((team.record.wins / played) * 1000) / 10 : null,
      });
    }
  }

  return rows.sort((a, b) => a.rank - b.rank);
}

function mapBracketMatches(matches: z.infer<typeof BracketMatchSchema>[]): BracketMatch[] {
  return matches.map((match) => ({
    matchId: match.id,
    state: match.state,
    previousMatchIds: match.previousMatchIds ?? [],
    teams: match.teams.map((team) => ({
      ...mapTeamRef(team),
      decided: team.id !== TBD_TEAM_ID,
      gameWins: team.result?.gameWins ?? 0,
      outcome:
        team.result?.outcome === "win" || team.result?.outcome === "loss"
          ? team.result.outcome
          : null,
    })),
  }));
}

function mapStandings(parsed: z.infer<typeof StandingsResponseSchema>): StandingsStage[] {
  const stages: StandingsStage[] = [];

  for (const standing of parsed.data.standings) {
    for (const stage of standing.stages) {
      for (const section of stage.sections) {
        const rankings = section.rankings ?? [];
        const matches = section.matches ?? [];

        // A section is a table when the feed ranks it, and a bracket otherwise.
        // Round-robin splits carry rankings; swiss and knockout stages (Worlds,
        // MSI) carry only matches, and forcing a table out of those would mean
        // computing standings the organiser never published.
        if (rankings.length > 0) {
          stages.push({
            kind: "table",
            stageName: stage.name,
            sectionName: section.name,
            rows: mapRankings(rankings),
          });
        } else if (matches.length > 0) {
          stages.push({
            kind: "bracket",
            stageName: stage.name,
            sectionName: section.name,
            matches: mapBracketMatches(matches),
          });
        }
        // A section with neither is skipped rather than rendered empty.
      }
    }
  }

  return stages;
}

/**
 * Every stage of a tournament, normalised into tables and brackets. Returns an
 * empty list when the tournament has no published standings yet.
 */
export async function getStandings(
  tournamentId: string,
  force?: boolean
): Promise<StandingsStage[]> {
  const stages = await cachedResource({
    force,
    key: `standings:${tournamentId}`,
    type: CACHE_TYPE,
    ttlDays: TTL.standings,
    schema: StandingsResponseSchema,
    fetcher: () => esportsFetch("getStandings", { params: { tournamentId } }),
    map: mapStandings,
  });
  return stages ?? [];
}

/** The first ranked stage, which is what a league hub shows above the fold. */
export function primaryTable(
  stages: StandingsStage[]
): Extract<StandingsStage, { kind: "table" }> | null {
  return (
    stages.find(
      (stage): stage is Extract<StandingsStage, { kind: "table" }> => stage.kind === "table"
    ) ?? null
  );
}
