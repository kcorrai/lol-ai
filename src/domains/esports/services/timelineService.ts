import { z } from "zod";
import { elapsedSeconds } from "@/domains/esports/duration";
import { livestatsFetch } from "@/domains/esports/services/esportsApi";
import { TTL, cachedResource } from "@/domains/esports/services/esportsCache";
import { CACHE_TYPE, getGameStart } from "@/domains/esports/services/gameStatsService";
import { logger } from "@/lib/utils/logger";
import type { GameTimeline, TimelineSample } from "@/domains/esports/types";

/**
 * How the shape of a game gets read out of a feed that only answers in
 * hundred-second windows.
 *
 * `window/{gameId}?startingTime=T` returns ten frames at ten-second spacing, so
 * a full-resolution walk of a 35-minute game is ~21 requests against an
 * unofficial feed we are explicitly careful with (ADR-016). Sampling instead of
 * walking brings that to single figures, which is the whole cost decision
 * TASK-315 existed to make.
 */
const SAMPLE_INTERVAL_SECONDS = 4 * 60;

/**
 * Hard ceiling on requests per game, whatever the clock says.
 *
 * A feed that keeps answering `in_game` past the end of a real game would
 * otherwise walk forever. At four-minute sampling this allows a 96-minute game,
 * comfortably past the longest professional game on record.
 */
const MAX_SAMPLES = 24;

const TeamFrameSchema = z.object({
  totalGold: z.number().nullish(),
  totalKills: z.number().nullish(),
  towers: z.number().nullish(),
  inhibitors: z.number().nullish(),
  barons: z.number().nullish(),
  dragons: z.array(z.string()).nullish(),
});

const WalkSchema = z.object({
  frames: z.array(
    z.object({
      rfc460Timestamp: z.string(),
      gameState: z.string(),
      blueTeam: TeamFrameSchema,
      redTeam: TeamFrameSchema,
    })
  ),
});

type Frame = z.infer<typeof WalkSchema>["frames"][number];

/** The feed only accepts a starting time on the ten-second grid. */
function gridTime(at: Date): string {
  const on = new Date(at.getTime());
  on.setUTCSeconds(Math.floor(on.getUTCSeconds() / 10) * 10, 0);
  return on.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function toSample(frame: Frame, startedAt: string): TimelineSample | null {
  // A frame at or before the opening one carries nothing but zeros; including it
  // would put a flat leading segment on every curve.
  const seconds = Math.round((Date.parse(frame.rfc460Timestamp) - Date.parse(startedAt)) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return null;

  return {
    seconds,
    blue: {
      gold: frame.blueTeam.totalGold ?? 0,
      kills: frame.blueTeam.totalKills ?? 0,
      towers: frame.blueTeam.towers ?? 0,
      inhibitors: frame.blueTeam.inhibitors ?? 0,
      barons: frame.blueTeam.barons ?? 0,
      dragons: frame.blueTeam.dragons?.length ?? 0,
    },
    red: {
      gold: frame.redTeam.totalGold ?? 0,
      kills: frame.redTeam.totalKills ?? 0,
      towers: frame.redTeam.towers ?? 0,
      inhibitors: frame.redTeam.inhibitors ?? 0,
      barons: frame.redTeam.barons ?? 0,
      dragons: frame.redTeam.dragons?.length ?? 0,
    },
  };
}

/**
 * One sampled walk of a game, from its opening frame to the frame that reports
 * it finished.
 *
 * Every step is its own cached resource keyed by offset, not one cached array:
 * a walk that dies half way then leaves the samples it did reach warm, and the
 * retry pays only for the rest. Samples are requested in sequence rather than in
 * parallel because the loop cannot know where to stop until a frame says the
 * game is over, and firing twenty speculative requests to find out is exactly
 * the traffic the sampling exists to avoid.
 */
async function walk(
  gameId: string,
  startedAt: string,
  completed: boolean
): Promise<TimelineSample[]> {
  const start = Date.parse(startedAt);
  const samples: TimelineSample[] = [];
  let requests = 0;

  for (let step = 1; step <= MAX_SAMPLES; step += 1) {
    const at = new Date(start + step * SAMPLE_INTERVAL_SECONDS * 1000);
    // The feed rejects a window ending in the future outright, so a live game's
    // walk simply stops at the present rather than erroring.
    if (at.getTime() > Date.now() - 2 * 60 * 1000) break;

    const startingTime = gridTime(at);
    requests += 1;

    const frames = await cachedResource({
      key: `game:${gameId}:walk:${step}`,
      type: CACHE_TYPE,
      // A completed game's frames never change; a live game's walk is only
      // provisional until the game ends, so it expires with the live window.
      ttlDays: completed ? TTL.completedGame : TTL.live,
      schema: WalkSchema,
      fetcher: () => livestatsFetch(`window/${gameId}`, { params: { startingTime } }),
      map: (payload) => payload.frames,
    });

    const frame = frames?.at(-1);
    if (!frame) break;

    const sample = toSample(frame, startedAt);
    if (sample) samples.push(sample);

    // Sampling past the end returns the closing totals over and over, which
    // would draw a long flat tail on a game that had already finished.
    if (frame.gameState === "finished") break;
  }

  logger.info(`[timeline] ${gameId} walked in ${requests} requests, ${samples.length} samples`);
  return samples;
}

/**
 * Gold, kills and objectives across a game, sampled every four minutes.
 *
 * Fetched only for the game a reader is actually looking at — never for every
 * game in a series — and cached whole for a month once the game is finished, so
 * the walk is paid once per game rather than once per reader.
 */
export async function getGameTimeline(
  gameId: string,
  { completed }: { completed: boolean }
): Promise<GameTimeline | null> {
  const startedAt = await getGameStart(gameId);
  if (!startedAt) return null;

  const samples = await walk(gameId, startedAt, completed);
  if (samples.length === 0) return null;

  const last = samples[samples.length - 1];

  return {
    gameId,
    startedAt,
    intervalSeconds: SAMPLE_INTERVAL_SECONDS,
    // The walk stops at MAX_SAMPLES whatever the game was doing, and a reader
    // looking at a curve that ends before the game did has to be told so.
    truncated: samples.length >= MAX_SAMPLES,
    durationSeconds: elapsedSeconds(
      startedAt,
      new Date(Date.parse(startedAt) + last.seconds * 1000).toISOString()
    ),
    samples,
  };
}
