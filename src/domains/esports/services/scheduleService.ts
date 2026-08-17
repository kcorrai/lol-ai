import { esportsFetch } from "@/domains/esports/services/esportsApi";
import { TTL, cachedResource } from "@/domains/esports/services/esportsCache";
import {
  ScheduleResponseSchema,
  mapEvents,
  mergeEvents,
} from "@/domains/esports/services/eventMapper";
import type { EsportsEvent } from "@/domains/esports/types";

const CACHE_TYPE = "esports-schedule";

// The feed answers with a window of ~80 events centred on now — past on one side,
// future on the other — plus tokens for the adjacent windows. One page is enough
// for a hub or a league; only a long forward view needs more.
const EVENTS_PER_PAGE = 80;

// A hard stop on paging. Without it, a caller asking for an implausible limit
// would walk the feed's entire history one request at a time.
const MAX_EXTRA_PAGES = 2;

interface SchedulePage {
  events: EsportsEvent[];
  older: string | null;
  newer: string | null;
}

async function fetchSchedulePage(
  leagueId: string | undefined,
  pageToken: string | undefined,
  force?: boolean
): Promise<SchedulePage | null> {
  return cachedResource({
    force,
    key: `schedule:${leagueId ?? "all"}:${pageToken ?? "current"}`,
    type: CACHE_TYPE,
    ttlDays: TTL.schedule,
    schema: ScheduleResponseSchema,
    fetcher: () => esportsFetch("getSchedule", { params: { leagueId, pageToken } }),
    map: (parsed): SchedulePage => ({
      events: mapEvents(parsed.data.schedule.events),
      older: parsed.data.schedule.pages?.older ?? null,
      newer: parsed.data.schedule.pages?.newer ?? null,
    }),
  });
}

/**
 * The current window plus up to `extraPages` in one direction, merged and sorted
 * by kickoff. Paging stops early when the feed says there is nothing further,
 * which is how a league mid-split costs exactly one request.
 */
async function collectWindow(
  leagueId: string | undefined,
  direction: "older" | "newer",
  extraPages: number,
  force?: boolean
): Promise<EsportsEvent[]> {
  const first = await fetchSchedulePage(leagueId, undefined, force);
  if (!first) return [];

  const pages: EsportsEvent[][] = [first.events];
  let token = direction === "older" ? first.older : first.newer;

  for (let i = 0; i < Math.min(extraPages, MAX_EXTRA_PAGES) && token; i += 1) {
    const page: SchedulePage | null = await fetchSchedulePage(leagueId, token, force);
    if (!page) break;
    pages.push(page.events);
    token = direction === "older" ? page.older : page.newer;
  }

  return mergeEvents(pages);
}

/** How many extra windows a limit needs, given one window is already in hand. */
function extraPagesFor(limit: number): number {
  return Math.max(0, Math.ceil(limit / EVENTS_PER_PAGE) - 1);
}

export interface ScheduleQuery {
  /** Feed league id. Omitted means every league. */
  leagueId?: string;
  limit?: number;
  /** Refetch even while the window is fresh. The warm job only. */
  force?: boolean;
}

/**
 * Matches that have not finished, soonest first. In-progress series are included
 * and sort first — from a reader's point of view "what is on now" and "what is on
 * next" are the same question.
 */
export async function getUpcoming({ leagueId, limit = 20, force }: ScheduleQuery = {}): Promise<
  EsportsEvent[]
> {
  const events = await collectWindow(leagueId, "newer", extraPagesFor(limit), force);
  return events.filter((event) => event.state !== "completed").slice(0, limit);
}

/** Finished matches, most recent first. */
export async function getCompleted({ leagueId, limit = 20, force }: ScheduleQuery = {}): Promise<
  EsportsEvent[]
> {
  const events = await collectWindow(leagueId, "older", extraPagesFor(limit), force);
  return events
    .filter((event) => event.state === "completed")
    .reverse()
    .slice(0, limit);
}

/** How wide a net `getEventStartTime` casts. Two windows in each direction. */
const START_TIME_LOOKUP_LIMIT = 200;

/**
 * Kickoff for one match, or null.
 *
 * `getEventDetails` publishes no start time (see `matchService`), so a match
 * page resolves it from the schedule windows — already cached, because the hub
 * and the league pages read the same ones. Outside that window the answer is
 * null and the page states what it can prove instead of inventing a date.
 */
export async function getEventStartTime(matchId: string): Promise<string | null> {
  const [upcoming, completed] = await Promise.all([
    getUpcoming({ limit: START_TIME_LOOKUP_LIMIT }),
    getCompleted({ limit: START_TIME_LOOKUP_LIMIT }),
  ]);
  const event = [...upcoming, ...completed].find((entry) => entry.matchId === matchId);
  return event?.startTime ?? null;
}

/**
 * What is being played right now, from the feed's own live endpoint rather than
 * filtered out of the schedule — it is the only source that stays current within
 * a game, and it carries team ids and slugs the schedule payload omits.
 */
export async function getLiveEvents(force?: boolean): Promise<EsportsEvent[]> {
  const events = await cachedResource({
    force,
    key: "live",
    type: CACHE_TYPE,
    ttlDays: TTL.live,
    schema: ScheduleResponseSchema,
    fetcher: () => esportsFetch("getLive"),
    map: (parsed) => mapEvents(parsed.data.schedule.events),
  });
  return events ?? [];
}
