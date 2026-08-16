import { z } from "zod";
import { elapsedSeconds } from "@/domains/esports/duration";
import { cachedResource, livestatsFetch, TTL } from "@/domains/esports/services/esportsApi";
import type {
  FinalStatLine,
  GameParticipant,
  GameStats,
  GameTeamStats,
  PlayerRole,
} from "@/domains/esports/types";

const CACHE_TYPE = "esports-game";

const ROLES: readonly string[] = ["top", "jungle", "mid", "bottom", "support"];

/**
 * The livestats feed answers with a ten-frame window starting at `startingTime`,
 * and it rejects a time in the future ("disallowed window with end time…").
 *
 * Any past time after a game ended clamps to the end and returns the final
 * frame, so "a couple of minutes ago" fetches the finished state of any
 * completed game in a single request, and the most recent frames of a live one.
 * The seconds are floored to ten because the feed only accepts that grid.
 */
function windowTime(now: Date): string {
  const at = new Date(now.getTime() - 2 * 60 * 1000);
  at.setUTCSeconds(Math.floor(at.getUTCSeconds() / 10) * 10, 0);
  return at.toISOString().replace(/\.\d{3}Z$/, "Z");
}

const ParticipantMetadataSchema = z.object({
  participantId: z.number(),
  esportsPlayerId: z.string().nullish(),
  summonerName: z.string(),
  championId: z.string(),
  role: z.string().nullish(),
});

const TeamMetadataSchema = z.object({
  esportsTeamId: z.string().nullish(),
  participantMetadata: z.array(ParticipantMetadataSchema),
});

const WindowParticipantSchema = z.object({
  participantId: z.number(),
  level: z.number().nullish(),
  kills: z.number().nullish(),
  deaths: z.number().nullish(),
  assists: z.number().nullish(),
  creepScore: z.number().nullish(),
  totalGold: z.number().nullish(),
});

const WindowTeamSchema = z.object({
  totalGold: z.number().nullish(),
  totalKills: z.number().nullish(),
  towers: z.number().nullish(),
  inhibitors: z.number().nullish(),
  barons: z.number().nullish(),
  dragons: z.array(z.string()).nullish(),
  participants: z.array(WindowParticipantSchema),
});

const WindowSchema = z.object({
  esportsGameId: z.string(),
  gameMetadata: z.object({
    patchVersion: z.string().nullish(),
    blueTeamMetadata: TeamMetadataSchema,
    redTeamMetadata: TeamMetadataSchema,
  }),
  frames: z.array(
    z.object({
      rfc460Timestamp: z.string(),
      gameState: z.string(),
      blueTeam: WindowTeamSchema,
      redTeam: WindowTeamSchema,
    })
  ),
});

const DetailsParticipantSchema = z.object({
  participantId: z.number(),
  killParticipation: z.number().nullish(),
  championDamageShare: z.number().nullish(),
  wardsPlaced: z.number().nullish(),
  wardsDestroyed: z.number().nullish(),
  // The end-game stat line. `criticalChance` and `tenacity` are published
  // alongside these and are zero for every participant in every game sampled,
  // so they are not read — see `FinalStatLine`.
  attackDamage: z.number().nullish(),
  abilityPower: z.number().nullish(),
  armor: z.number().nullish(),
  magicResistance: z.number().nullish(),
  attackSpeed: z.number().nullish(),
  lifeSteal: z.number().nullish(),
  items: z.array(z.number()).nullish(),
  perkMetadata: z
    .object({
      styleId: z.number().nullish(),
      subStyleId: z.number().nullish(),
      perks: z.array(z.number()).nullish(),
    })
    .nullish(),
  // Skill levelling order, in order taken: ["Q","W","E","Q",…]. The only place
  // either feed publishes it.
  abilities: z.array(z.string()).nullish(),
});

const DetailsSchema = z.object({
  frames: z.array(
    z.object({
      rfc460Timestamp: z.string(),
      participants: z.array(DetailsParticipantSchema),
    })
  ),
});

/** The opening window, read only for its first timestamp. */
const GameStartSchema = z.object({
  frames: z.array(z.object({ rfc460Timestamp: z.string() })),
});

type WindowPayload = z.infer<typeof WindowSchema>;
type DetailsPayload = z.infer<typeof DetailsSchema>;

function parseRole(raw: string | null | undefined): PlayerRole | null {
  const role = (raw ?? "").toLowerCase();
  return ROLES.includes(role) ? (role as PlayerRole) : null;
}

/**
 * The stat line a player finished on, or null when the game has no details.
 *
 * Every one of these is a resistance or a damage figure that is legitimately
 * zero for some builds — a tank's ability power, a bruiser's life steal — so
 * "nothing published" cannot be inferred from the values. The presence of the
 * details record itself is the test, and a missing one gives null.
 */
function finalStatLine(
  detail: z.infer<typeof DetailsParticipantSchema> | undefined
): FinalStatLine | null {
  if (!detail) return null;

  return {
    attackDamage: detail.attackDamage ?? 0,
    abilityPower: detail.abilityPower ?? 0,
    armor: detail.armor ?? 0,
    magicResistance: detail.magicResistance ?? 0,
    attackSpeed: detail.attackSpeed ?? 0,
    lifeSteal: detail.lifeSteal ?? 0,
  };
}

function buildTeam(
  side: "blue" | "red",
  metadata: z.infer<typeof TeamMetadataSchema>,
  frame: z.infer<typeof WindowTeamSchema>,
  details: Map<number, z.infer<typeof DetailsParticipantSchema>>
): GameTeamStats {
  const byId = new Map(frame.participants.map((p) => [p.participantId, p]));

  const participants: GameParticipant[] = metadata.participantMetadata.map((meta) => {
    const live = byId.get(meta.participantId);
    const detail = details.get(meta.participantId);
    return {
      participantId: meta.participantId,
      playerId: meta.esportsPlayerId ?? null,
      // The feed prefixes handles with the team code ("KT PerfecT"); the code is
      // already on the page, so it is stripped for the scoreboard.
      handle: meta.summonerName.replace(/^\S+\s+/, "") || meta.summonerName,
      fullHandle: meta.summonerName,
      championId: meta.championId,
      role: parseRole(meta.role),
      level: live?.level ?? 0,
      kills: live?.kills ?? 0,
      deaths: live?.deaths ?? 0,
      assists: live?.assists ?? 0,
      creepScore: live?.creepScore ?? 0,
      gold: live?.totalGold ?? 0,
      killParticipation: detail?.killParticipation ?? null,
      damageShare: detail?.championDamageShare ?? null,
      wardsPlaced: detail?.wardsPlaced ?? null,
      wardsDestroyed: detail?.wardsDestroyed ?? null,
      finalStats: finalStatLine(detail),
      // Zeros are empty slots, not items.
      items: (detail?.items ?? []).filter((id) => id > 0),
      runes: detail?.perkMetadata
        ? {
            primaryStyle: detail.perkMetadata.styleId ?? 0,
            secondaryStyle: detail.perkMetadata.subStyleId ?? 0,
            perks: detail.perkMetadata.perks ?? [],
          }
        : null,
      // Only "Q"/"W"/"E"/"R" mean anything here; anything else the feed invents
      // is dropped rather than rendered as a skill.
      abilities: (detail?.abilities ?? []).filter((key) => ["Q", "W", "E", "R"].includes(key)),
    };
  });

  return {
    side,
    teamId: metadata.esportsTeamId ?? null,
    gold: frame.totalGold ?? 0,
    kills: frame.totalKills ?? 0,
    towers: frame.towers ?? 0,
    inhibitors: frame.inhibitors ?? 0,
    barons: frame.barons ?? 0,
    dragons: frame.dragons ?? [],
    participants,
  };
}

function buildStats(
  windowPayload: WindowPayload,
  detailsPayload: DetailsPayload | null,
  firstFrameAt: string | null
): GameStats | null {
  const frame = windowPayload.frames.at(-1);
  if (!frame) return null;

  const detailFrame = detailsPayload?.frames.at(-1);
  const details = new Map((detailFrame?.participants ?? []).map((p) => [p.participantId, p]));

  return {
    gameId: windowPayload.esportsGameId,
    // "15.20.719.545" — only the first two parts are the patch people know.
    patch: (windowPayload.gameMetadata.patchVersion ?? "").split(".").slice(0, 2).join("."),
    finished: frame.gameState === "finished",
    firstFrameAt,
    lastFrameAt: frame.rfc460Timestamp,
    durationSeconds: elapsedSeconds(firstFrameAt, frame.rfc460Timestamp),
    blue: buildTeam("blue", windowPayload.gameMetadata.blueTeamMetadata, frame.blueTeam, details),
    red: buildTeam("red", windowPayload.gameMetadata.redTeamMetadata, frame.redTeam, details),
  };
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
async function getGameStart(gameId: string): Promise<string | null> {
  return cachedResource({
    key: `game:${gameId}:start`,
    type: CACHE_TYPE,
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
