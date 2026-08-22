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
