import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/utils/logger";

// The three Riot events worth waking someone for (LA-126).
//
// Each one is a whole-site problem rather than one visitor's: an application-wide 429 is how a key
// walks towards a blacklist, a rejected key means every Riot-backed page is down, and a failed
// shared counter means every instance is spending the budget on its own again (ADR-056). Nothing
// else about Riot belongs in Sentry — a missing player or one throttled visitor is normal traffic.
//
// Sentry's free plan counts events, and these arrive in bursts — one per request while the
// condition lasts — so each kind is reported at most once per scope per window from any one
// instance. The count that matters is "it is happening", not how many requests saw it.

export type RiotAlarm = "app-rate-limited" | "key-rejected" | "shared-counter-down";

const LEVEL: Record<RiotAlarm, Sentry.SeverityLevel> = {
  "app-rate-limited": "warning",
  "key-rejected": "fatal",
  "shared-counter-down": "error",
};

const MESSAGE: Record<RiotAlarm, string> = {
  "app-rate-limited": "Riot answered an application-wide 429 — the key is being throttled",
  "key-rejected": "Riot refused the API key (401/403) — expired, revoked or blacklisted",
  "shared-counter-down":
    "The shared Riot rate-limit counter is unreachable — counting per instance",
};

export const ALARM_WINDOW_MS = 10 * 60 * 1000;

const lastSent = new Map<string, number>();

/** Report `alarm` for `scope` unless this instance already did within the window. */
export function raiseRiotAlarm(
  alarm: RiotAlarm,
  scope: string,
  extra: Record<string, unknown> = {},
  now: number = Date.now()
): boolean {
  const key = `${alarm}:${scope}`;
  const last = lastSent.get(key);
  if (last !== undefined && now - last < ALARM_WINDOW_MS) return false;
  lastSent.set(key, now);

  logger.error(`[riot] ${MESSAGE[alarm]}`, { scope, ...extra });
  Sentry.captureMessage(MESSAGE[alarm], {
    level: LEVEL[alarm],
    // One issue per alarm and region, however many requests hit it.
    fingerprint: ["riot-alarm", alarm, scope],
    tags: { riot_alarm: alarm, riot_scope: scope },
    extra,
  });
  return true;
}

/** Test seam: the throttle lives for the process. */
export function resetRiotAlarms(): void {
  lastSent.clear();
}
