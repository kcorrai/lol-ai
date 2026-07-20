import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Serializes a check-then-write against a single user.
 *
 * Several flows read a count and then insert based on it — the report quota
 * (`assertCanGenerateReport`) and the `isPrimary` decision in `connectAccount`. Without a lock two
 * concurrent requests both read the pre-insert count, both pass, and both write, which quietly
 * defeats the limit. See ADR-011 for why an advisory lock rather than a counter table or
 * `Serializable` isolation.
 */

/**
 * Postgres advisory locks are keyed by a bigint, so the user id has to be hashed down to one.
 *
 * The hash is computed here rather than with Postgres's `hashtext()` because that function is an
 * undocumented internal — its output is not guaranteed stable across major versions, and a key that
 * changes underneath us would silently stop excluding anything.
 */
export function userLockKey(userId: string): bigint {
  return createHash("sha256").update(userId).digest().readBigInt64BE(0);
}

/**
 * Runs `fn` inside a transaction that holds an exclusive advisory lock on `userId`.
 *
 * The lock is released when the transaction ends (`_xact_` variant), including on rollback, so a
 * thrown callback cannot strand it. Contention is per user: two requests from different users never
 * wait on each other.
 *
 * Keep the callback short — anything slow and unrelated (API calls, data preparation) belongs
 * outside, or it holds the lock and a database connection for its whole duration.
 */
export async function withUserLock<T>(
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userLockKey(userId)}::bigint)`;
    return fn(tx);
  });
}
