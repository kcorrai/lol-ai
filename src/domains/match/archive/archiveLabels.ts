import type { Position } from "@prisma/client";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";

/**
 * Display names for the archive facets, kept apart from the query helpers because these are the
 * only strings in the feature a translator would ever touch.
 *
 * Exhaustive by construction: `satisfies Record<Position, string>` fails the build the day a
 * position is added to the Prisma enum, which is the failure we want — a silently unlabelled role
 * in the filter console would just look broken.
 */
export const POSITION_LABELS = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
} as const satisfies Record<Position, string>;

export const POSITIONS = Object.keys(POSITION_LABELS) as Position[];

/**
 * Queues are deliberately *not* exhaustive. `QueueType` is being widened (LA-37) so no game is
 * dropped on ingest, and the console only ever offers the queues the options endpoint says this
 * player actually has. An unlabelled queue is humanised from its own name rather than hidden, so a
 * new one is searchable the day it lands instead of the day someone remembers this file.
 */
const QUEUE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: "Ranked Solo/Duo",
  RANKED_FLEX_SR: "Ranked Flex",
  NORMAL_BLIND: "Normal Blind",
  NORMAL_DRAFT: "Normal Draft",
  ARAM: "ARAM",
  ARENA: "Arena",
  URF: "URF",
  ONE_FOR_ALL: "One for All",
  NEXUS_BLITZ: "Nexus Blitz",
};

export function queueLabel(queue: string): string {
  return (
    QUEUE_LABELS[queue] ??
    queue
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function positionLabel(position: string): string {
  return POSITION_LABELS[position as Position] ?? position;
}

export const PLAYER_SIDE_LABELS: Record<ArchiveFilters["playerSide"], string> = {
  with: "On my team",
  against: "Against me",
  either: "Either side",
};

/** Human names for the numeric thresholds, used by both the controls and the active-filter chips. */
export const THRESHOLD_LABELS = {
  minKda: "KDA ≥",
  minCsPerMinute: "CS/min ≥",
  minVisionScore: "Vision ≥",
  minKills: "Kills ≥",
  maxDeaths: "Deaths ≤",
  minDuration: "Length ≥",
  maxDuration: "Length ≤",
} as const;

/**
 * One short phrase per active facet — what a saved search shows on its chip, and what the results
 * header says the player asked for. Built from the filters rather than from the URL so a saved
 * search that was never in the address bar describes itself just as well.
 */
export function describeFilters(filters: ArchiveFilters, playerName?: string): string[] {
  const parts: string[] = [];

  if (filters.champions?.length) parts.push(filters.champions.join(", "));
  if (filters.positions?.length) parts.push(filters.positions.map(positionLabel).join(", "));
  if (filters.queueTypes?.length) parts.push(filters.queueTypes.map(queueLabel).join(", "));
  if (filters.result) parts.push(filters.result === "win" ? "Wins" : "Losses");
  if (filters.patch) parts.push(`Patch ${filters.patch}`);

  const from = filters.from ? shortDate(filters.from) : null;
  const to = filters.to ? shortDate(filters.to) : null;
  if (from && to) parts.push(`${from} – ${to}`);
  else if (from) parts.push(`From ${from}`);
  else if (to) parts.push(`Until ${to}`);

  if (filters.playerPuuid) {
    const who = playerName ?? "a player";
    parts.push(
      filters.playerSide === "with"
        ? `With ${who}`
        : filters.playerSide === "against"
          ? `Against ${who}`
          : `Alongside or against ${who}`
    );
  }

  for (const [key, label] of Object.entries(THRESHOLD_LABELS)) {
    const value = filters[key as keyof typeof THRESHOLD_LABELS];
    if (value === undefined) continue;
    const suffix = key === "minDuration" || key === "maxDuration" ? " min" : "";
    parts.push(`${label} ${value}${suffix}`);
  }

  return parts;
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "2-digit" });
}
