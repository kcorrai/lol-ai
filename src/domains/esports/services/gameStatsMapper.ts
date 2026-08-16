import { z } from "zod";
import { elapsedSeconds } from "@/domains/esports/duration";
import type {
  FinalStatLine,
  GameParticipant,
  GameStats,
  GameTeamStats,
  PlayerRole,
} from "@/domains/esports/types";

// Where the livestats payloads stop being Riot's shape and start being ours.
// Split out of `gameStatsService` when that file passed the 250-line service
// limit: the service decides what to fetch and how long to keep it, this decides
// what the answer means. The Zod boundary ADR-016 requires lives here.

const ROLES: readonly string[] = ["top", "jungle", "mid", "bottom", "support"];

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

export const WindowSchema = z.object({
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

export const DetailsSchema = z.object({
  frames: z.array(
    z.object({
      rfc460Timestamp: z.string(),
      participants: z.array(DetailsParticipantSchema),
    })
  ),
});

/** The opening window, read only for its first timestamp. */
export const GameStartSchema = z.object({
  frames: z.array(z.object({ rfc460Timestamp: z.string() })),
});

export type WindowPayload = z.infer<typeof WindowSchema>;
export type DetailsPayload = z.infer<typeof DetailsSchema>;

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

export function buildStats(
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
