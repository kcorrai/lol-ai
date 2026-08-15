import { cachedResource, esportsFetch, TTL } from "@/domains/esports/services/esportsApi";
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
  pageToken: string | undefined
): Promise<SchedulePage | null> {
  return cachedResource({
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
  extraPages: number
): Promise<EsportsEvent[]> {
  const first = await fetchSchedulePage(leagueId, undefined);
  if (!first) return [];

  const pages: EsportsEvent[][] = [first.events];
  let token = direction === "older" ? first.older : first.newer;

  for (let i = 0; i < Math.min(extraPages, MAX_EXTRA_PAGES) && token; i += 1) {
    const page: SchedulePage | null = await fetchSchedulePage(leagueId, token);
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
}

/**
 * Matches that have not finished, soonest first. In-progress series are included
 * and sort first — from a reader's point of view "what is on now" and "what is on
 * next" are the same question.
 */
export async function getUpcoming({ leagueId, limit = 20 }: ScheduleQuery = {}): Promise<
  EsportsEvent[]
> {
  const events = await collectWindow(leagueId, "newer", extraPagesFor(limit));
  return events.filter((event) => event.state !== "completed").slice(0, limit);
}

/** Finished matches, most recent first. */
export async function getCompleted({ leagueId, limit = 20 }: ScheduleQuery = {}): Promise<
  EsportsEvent[]
> {
  const events = await collectWindow(leagueId, "older", extraPagesFor(limit));
  return events
    .filter((event) => event.state === "completed")
    .reverse()
    .slice(0, limit);
}

/**
 * What is being played right now, from the feed's own live endpoint rather than
 * filtered out of the schedule — it is the only source that stays current within
 * a game, and it carries team ids and slugs the schedule payload omits.
 */
export async function getLiveEvents(): Promise<EsportsEvent[]> {
  const events = await cachedResource({
    key: "live",
    type: CACHE_TYPE,
    ttlDays: TTL.live,
    schema: ScheduleResponseSchema,
    fetcher: () => esportsFetch("getLive"),
    map: (parsed) => mapEvents(parsed.data.schedule.events),
  });
  return events ?? [];
}
