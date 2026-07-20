import { createHash } from "crypto";
import { prisma } from "@/lib/db/prisma";

export async function getCached(cacheKey: string): Promise<unknown | null> {
  // Projected: the row also carries id/type/hitCount/createdAt, and `content`
  // here can be a multi-hundred-KB meta snapshot. Every byte crosses the network
  // from Neon, so only the two fields the caller needs are selected (TASK-282).
  const entry = await prisma.aiCache.findUnique({
    where: { cacheKey },
    select: { content: true, expiresAt: true },
  });
  if (!entry) return null;
  if (entry.expiresAt < new Date()) return null;

  // Deliberately no hitCount increment. It used to fire on every read, which
  // turned each cache *hit* into an extra write round trip — the exact opposite
  // of what a cache is for, and a meaningful slice of the egress that exhausted
  // the Neon transfer quota. incrementHit() remains for callers that genuinely
  // want the telemetry.
  return entry.content;
}

export async function setCached(
  cacheKey: string,
  type: string,
  content: unknown,
  ttlDays: number
): Promise<void> {
  // Millisecond-based so sub-day TTLs (e.g. 0.5 for a 12h cache) are honoured.
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await prisma.aiCache.upsert({
    where: { cacheKey },
    create: { cacheKey, type, content: content as object, expiresAt },
    update: { content: content as object, expiresAt, hitCount: 0 },
  });
}

export async function deleteCached(cacheKey: string): Promise<void> {
  await prisma.aiCache.deleteMany({ where: { cacheKey } }).catch(() => undefined);
}

export async function incrementHit(cacheKey: string): Promise<void> {
  await prisma.aiCache
    .update({ where: { cacheKey }, data: { hitCount: { increment: 1 } } })
    .catch(() => undefined);
}

export function buildCacheKey(
  type: string,
  inputs: Record<string, string>
): string {
  // Sort keys so key-order differences produce the same hash
  const sorted = Object.keys(inputs)
    .sort()
    .reduce<Record<string, string>>((acc, k) => {
      acc[k] = inputs[k].toLowerCase().trim();
      return acc;
    }, {});

  const payload = `${type}:${JSON.stringify(sorted)}`;
  return createHash("sha256").update(payload).digest("hex");
}
