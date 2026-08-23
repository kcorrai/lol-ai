import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { parseSearchQuery } from "@/lib/riot/riotId";
import {
  rankSearchHits,
  DEFAULT_SEARCH_LIMIT,
  SEARCH_OVERFETCH,
  type IndexedPlayer,
} from "@/domains/riot/services/playerSearch";

export type { IndexedPlayer };

/** A player as match sync sees them. Name and tag are optional: old Riot payloads omit both. */
export interface IndexablePlayer {
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
  region: string;
  profileIconId?: number | null;
  summonerLevel?: number | null;
}

interface CollapsedPlayer extends IndexablePlayer {
  gameName: string;
  tagLine: string;
  /** How many of the incoming rows were this player. */
  occurrences: number;
}

const SELECT_HIT = {
  puuid: true,
  gameName: true,
  tagLine: true,
  region: true,
  profileIconId: true,
  summonerLevel: true,
  seenCount: true,
  lastSeenAt: true,
} as const;

/**
 * Collapses a batch of participant rows to one entry per player, counting appearances.
 *
 * A player who was in thirty of the matches just synced is thirty rows here and one row in the
 * index, but the thirty is the ranking signal, so it is carried through as `occurrences`.
 */
function collapse(players: readonly IndexablePlayer[]): CollapsedPlayer[] {
  const byPuuid = new Map<string, CollapsedPlayer>();

  for (const p of players) {
    // A row with no Riot ID cannot be searched for, and writing it would only mean a permanent
    // "Unknown" in the dropdown.
    if (!p.puuid || !p.gameName || !p.tagLine) continue;

    const existing = byPuuid.get(p.puuid);
    if (existing) {
      existing.occurrences += 1;
    } else {
      byPuuid.set(p.puuid, { ...p, gameName: p.gameName, tagLine: p.tagLine, occurrences: 1 });
    }
  }

  return [...byPuuid.values()];
}

/**
 * Records every player in a batch of freshly-synced matches.
 *
 * Deliberately not a per-row upsert: a first-time sync carries several hundred distinct players
 * and Prisma has no bulk upsert, so that would be several hundred round trips inside the sync.
 * Instead this runs a fixed handful of statements whatever the batch size — one read, one
 * `createMany`, one `updateMany` per distinct appearance count, and a per-row write only for the
 * rare player who has changed their Riot ID since we last saw them.
 *
 * Never throws: a failure here costs autocomplete coverage, and must not fail a match sync.
 *
 * @returns how many distinct players were written
 */
export async function indexPlayers(players: readonly IndexablePlayer[]): Promise<number> {
  const rows = collapse(players);
  if (rows.length === 0) return 0;

  try {
    const puuids = rows.map((r) => r.puuid);
    const now = new Date();

    const stored = await prisma.playerIndex.findMany({
      where: { puuid: { in: puuids } },
      select: { puuid: true, gameName: true, tagLine: true, region: true },
    });
    const storedByPuuid = new Map(stored.map((s) => [s.puuid, s]));

    const fresh = rows.filter((r) => !storedByPuuid.has(r.puuid));
    if (fresh.length > 0) {
      // seenCount starts at 0 because the increment below covers new and existing rows alike.
      // skipDuplicates guards the race with a concurrent sync of an overlapping match.
      await prisma.playerIndex.createMany({
        data: fresh.map((r) => ({
          puuid: r.puuid,
          gameName: r.gameName,
          tagLine: r.tagLine,
          region: r.region,
          searchKey: r.gameName.toLowerCase(),
          profileIconId: r.profileIconId ?? null,
          summonerLevel: r.summonerLevel ?? null,
          seenCount: 0,
          lastSeenAt: now,
        })),
        skipDuplicates: true,
      });
    }

    // `updateMany` writes one value to every matched row, so players are grouped by how many
    // times they appeared. In practice that is a handful of groups, not one per player.
    const byOccurrences = new Map<number, string[]>();
    for (const r of rows) {
      const bucket = byOccurrences.get(r.occurrences);
      if (bucket) bucket.push(r.puuid);
      else byOccurrences.set(r.occurrences, [r.puuid]);
    }
    for (const [occurrences, group] of byOccurrences) {
      await prisma.playerIndex.updateMany({
        where: { puuid: { in: group } },
        data: { seenCount: { increment: occurrences }, lastSeenAt: now },
      });
    }

    // Riot IDs change. Only the rows that actually drifted get a statement of their own —
    // normally none, which is why this is not folded into the bulk path above.
    const renamed = rows.filter((r) => {
      const prev = storedByPuuid.get(r.puuid);
      return (
        prev !== undefined &&
        (prev.gameName !== r.gameName || prev.tagLine !== r.tagLine || prev.region !== r.region)
      );
    });
    for (const r of renamed) {
      await prisma.playerIndex.update({
        where: { puuid: r.puuid },
        data: {
          gameName: r.gameName,
          tagLine: r.tagLine,
          region: r.region,
          searchKey: r.gameName.toLowerCase(),
        },
      });
    }

    return rows.length;
  } catch (err) {
    logger.warn(
      `[playerIndex] Indexing ${rows.length} players failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return 0;
  }
}

/**
 * Autocomplete over every Riot ID we have ever seen.
 *
 * The prefix match runs in the database against the `text_pattern_ops` index; the ordering runs
 * in {@link rankSearchHits}, which is why more rows are fetched than are returned.
 *
 * @param rawQuery what the player has typed, `Name` or `Name#TAG`, unsanitised
 * @param opts.region narrows to one platform when the region chip is set
 */
export async function searchPlayers(
  rawQuery: string,
  opts: { region?: string; limit?: number } = {}
): Promise<IndexedPlayer[]> {
  const query = parseSearchQuery(rawQuery);
  if (!query) return [];

  const rows = await prisma.playerIndex.findMany({
    where: {
      searchKey: { startsWith: query.name },
      ...(query.tag ? { tagLine: { startsWith: query.tag, mode: "insensitive" as const } } : {}),
      ...(opts.region ? { region: opts.region } : {}),
    },
    select: SELECT_HIT,
    orderBy: { seenCount: "desc" },
    take: SEARCH_OVERFETCH,
  });

  return rankSearchHits(rows, query, opts.limit ?? DEFAULT_SEARCH_LIMIT);
}
