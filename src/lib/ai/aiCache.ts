import { createHash } from "crypto";
import { prisma } from "@/lib/db/prisma";

export async function getCached(cacheKey: string): Promise<unknown | null> {
  const entry = await prisma.aiCache.findUnique({ where: { cacheKey } });
  if (!entry) return null;
  if (entry.expiresAt < new Date()) return null;

  // Fire-and-forget hit count increment
  prisma.aiCache
    .update({ where: { cacheKey }, data: { hitCount: { increment: 1 } } })
    .catch(() => undefined);

  return entry.content;
}

export async function setCached(
  cacheKey: string,
  type: string,
  content: unknown,
  ttlDays: number
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  await prisma.aiCache.upsert({
    where: { cacheKey },
    create: { cacheKey, type, content: content as object, expiresAt },
    update: { content: content as object, expiresAt, hitCount: 0 },
  });
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
