import { cachedResource, livestatsFetch, TTL } from "@/domains/esports/services/esportsApi";
import {
  buildStats,
  DetailsSchema,
  GameStartSchema,
  WindowSchema,
} from "@/domains/esports/services/gameStatsMapper";
import type { GameStats } from "@/domains/esports/types";

export const CACHE_TYPE = "esports-game";

/**
 * Bumped when the game shape gained the end-game stat line and `wardsDestroyed`.
 *
 * Without it, every game already cached — thirty days of them — keeps serving
 * the copy Zod stripped before those fields existed, and the stat sheet renders
 * a table of zeros. See `cacheKey`.
 */
export const GAME_SHAPE_VERSION = 2;

/**
 * The livestats feed answers with a ten-frame window starting at `startingTime`,
 * and it rejects a time in the future ("disallowed window with end time…").
 *
 * Any past time after a game ended clamps to the end and returns the final
 * frame, so "a couple of minutes ago" fetches the finished state of any
 * completed game in a single request, and the most recent frames of a live one.
 * The seconds are floored to ten because the feed only accepts that grid.
 */
export function windowTime(now: Date): string {
  const at = new Date(now.getTime() - 2 * 60 * 1000);
  at.setUTCSeconds(Math.floor(at.getUTCSeconds() / 10) * 10, 0);
  return at.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * When the game's first frame was published.
 *
 * The window endpoint answers from the beginning of the game when it is given no
 * `startingTime`, which is the only way either feed reveals a game's length — and
 * it is what ADR-016 recorded as unavailable. Verified against three completed
 * games and cross-checked against the VOD segment lengths on the same series.
 *
 * Cached for a month regardless of whether the game is still being played: a
 * game's opening frame is immutable the moment it exists, so a live game pays
 * for this once rather than every thirty seconds.
 */
export async function getGameStart(gameId: string): Promise<string | null> {
  return cachedResource({
    key: `game:${gameId}:start`,
    type: CACHE_TYPE,
    version: GAME_SHAPE_VERSION,
    ttlDays: TTL.completedGame,
    schema: GameStartSchema,
    fetcher: () => livestatsFetch(`window/${gameId}`),
    map: (payload) => payload.frames[0]?.rfc460Timestamp ?? null,
  });
}

/**
 * Draft, final scoreboard and objectives for one game.
 *
 * A completed game never changes again, so it is cached for a month; a live one
 * for thirty seconds, under a separate key so a mid-game snapshot can never be
 * served as the final result.
 */
export async function getGameStats(
  gameId: string,
  { completed, now = new Date() }: { completed: boolean; now?: Date }
): Promise<GameStats | null> {
  const startingTime = windowTime(now);

  return cachedResource({
    key: completed ? `game:${gameId}` : `game:${gameId}:live`,
    type: CACHE_TYPE,
    version: GAME_SHAPE_VERSION,
    ttlDays: completed ? TTL.completedGame : TTL.live,
    schema: WindowSchema,
    fetcher: () => livestatsFetch(`window/${gameId}`, { params: { startingTime } }),
    map: (windowPayload) => windowPayload,
  }).then(async (windowPayload) => {
    if (!windowPayload) return null;

    // Both are a bonus on top of the window: KDA, CS and gold already came from
    // it, so a game the details endpoint has no data for — or one whose opening
    // frames were never published — still renders a scoreboard, just without the
    // extra columns.
    const [detailsPayload, firstFrameAt] = await Promise.all([
      cachedResource({
        key: completed ? `game:${gameId}:details` : `game:${gameId}:details:live`,
        type: CACHE_TYPE,
        version: GAME_SHAPE_VERSION,
        ttlDays: completed ? TTL.completedGame : TTL.live,
        schema: DetailsSchema,
        fetcher: () => livestatsFetch(`details/${gameId}`, { params: { startingTime } }),
        map: (payload) => payload,
      }),
      getGameStart(gameId),
    ]);

    return buildStats(windowPayload, detailsPayload, firstFrameAt);
  });
}
