import { computeKDA } from "@/lib/kda";
import type { CreatorProfile, Prisma, RankDivision, RankTier } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requestSyncIfStale } from "@/domains/riot/services/syncFreshness";
import { absoluteLp, formatRank, lpDelta, progressToward } from "@/domains/creator/lp";
import { resolveIdentity } from "@/domains/creator/redaction";
import { resolveSessionWindow, type SessionWindow } from "@/domains/creator/session";
import type {
  OverlayChampion,
  OverlayGoal,
  OverlayLastGame,
  OverlayPayload,
  OverlayRank,
  OverlaySession,
} from "@/domains/creator/types";

// Assembles the payload an OBS Browser Source polls.
//
// Everything the delay and the redaction touch happens here, on the server. A
// widget never receives a Riot ID it must not print, or a game it must not show
// yet (ADR-026).

const QUEUE = "RANKED_SOLO_5x5" as const;
const CHAMPION_LIMIT = 5;
const MIN_CHAMPION_GAMES = 1;

type ProfileWithAccount = CreatorProfile & {
  user: { profile: { timezone: string } | null; riotAccounts: RiotAccountRow[] };
};

interface RiotAccountRow {
  id: string;
  region: string;
  gameName: string;
  tagLine: string;
  isPrimary: boolean;
}

export interface OverlayLookup {
  payload: OverlayPayload;
  /** Exposed so the chat endpoints can reuse the same resolution. */
  window: SessionWindow;
}

/**
 * Resolve the account the overlay reads.
 *
 * A null `riotAccountId` means "whichever is primary", so a creator who relinks
 * or swaps their main does not have to come back and re-point the kit. If the
 * chosen account is gone, the primary is still better than nothing.
 */
function pickAccount(profile: ProfileWithAccount): RiotAccountRow | null {
  const accounts = profile.user.riotAccounts;
  if (profile.riotAccountId) {
    const chosen = accounts.find((a) => a.id === profile.riotAccountId);
    if (chosen) return chosen;
  }
  return accounts.find((a) => a.isPrimary) ?? accounts[0] ?? null;
}

async function rankAt(riotAccountId: string, at: Date) {
  return prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType: QUEUE, recordedAt: { lte: at } },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });
}

async function buildRank(
  riotAccountId: string,
  window: SessionWindow
): Promise<OverlayRank | null> {
  const current = await rankAt(riotAccountId, window.visibleUntil);
  if (!current) return null;

  // The snapshot as it stood when the session opened. Absent for a creator whose
  // first ever ranked game is this session, in which case there is nothing to
  // subtract and the widget shows no delta rather than a misleading zero.
  const atStart = await rankAt(riotAccountId, window.start);

  return {
    tier: current.tier,
    division: current.division,
    lp: current.lp,
    label: formatRank(current.tier, current.division),
    sessionLpDelta: atStart ? lpDelta(atStart, current) : null,
  };
}

const SESSION_PARTICIPANT_SELECT = {
  kills: true,
  deaths: true,
  assists: true,
  won: true,
} satisfies Prisma.MatchParticipantSelect;

async function buildSession(riotAccountId: string, window: SessionWindow): Promise<OverlaySession> {
  const participants = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
      match: {
        queueType: QUEUE,
        // Both bounds matter. The lower one is the session; the upper one is the
        // broadcast delay, and without it a win appears on the overlay before
        // the video shows the game ending.
        gameEnd: { gte: window.start, lte: window.visibleUntil },
      },
    },
    select: SESSION_PARTICIPANT_SELECT,
  });

  const wins = participants.filter((p) => p.won).length;
  const kills = participants.reduce((sum, p) => sum + p.kills, 0);
  const deaths = participants.reduce((sum, p) => sum + p.deaths, 0);
  const assists = participants.reduce((sum, p) => sum + p.assists, 0);
  const games = participants.length;

  return {
    wins,
    losses: games - wins,
    games,
    winRate: games > 0 ? Math.round((wins / games) * 100) : null,
    kills,
    deaths,
    assists,
    kda: games > 0 ? computeKDA(kills, deaths, assists) : null,
    startedAt: window.start.toISOString(),
  };
}

function queueLabel(queueType: string): string {
  if (queueType === "RANKED_SOLO_5x5") return "Ranked Solo";
  if (queueType === "RANKED_FLEX_SR") return "Ranked Flex";
  return queueType.replace(/_/g, " ").toLowerCase();
}

async function buildLastGame(
  riotAccountId: string,
  window: SessionWindow
): Promise<OverlayLastGame | null> {
  const participant = await prisma.matchParticipant.findFirst({
    where: { riotAccountId, match: { gameEnd: { lte: window.visibleUntil } } },
    orderBy: { match: { gameEnd: "desc" } },
    select: {
      championId: true,
      championName: true,
      kills: true,
      deaths: true,
      assists: true,
      csPerMinute: true,
      won: true,
      match: { select: { gameDuration: true, gameEnd: true, queueType: true } },
    },
  });
  if (!participant) return null;

  return {
    championId: participant.championId,
    championName: participant.championName,
    win: participant.won,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    csPerMinute: Number(participant.csPerMinute),
    durationSeconds: participant.match.gameDuration,
    queueLabel: queueLabel(participant.match.queueType),
    endedAt: participant.match.gameEnd.toISOString(),
  };
}

async function buildChampions(riotAccountId: string): Promise<OverlayChampion[]> {
  const stats = await prisma.championStat.findMany({
    where: { riotAccountId, queueType: QUEUE, gamesPlayed: { gte: MIN_CHAMPION_GAMES } },
    orderBy: { gamesPlayed: "desc" },
    take: CHAMPION_LIMIT,
    select: {
      championId: true,
      gamesPlayed: true,
      wins: true,
      avgKda: true,
      champion: { select: { name: true } },
    },
  });

  return stats.map((stat) => ({
    championId: stat.championId,
    championName: stat.champion.name,
    games: stat.gamesPlayed,
    wins: stat.wins,
    winRate: stat.gamesPlayed > 0 ? Math.round((stat.wins / stat.gamesPlayed) * 100) : 0,
    kda: Number(stat.avgKda),
  }));
}

/**
 * The climb bar.
 *
 * Progress is measured from where the creator started the season's session
 * rather than from Iron IV, so a Diamond player chasing Master does not see a
 * bar that is 95% full before they begin.
 */
function buildGoal(
  rank: OverlayRank | null,
  goalTier: RankTier | null,
  goalDivision: RankDivision | null,
  from: { tier: RankTier; division: RankDivision; lp: number } | null
): OverlayGoal | null {
  if (!rank || !goalTier || !goalDivision) return null;

  const current = { tier: rank.tier, division: rank.division, lp: rank.lp };
  const goal = { tier: goalTier, division: goalDivision, lp: 0 };
  const start = from ?? current;

  return {
    tier: goalTier,
    division: goalDivision,
    label: formatRank(goalTier, goalDivision),
    progress: progressToward(current, goal, start),
    lpRemaining: Math.max(0, absoluteLp(goal) - absoluteLp(current)),
  };
}

/**
 * Load the whole overlay payload for a key.
 *
 * Returns null for an unknown or disabled key, and for a creator with no linked
 * Riot account — all three are a 404 to the caller, so an unknown key cannot be
 * told apart from a disabled one.
 */
export async function getOverlayPayload(
  overlayKey: string,
  now: Date = new Date()
): Promise<OverlayLookup | null> {
  const profile = (await prisma.creatorProfile.findUnique({
    where: { overlayKey },
    include: {
      user: {
        select: {
          profile: { select: { timezone: true } },
          riotAccounts: {
            select: {
              id: true,
              region: true,
              gameName: true,
              tagLine: true,
              isPrimary: true,
            },
          },
        },
      },
    },
  })) as ProfileWithAccount | null;

  if (!profile || !profile.enabled) return null;

  const account = pickAccount(profile);
  if (!account) return null;

  const window = resolveSessionWindow({
    sessionStartedAt: profile.sessionStartedAt,
    timezone: profile.user.profile?.timezone ?? "UTC",
    delaySeconds: profile.delaySeconds,
    now,
  });

  // Fire-and-forget. The current poll answers from what is already stored; the
  // refresh lands in time for the next one, thirty seconds later.
  void requestSyncIfStale(account.id, profile.userId, now).catch(() => undefined);

  const [rank, session, lastGame, champions, sessionStartRank] = await Promise.all([
    buildRank(account.id, window),
    buildSession(account.id, window),
    buildLastGame(account.id, window),
    buildChampions(account.id),
    rankAt(account.id, window.start),
  ]);

  const identity = resolveIdentity({
    streamSafe: profile.streamSafe,
    displayName: profile.displayName,
    gameName: account.gameName,
    tagLine: account.tagLine,
  });

  const payload: OverlayPayload = {
    identity: {
      name: identity.name,
      region: account.region,
      redacted: identity.redacted,
    },
    rank,
    session,
    lastGame,
    champions,
    goal: buildGoal(rank, profile.goalTier, profile.goalDivision, sessionStartRank),
    theme: profile.theme,
    accentColor: profile.accentColor,
    delaySeconds: profile.delaySeconds,
    asOf: window.visibleUntil.toISOString(),
  };

  return { payload, window };
}
