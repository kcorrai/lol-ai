import { z } from "zod";

// The wire contract between the website and the desktop companion (ADR-038, K6).
//
// It lives here, in the website's tree, and the desktop app imports it by relative
// path — no package, no codegen, no npm workspace. The Rust core mirrors these
// shapes by hand because the pairing exchange happens in Rust, not the webview:
// the device token must never cross into a browser context. A Rust test asserts
// the JSON shape against the same field names, which is what keeps the mirror
// honest.

export const DESKTOP_PLATFORMS = ["windows", "macos", "linux"] as const;
export type DesktopPlatform = (typeof DESKTOP_PLATFORMS)[number];

/** What the app sends when it redeems a pairing code. */
export const pairRequestSchema = z.object({
  /** As typed. The server normalises separators and case, so "abcd-efgh" is fine. */
  code: z.string().min(1).max(32),
  /** The machine's hostname. What the player will see in their device list. */
  label: z.string().min(1).max(64),
  platform: z.enum(DESKTOP_PLATFORMS),
  /** Null from a client too old to report it — not a reason to refuse the pairing. */
  appVersion: z.string().min(1).max(32).nullable().optional(),
});
export type PairRequest = z.infer<typeof pairRequestSchema>;

/**
 * A paired machine, as the player sees it. Deliberately has no `token` field:
 * the token is returned exactly once, by the exchange that mints it, and this
 * shape is what every *other* endpoint answers with.
 */
export const desktopDeviceSchema = z.object({
  id: z.string(),
  label: z.string(),
  platform: z.enum(DESKTOP_PLATFORMS),
  appVersion: z.string().nullable(),
  createdAt: z.string(),
  lastSeenAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
});
export type DesktopDeviceSummary = z.infer<typeof desktopDeviceSchema>;

/**
 * Who the paired machine is acting as.
 *
 * The Riot account is the one the app reads for everything personal. Null means
 * the player has not linked one yet — a real state the app must say out loud
 * rather than showing an empty dashboard.
 */
export const desktopAccountSchema = z.object({
  userId: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  riotAccount: z
    .object({
      id: z.string(),
      gameName: z.string(),
      tagLine: z.string(),
      region: z.string(),
      summonerLevel: z.number(),
      profileIconId: z.number(),
    })
    .nullable(),
});
export type DesktopAccount = z.infer<typeof desktopAccountSchema>;

/** The one response that carries the token. */
export const pairResponseSchema = z.object({
  token: z.string(),
  device: desktopDeviceSchema,
  account: desktopAccountSchema,
});
export type PairResponse = z.infer<typeof pairResponseSchema>;

/** What `GET /api/desktop/me` answers. */
export const desktopMeSchema = z.object({
  device: desktopDeviceSchema,
  account: desktopAccountSchema,
});
export type DesktopMe = z.infer<typeof desktopMeSchema>;

/** What the website hands the player to type into the app. */
export const pairingCodeSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
});
export type IssuedPairingCode = z.infer<typeof pairingCodeSchema>;

// ── The live dashboard (ADR-038, phase 4) ────────────────────────────────────
//
// The app reads the game on the player's own machine and the website reads the
// player's account; neither half is worth much alone. This is the request that
// joins them: the app says what it can see, and the website answers with what it
// knows about the account playing it.
//
// Nothing here is derived from the game the app could not already see on its own
// screen, which is the line ADR-038 draws around what this product reads.

/** What the app can see of the game it is watching. */
export const liveContextRequestSchema = z.object({
  /** The player's champion, as the Live Client Data API spells it — "Lee Sin". */
  championName: z.string().min(1).max(32),
  /**
   * The lane opponent. Null is routine, not an error: the client leaves `position`
   * empty for every ARAM player and for anyone it has not resolved a lane for, and
   * a lane nobody can name has no opponent to name either.
   */
  opponentChampionName: z.string().min(1).max(32).nullable(),
  /** As the client publishes it. Empty and unrecognised both arrive here as null. */
  position: z.string().min(1).max(16).nullable(),
  gameMode: z.string().min(1).max(32),
});
export type LiveContextRequest = z.infer<typeof liveContextRequestSchema>;

/** A champion both sides agree on: resolved against Data Dragon, never as typed. */
export const liveChampionSchema = z.object({
  /** The Data Dragon id — "MonkeyKing" — which is what every other service keys on. */
  key: z.string(),
  name: z.string(),
});

/** This account's own record in this matchup. Null when it has never played it. */
export const livePersonalMatchupSchema = z.object({
  games: z.number(),
  wins: z.number(),
  winRate: z.number(),
  avgKda: z.number(),
  trend: z.enum(["improving", "declining", "stable", "insufficient_data"]),
});
export type LivePersonalMatchup = z.infer<typeof livePersonalMatchupSchema>;

/** What the patch-current snapshot says about the same matchup, for everyone. */
export const liveMetaMatchupSchema = z.object({
  position: z.string(),
  patch: z.string(),
  /** The player's champion's win rate into the opponent, 0-100. */
  winRate: z.number(),
  games: z.number(),
  verdict: z.enum(["favored", "even", "unfavored"]),
  hints: z.array(z.string()),
});
export type LiveMetaMatchup = z.infer<typeof liveMetaMatchupSchema>;

/** One recurring weakness, already detected from this account's own matches. */
export const liveHabitSchema = z.object({
  habitType: z.string(),
  displayName: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  message: z.string(),
});
export type LiveHabit = z.infer<typeof liveHabitSchema>;

/**
 * What the website knows about the game the app is watching.
 *
 * Every field that can be absent is nullable rather than defaulted, because the
 * app renders "we do not know this" differently from a number — and a plausible
 * number the player cannot tell is invented is worse than an empty panel.
 */
export const liveContextSchema = z.object({
  champion: liveChampionSchema.nullable(),
  opponent: liveChampionSchema.nullable(),
  personal: livePersonalMatchupSchema.nullable(),
  meta: liveMetaMatchupSchema.nullable(),
  habits: z.array(liveHabitSchema),
  /** False means the panels are empty for a reason the player can act on. */
  riotAccountLinked: z.boolean(),
});
export type LiveContext = z.infer<typeof liveContextSchema>;
