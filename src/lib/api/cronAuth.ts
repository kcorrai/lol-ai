import type { NextRequest } from "next/server";
import { safeEqual } from "@/lib/crypto/encrypt";
import { logger } from "@/lib/utils/logger";

export type CronAuthResult = { ok: true } | { ok: false; status: 401 | 500; message: string };

/**
 * The shared check for every scheduled endpoint.
 *
 * Two things it does that the copies scattered across the cron routes did not.
 * The comparison is constant-time — `!==` on a bearer token returns as soon as it
 * finds a differing byte, which is a usable side channel against a secret an
 * attacker can retry against for free. And there is now one implementation, so a
 * route added later cannot quietly ship a weaker version of it.
 *
 * A missing `CRON_SECRET` is a misconfiguration and fails closed: these endpoints
 * send mass email, spend the Riot API budget and delete rows.
 */
export function checkCronAuth(req: NextRequest): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error("[cron] CRON_SECRET env var is not set — refusing to execute");
    return { ok: false, status: 500, message: "Cron is not configured" };
  }

  const header = req.headers.get("authorization") ?? "";
  if (!safeEqual(header, `Bearer ${cronSecret}`)) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  return { ok: true };
}
