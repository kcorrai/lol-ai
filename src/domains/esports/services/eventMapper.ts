import { z } from "zod";
import { httpsAsset } from "@/domains/esports/services/esportsApi";
import type {
  EsportsEvent,
  EsportsEventTeam,
  EventState,
  MatchOutcome,
} from "@/domains/esports/types";

// One schema for every endpoint that returns events. `getSchedule` sends a lean
// version (no event id, no league id, teams without id or slug) and `getLive`
// sends a rich one; rather than two schemas that drift apart, everything the lean
// payload omits is optional here and the mapper fills the gaps.

const EventTeamSchema = z.object({
  id: z.string().nullish(),
  slug: z.string().nullish(),
  name: z.string(),
  code: z.string(),
  image: z.string().nullish(),
  result: z.object({ outcome: z.string().nullish(), gameWins: z.number().nullish() }).nullish(),
  record: z.object({ wins: z.number(), losses: z.number() }).nullish(),
});

export const EventSchema = z.object({
  id: z.string().nullish(),
  startTime: z.string(),
  state: z.string(),
  type: z.string().nullish(),
  blockName: z.string().nullish(),
  league: z.object({
    id: z.string().nullish(),
    slug: z.string().nullish(),
    name: z.string(),
    image: z.string().nullish(),
  }),
  tournament: z.object({ id: z.string() }).nullish(),
  // Only `getLive` sends these; the schedule payload omits them entirely.
  streams: z
    .array(
      z.object({
        provider: z.string().nullish(),
        parameter: z.string().nullish(),
        locale: z.string().nullish(),
        mediaLocale: z.object({ translatedName: z.string().nullish() }).nullish(),
      })
    )
    .nullish(),
  match: z
    .object({
      id: z.string(),
      flags: z.array(z.string()).nullish(),
      teams: z.array(EventTeamSchema),
      strategy: z.object({ count: z.number().nullish() }).nullish(),
    })
    .nullish(),
});

export const ScheduleResponseSchema = z.object({
  data: z.object({
    schedule: z.object({
      pages: z.object({ older: z.string().nullish(), newer: z.string().nullish() }).nullish(),
      events: z.array(EventSchema),
    }),
  }),
});

type RawEvent = z.infer<typeof EventSchema>;
type RawEventTeam = z.infer<typeof EventTeamSchema>;

const EVENT_STATES: readonly string[] = ["unstarted", "inProgress", "completed"];

function parseOutcome(raw: string | null | undefined): MatchOutcome | null {
  return raw === "win" || raw === "loss" ? raw : null;
}

// Only used when the feed omits a league slug, which it has not been observed to
// do — but a link is better than a blank, and an unknown slug simply 404s on the
// league page rather than rendering something wrong.
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapTeam(raw: RawEventTeam): EsportsEventTeam {
  return {
    id: raw.id ?? null,
    slug: raw.slug ?? null,
    name: raw.name,
    code: raw.code,
    image: httpsAsset(raw.image),
    gameWins: raw.result?.gameWins ?? 0,
    outcome: parseOutcome(raw.result?.outcome),
    record: raw.record ?? null,
  };
}

/**
 * Maps one raw event, or null when it is not something we can render honestly:
 * a non-match entry (the feed also carries shows), an entry with no match
 * payload, or a state we do not recognise — guessing at an unknown state risks
 * printing "final" over a game that is still being played.
 */
export function mapEvent(raw: RawEvent): EsportsEvent | null {
  if (raw.type && raw.type !== "match") return null;
  if (!raw.match) return null;
  if (!EVENT_STATES.includes(raw.state)) return null;

  return {
    matchId: raw.match.id,
    startTime: raw.startTime,
    state: raw.state as EventState,
    blockName: raw.blockName ?? null,
    bestOf: raw.match.strategy?.count ?? null,
    league: {
      id: raw.league.id ?? null,
      slug: raw.league.slug ?? slugify(raw.league.name),
      name: raw.league.name,
      image: httpsAsset(raw.league.image),
    },
    tournamentId: raw.tournament?.id ?? null,
    teams: raw.match.teams.map(mapTeam),
    hasVod: raw.match.flags?.includes("hasVod") ?? false,
    streams: (raw.streams ?? []).flatMap((stream) =>
      stream.provider && stream.parameter
        ? [
            {
              provider: stream.provider,
              parameter: stream.parameter,
              locale: stream.locale ?? "",
              language: stream.mediaLocale?.translatedName ?? stream.locale ?? "Unknown",
            },
          ]
        : []
    ),
  };
}

export function mapEvents(raw: RawEvent[]): EsportsEvent[] {
  return raw.map(mapEvent).filter((event): event is EsportsEvent => event !== null);
}

/** Merges pages, drops repeats (windows overlap), and sorts by kickoff. */
export function mergeEvents(pages: EsportsEvent[][]): EsportsEvent[] {
  const byMatchId = new Map<string, EsportsEvent>();
  for (const page of pages) {
    for (const event of page) byMatchId.set(event.matchId, event);
  }
  return [...byMatchId.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
}
