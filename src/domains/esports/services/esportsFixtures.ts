import { logger } from "@/lib/utils/logger";

// Replays captured feed payloads so the E2E run never touches the live esports
// feeds (CLAUDE.md 5.4). Same shape as the E2E branches in riotApiClient, one
// layer lower: this one answers at the fetch boundary rather than per service,
// because the section has twelve call sites across ten endpoints.
//
// Refresh the fixtures with `node scripts/capture-esports-fixtures.mjs`.

interface Manifest {
  capturedAt: string;
  leagueId: string;
  leagueSlug: string;
  tournamentId: string;
  matchId: string;
  gameId: string;
  gameStartedAt: string;
  closingTime: string;
  walk: { step: number; startingTime: string }[];
}

const DIR = "tests/e2e/fixtures/esports";

export function fixturesEnabled(): boolean {
  return process.env.E2E_MOCK === "true";
}

/** Fixtures are read once per server process; they never change under it. */
const cache = new Map<string, unknown>();

async function read(name: string): Promise<unknown | null> {
  if (cache.has(name)) return cache.get(name) ?? null;

  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const parsed: unknown = JSON.parse(await readFile(join(process.cwd(), DIR, `${name}.json`), "utf8"));
    cache.set(name, parsed);
    return parsed;
  } catch {
    // A miss is not a failure — it is how this layer says "the feed has nothing
    // for you", which is a state the section is built to survive.
    cache.set(name, null);
    return null;
  }
}

function json(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * What an uncaptured endpoint answers.
 *
 * 503 rather than 404 because `cachedResource` treats any non-ok response the
 * same way — fall back to last-good, then to null — and null is what makes a
 * page render its empty state instead of a 500. That path is part of the
 * section's definition of done, so exercising it here is deliberate.
 */
function unavailable(): Response {
  return new Response(JSON.stringify({ error: "no fixture" }), { status: 503 });
}

/**
 * Move an event's kickoff onto the clock of the run, not the clock of the capture.
 *
 * Fixtures age. A schedule captured in August still says August, so by September
 * every "upcoming" match in it has silently become a past one and the hub's
 * upcoming column tests nothing. Shifting by the capture age keeps the split
 * where it was.
 *
 * Completed events move too, and are clamped so one can never land in the
 * future — a match that is finished and has not started is a payload no real
 * feed produces. Leaving them alone was the earlier reading, and it rots the
 * other way: `/esports/schedule` only lists results from the last three days,
 * so every captured result silently disappears three days after a capture and
 * the results half of that page tests nothing.
 */
function rebase<T>(payload: T, capturedAt: string): T {
  const delta = Date.now() - Date.parse(capturedAt);
  if (!Number.isFinite(delta)) return payload;

  const shift = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(shift);
    if (value === null || typeof value !== "object") return value;

    const record = value as Record<string, unknown>;
    const shifted: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) shifted[key] = shift(item);

    if (typeof record.startTime === "string") {
      const at = Date.parse(record.startTime);
      if (Number.isFinite(at)) {
        const moved = record.state === "completed" ? Math.min(at + delta, Date.now() - 60_000) : at + delta;
        shifted.startTime = new Date(moved).toISOString();
      }
    }
    return shifted;
  };

  return shift(payload) as T;
}

/**
 * Nothing is live during an E2E run, by construction.
 *
 * The alternative — capturing whatever happened to be playing — would make the
 * hub's live block depend on the professional calendar, and the run would pass
 * or fail on whether a match was on. "Nothing live" is a real, and by far the
 * more common, state of that endpoint.
 */
const NO_LIVE_EVENTS = { data: { schedule: { events: [] } } };

/** Serve `path` from the captured esports API payloads, or 503. */
export async function esportsFixture(
  path: string,
  params: Record<string, string | undefined>
): Promise<Response> {
  const manifest = (await read("manifest")) as Manifest | null;
  if (!manifest) {
    logger.warn("[esportsFixtures] no manifest — run scripts/capture-esports-fixtures.mjs");
    return unavailable();
  }

  switch (path) {
    case "getLeagues":
    case "getTeams":
    case "getVods":
      return serve(await read(path), manifest);

    case "getLive":
      return json(NO_LIVE_EVENTS);

    case "getSchedule":
      // A page token asks for an older page than the one captured; saying there
      // is none is truthful and stops the pagination walk where it starts.
      if (params.pageToken) return unavailable();
      if (params.leagueId && params.leagueId !== manifest.leagueId) return unavailable();
      return serve(await read("getSchedule"), manifest);

    case "getTournamentsForLeague":
      if (params.leagueId !== manifest.leagueId) return unavailable();
      return serve(await read("getTournamentsForLeague"), manifest);

    case "getStandings":
      if (params.tournamentId !== manifest.tournamentId) return unavailable();
      return serve(await read("getStandings"), manifest);

    case "getEventDetails":
      if (params.id !== manifest.matchId) return unavailable();
      return serve(await read("getEventDetails"), manifest);

    default:
      return unavailable();
  }
}

/** Serve `path` from the captured livestats payloads, or 503. */
export async function livestatsFixture(
  path: string,
  params: Record<string, string | undefined>
): Promise<Response> {
  const manifest = (await read("manifest")) as Manifest | null;
  if (!manifest) return unavailable();

  const [kind, gameId] = path.split("/");
  if (gameId !== manifest.gameId) return unavailable();

  if (kind === "details") return serve(await read(`details-${gameId}-closing`), manifest);
  if (kind !== "window") return unavailable();

  // No starting time means "answer from the opening frames", which is the one
  // request that reveals a game's length (`getGameStart`).
  if (!params.startingTime) return serve(await read(`window-${gameId}-opening`), manifest);

  // The gold-curve walk asks at fixed offsets from the opening frame, so its
  // times are the same every run and were captured exactly.
  const step = manifest.walk.find((sample) => sample.startingTime === params.startingTime);
  if (step) return serve(await read(`walk-${gameId}-${step.step}`), manifest);

  // Anything else is a time after the game ended. The real feed clamps that to
  // the closing window rather than erroring, and so does this.
  return serve(await read(`window-${gameId}-closing`), manifest);
}

function serve(payload: unknown, manifest: Manifest): Response {
  if (payload === null) return unavailable();
  return json(rebase(payload, manifest.capturedAt));
}
