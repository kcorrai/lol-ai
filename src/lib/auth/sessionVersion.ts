import { prisma } from "@/lib/db/prisma";
import { redisCacheGet, redisCacheSet } from "@/lib/cache/redisCache";

/**
 * The `sessionVersion` check, without a Postgres round trip on every request.
 *
 * The JWT callback compares the token's version against the row's on *every* read, which is
 * what makes "sign out all devices" and a password reset take effect on the intruder's next
 * request rather than in thirty days. 131 API routes and the whole `(app)` layout go through
 * `getServerSession`, so that comparison is the one database call an authenticated request
 * cannot avoid — for an integer that changes perhaps twice in an account's lifetime.
 *
 * ### The window, stated plainly
 *
 * Any cache in front of a revocation check buys speed with a window in which a revoked
 * session still works. This one is kept to a floor rather than a ceiling:
 *
 * - Both writers **write the new version through** (`rememberSessionVersion`), so a normal
 *   revocation is visible to the very next request. There is no window in the expected case.
 * - The window only opens if that write-through fails — Upstash unreachable — and then it is
 *   bounded by `TTL_SECONDS` below rather than by anything unbounded.
 *
 * Thirty seconds is chosen against what it is protecting: long enough that a busy session's
 * many requests share one read, short enough that the degraded case is measured in seconds.
 * It is deliberately not minutes.
 *
 * ### Failure is a miss, never a pass
 *
 * `redisCacheGet` reports an unreachable Redis as a miss, so every failure here falls through
 * to Postgres and the check stays exact. The one thing this module must never do is answer
 * "no revocation" because it could not find out — which is why the Postgres read below has no
 * catch of its own. See ADR-045 for what a charitable catch on a cache read cost us last time.
 */

const TTL_SECONDS = 30;

function cacheKey(userId: string): string {
  return `auth:session-version:${userId}`;
}

/**
 * The account's current session version, or null when there is no such row.
 *
 * Null is not "zero": the caller treats a missing user as nothing to revoke, which is the
 * behaviour the direct Prisma read had.
 */
export async function getSessionVersion(userId: string): Promise<number | null> {
  const cached = await redisCacheGet(cacheKey(userId));
  // Upstash round-trips through JSON, so an integer can come back as a string. Anything that
  // is not a whole number is treated as absent rather than coerced — a half-parsed value
  // deciding whether a session lives is the failure mode this guard exists for.
  const parsed = typeof cached === "number" || typeof cached === "string" ? Number(cached) : NaN;
  if (Number.isInteger(parsed)) return parsed;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true },
  });
  if (!user) return null;

  await rememberSessionVersion(userId, user.sessionVersion);
  return user.sessionVersion;
}

/**
 * Publish a version everyone should see from now on.
 *
 * Called by both revocation paths immediately after their own `increment`, with the value that
 * write returned. `redisCacheSet` swallows its own failures, so this cannot turn a completed
 * revocation into a failed request — it can only leave the old value to expire on its TTL.
 */
export async function rememberSessionVersion(userId: string, version: number): Promise<void> {
  await redisCacheSet(cacheKey(userId), version, TTL_SECONDS);
}
