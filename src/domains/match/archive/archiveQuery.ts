import type { Position } from "@prisma/client";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";
import { POSITIONS } from "@/domains/match/archive/archiveLabels";

/**
 * The browser-side twin of `parseArchiveFilters` — filters out of a URL, and back into one.
 *
 * The server's own `archiveFilterSchema` cannot be imported here: it derives its enum lists from
 * `Object.values(Position)`, a *runtime* import of `@prisma/client` that drags the query engine
 * into the client bundle. Only the type crosses the boundary, so this file still stops compiling
 * if the contract changes shape — which is the half worth guarding.
 *
 * It is tolerant where the server is strict. A stale or hand-edited URL drops the facets it cannot
 * read instead of throwing, because the alternative is a blank page where a search used to be.
 * Nothing is trusted for having passed through here; the API re-validates every facet.
 */

export const EMPTY_FILTERS: ArchiveFilters = { playerSide: "either" };

/** `champions` is capped at 30 by the schema; a longer URL would be refused outright. */
const MAX_LIST = 30;

const LIST_KEYS = ["champions", "positions", "queueTypes"] as const;

/** One list, so serialising and parsing the thresholds cannot drift apart. */
const NUMERIC_KEYS = [
  "minKda",
  "minCsPerMinute",
  "minVisionScore",
  "minKills",
  "maxDeaths",
  "minDuration",
  "maxDuration",
] as const;

type NumericKey = (typeof NUMERIC_KEYS)[number];

export function filtersToSearchParams(filters: ArchiveFilters): URLSearchParams {
  const params = new URLSearchParams();

  // Comma-joined rather than repeated keys: the server splits on commas either way, and a shared
  // link that reads `champions=Ahri,Zed` is one someone can edit by hand.
  for (const key of LIST_KEYS) {
    const values = filters[key];
    if (values?.length) params.set(key, values.join(","));
  }

  if (filters.result) params.set("result", filters.result);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.patch) params.set("patch", filters.patch);

  // A side with nobody named is meaningless, and "either" is the schema default — so both hang off
  // the same check rather than lengthening every URL that never used the facet.
  if (filters.playerPuuid) {
    params.set("playerPuuid", filters.playerPuuid);
    if (filters.playerSide !== "either") params.set("playerSide", filters.playerSide);
  }

  for (const key of NUMERIC_KEYS) {
    const value = filters[key];
    if (value !== undefined) params.set(key, String(value));
  }

  return params;
}

export function searchParamsToFilters(params: URLSearchParams): ArchiveFilters {
  const filters: ArchiveFilters = { ...EMPTY_FILTERS };

  const champions = readList(params, "champions");
  if (champions) filters.champions = champions.slice(0, MAX_LIST);

  const positions = readList(params, "positions")?.filter(isPosition);
  if (positions?.length) filters.positions = positions;

  // Queues pass through unchecked. `QueueType` is being widened (LA-37), and an allowlist compiled
  // into the browser would quietly delete tomorrow's queues out of today's shared links. A genuinely
  // invalid one is refused by the API, which names the offending facet — better than a page that
  // silently searches for something other than what the URL says.
  const queueTypes = readList(params, "queueTypes");
  if (queueTypes) filters.queueTypes = queueTypes as ArchiveFilters["queueTypes"];

  const result = params.get("result");
  if (result === "win" || result === "loss") filters.result = result;

  const from = params.get("from");
  if (from) filters.from = from;
  const to = params.get("to");
  if (to) filters.to = to;

  const patch = params.get("patch")?.trim();
  if (patch) filters.patch = patch;

  const playerPuuid = params.get("playerPuuid")?.trim();
  if (playerPuuid) {
    filters.playerPuuid = playerPuuid;
    const side = params.get("playerSide");
    if (side === "with" || side === "against" || side === "either") filters.playerSide = side;
  }

  const numbers: Partial<Record<NumericKey, number>> = {};
  for (const key of NUMERIC_KEYS) {
    const raw = params.get(key);
    if (raw === null || raw.trim() === "") continue;
    const value = Number(raw);
    if (Number.isFinite(value)) numbers[key] = value;
  }

  return { ...filters, ...numbers };
}

/**
 * How many facets are actually narrowing the search.
 *
 * Derived from the serialiser rather than counted by hand, so the badge on the console and the URL
 * can never disagree about whether a search is empty. `playerSide` is excluded because it only ever
 * appears next to the player it qualifies — counting it would bill one facet as two.
 */
export function countActiveFacets(filters: ArchiveFilters): number {
  return [...filtersToSearchParams(filters).keys()].filter((key) => key !== "playerSide").length;
}

/** Tells "this player has no matches at all" apart from "this search matched nothing". */
export function isEmptyFilters(filters: ArchiveFilters): boolean {
  return countActiveFacets(filters) === 0;
}

function readList(params: URLSearchParams, key: string): string[] | undefined {
  const all = params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return all.length > 0 ? [...new Set(all)] : undefined;
}

function isPosition(value: string): value is Position {
  return (POSITIONS as string[]).includes(value);
}
