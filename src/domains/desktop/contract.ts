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
  /**
   * ISO 8601, or null for an address the player has not confirmed.
   *
   * Here because the desktop app renders the website's own dashboard (ADR-043), and the
   * banner on it asks the session whether the address is verified. Without this the app
   * would have to guess, and both guesses are wrong: assume verified and an unverified
   * player never sees the prompt, assume not and every player sees a banner they cannot
   * act on from this window.
   */
  emailVerified: z.string().nullable(),
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

// ── Pairing without a code (ADR-048) ─────────────────────────────────────────
//
// The app asks first and the browser approves, instead of the player carrying an
// eight-character code between the two. Three shapes: what the app asks with,
// what it gets back to open a browser at, and what the approval page is allowed
// to show about the machine asking.

/** What the app sends to ask for a pairing. Note what is absent: any claim at all. */
export const pairingRequestSchema = z.object({
  /**
   * SHA-256 of the secret the app generated, lowercase hex. The secret itself is
   * never sent — the app proves it holds it by presenting it at the claim, and
   * this is the only half the website has any use for.
   */
  secretHash: z.string().regex(/^[0-9a-f]{64}$/),
  /** The machine's hostname. Shown on the approval page and in the device list. */
  label: z.string().min(1).max(64),
  platform: z.enum(DESKTOP_PLATFORMS),
  appVersion: z.string().min(1).max(32).nullable().optional(),
});
export type PairingRequestInput = z.infer<typeof pairingRequestSchema>;

/** What the app gets back: where to send the browser, and how long it has. */
export const openedPairingRequestSchema = z.object({
  requestId: z.string(),
  /**
   * A path on the website, never a URL. The app opens it through `open_on_website`,
   * which refuses anything that could name a host — a pairing flow that could be
   * pointed at another origin is a pairing flow that can be phished.
   */
  approvePath: z.string(),
  expiresAt: z.string(),
});
export type OpenedPairingRequest = z.infer<typeof openedPairingRequestSchema>;

/**
 * What the approval page shows.
 *
 * `label` and `platform` are reported by the machine asking and are therefore
 * display only — the page says so, because a hostname is not an identity and the
 * player is the one being asked to decide.
 */
export const pendingPairingRequestSchema = z.object({
  requestId: z.string(),
  label: z.string(),
  platform: z.enum(DESKTOP_PLATFORMS),
  appVersion: z.string().nullable(),
  requestedAt: z.string(),
  expiresAt: z.string(),
  /** Already dealt with — the page says so rather than offering a second Approve. */
  status: z.enum(["pending", "approved", "expired"]),
});
export type PendingPairingRequest = z.infer<typeof pendingPairingRequestSchema>;

/** What the app polls with. The secret, not the id, is the claim. */
export const claimPairingSchema = z.object({
  secret: z.string().min(32).max(128),
});
export type ClaimPairingInput = z.infer<typeof claimPairingSchema>;

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
 * What this account normally does on the champion it is playing right now.
 *
 * The companion measures the same four things off the Live Client Data API while
 * the game runs, so this is the only half it cannot work out for itself. Ranked
 * solo only — mixing queues would give an average true of no queue — and it
 * always carries `games`, because a number the player cannot size is a number
 * they cannot argue with.
 */
export const liveBaselineSchema = z.object({
  games: z.number(),
  csPerMin: z.number(),
  deaths: z.number(),
  visionScore: z.number(),
  kda: z.number(),
});
export type LiveBaseline = z.infer<typeof liveBaselineSchema>;

/**
 * One goal this player is already working on, from the challenge they were set
 * away from the game. `metric` is what the companion measures live against
 * `targetValue`; anything it cannot measure in a running game is filtered out
 * before it is sent.
 */
export const liveChallengeSchema = z.object({
  id: z.string(),
  metric: z.string(),
  targetValue: z.number(),
  description: z.string(),
});
export type LiveChallenge = z.infer<typeof liveChallengeSchema>;

/** One item, named on the server because the app cannot fetch an icon. */
export const liveItemSchema = z.object({
  id: z.number(),
  /** Resolved against Data Dragon here; empty when the catalogue did not have it. */
  name: z.string(),
});
export type LiveItem = z.infer<typeof liveItemSchema>;

/**
 * How this champion is built on the current patch — the same build the website's own
 * page shows, carried to the machine the game is running on.
 *
 * Names rather than icons, deliberately — but not because the app is forbidden the
 * picture: its content policy admits Data Dragon, and its champion list draws portraits
 * from there. The reason is where the catalogue is. This server already holds it cached,
 * so one read turns the ids into words; the app holds nothing and would have to fetch a
 * catalogue of its own to get back what was thrown away here.
 *
 * This is static advice about a champion, not a reading of the running game — which is
 * what keeps it on the right side of Riot's ban on notifications that dictate play from
 * the game state. It is the same thing the website would tell them before they queued.
 */
export const liveBuildSchema = z.object({
  /** One letter per level, 18 long. Riot's own timeline gives all 18; op.gg gives 15. */
  skillOrder: z.array(z.string()),
  /** Max priority, e.g. ["Q", "W", "E"]. */
  skillMaxOrder: z.array(z.string()),
  starters: z.array(liveItemSchema),
  core: z.array(liveItemSchema),
  boots: z.array(liveItemSchema),
  /** The sample behind the core build. Never rendered without it. */
  games: z.number(),
  winRate: z.number(),
});
export type LiveBuild = z.infer<typeof liveBuildSchema>;

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
  /** Null when this account has not played the champion enough for an average to mean anything. */
  baseline: liveBaselineSchema.nullable(),
  challenges: z.array(liveChallengeSchema),
  /** Null in a mode with no lane to build for, and when the patch snapshot has no entry. */
  build: liveBuildSchema.nullable(),
  /** False means the panels are empty for a reason the player can act on. */
  riotAccountLinked: z.boolean(),
});
export type LiveContext = z.infer<typeof liveContextSchema>;

// ── The post-game handoff (ADR-038, phase 5) ─────────────────────────────────
//
// The one thing the app can tell the website that the website could not work out
// for itself: the game just ended. A server syncs an account when somebody opens
// the dashboard and the data is half an hour stale; the process on the player's
// machine knows to the second.

/**
 * What came of reporting a finished game.
 *
 * Flat rather than a discriminated union, because the Rust core parses it into one
 * struct and a union on the wire would buy nothing there. `riotAccountId` is null
 * only for `no_riot_account`.
 */
export const postGameSchema = z.object({
  status: z.enum(["pending", "already_running", "no_riot_account"]),
  riotAccountId: z.string().nullable(),
});
export type PostGame = z.infer<typeof postGameSchema>;
