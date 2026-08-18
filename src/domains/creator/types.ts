import type { RankDivision, RankTier } from "@prisma/client";

// The shape served to an OBS Browser Source. One payload feeds every widget, so
// a scene with four sources still costs one poll (ADR-026).
//
// Everything here has already passed through the delay and the stream-safe
// redaction. There is no raw variant — the widgets never see one.

export const OVERLAY_WIDGETS = ["rank", "session", "lastgame", "champions", "goal"] as const;

export type OverlayWidget = (typeof OVERLAY_WIDGETS)[number];

export function isOverlayWidget(value: string): value is OverlayWidget {
  return (OVERLAY_WIDGETS as readonly string[]).includes(value);
}

export const CHAT_COMMANDS = ["rank", "session", "lastgame", "champs", "laneiq"] as const;

export type ChatCommand = (typeof CHAT_COMMANDS)[number];

export function isChatCommand(value: string): value is ChatCommand {
  return (CHAT_COMMANDS as readonly string[]).includes(value);
}

export interface OverlayIdentity {
  /** Null when stream-safe mode is on and no display name was set. */
  name: string | null;
  region: string;
  redacted: boolean;
}

export interface OverlayRank {
  tier: RankTier;
  division: RankDivision;
  lp: number;
  /** "Emerald II" */
  label: string;
  /** LP gained or lost since the session started. Null when there is nothing to compare to. */
  sessionLpDelta: number | null;
}

export interface OverlaySession {
  wins: number;
  losses: number;
  games: number;
  /** 0..100, rounded. Null when no games have been played this session. */
  winRate: number | null;
  kills: number;
  deaths: number;
  assists: number;
  /** Null when no games have been played this session. */
  kda: number | null;
  startedAt: string;
}

export interface OverlayLastGame {
  championId: number;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  csPerMinute: number;
  durationSeconds: number;
  queueLabel: string;
  endedAt: string;
}

export interface OverlayChampion {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  /** 0..100, rounded. */
  winRate: number;
  kda: number;
}

export interface OverlayGoal {
  tier: RankTier;
  division: RankDivision;
  label: string;
  /** 0..1. */
  progress: number;
  /** LP still to gain. Zero once the goal is reached. */
  lpRemaining: number;
}

export interface OverlayPayload {
  identity: OverlayIdentity;
  /** Null before the first ranked game of the season is synced. */
  rank: OverlayRank | null;
  session: OverlaySession;
  /** Null when no game has finished, or none is old enough to show under the delay. */
  lastGame: OverlayLastGame | null;
  champions: OverlayChampion[];
  /** Null when the creator has set no goal. */
  goal: OverlayGoal | null;
  theme: string;
  accentColor: string;
  /** Echoed back so a widget can say it is delayed rather than looking stale. */
  delaySeconds: number;
  /** When this payload was computed — already shifted by the delay. */
  asOf: string;
}

export interface CreatorSettings {
  enabled: boolean;
  riotAccountId: string | null;
  displayName: string | null;
  streamSafe: boolean;
  delaySeconds: number;
  theme: string;
  accentColor: string;
  goalTier: RankTier | null;
  goalDivision: RankDivision | null;
  twitchHandle: string | null;
  kickHandle: string | null;
  youtubeHandle: string | null;
}

export interface CreatorKit extends CreatorSettings {
  overlayKey: string;
  sessionStartedAt: string | null;
}
