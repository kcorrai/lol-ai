import { prismaReadonly } from "@/lib/db/prismaReadonly";
import crypto from "crypto";

export interface FeatureFlagResult {
  enabled: boolean;
  variant: "control" | "treatment";
}

// Deterministic bucket assignment: same userId+key always returns same bucket.
// Uses HMAC-SHA256 to evenly distribute users.
function getBucket(userId: string, key: string): number {
  const hash = crypto.createHmac("sha256", key).update(userId).digest("hex");
  return parseInt(hash.slice(0, 8), 16) % 100;
}

export async function getFeatureFlag(
  key: string,
  userId: string,
  userPlan?: string
): Promise<FeatureFlagResult> {
  const flag = await prismaReadonly.featureFlag.findUnique({ where: { key } });

  if (!flag || !flag.enabled) return { enabled: false, variant: "control" };

  // Segment check
  const segments = flag.userSegment as string[];
  if (!segments.includes("all") && userPlan && !segments.includes(userPlan)) {
    return { enabled: false, variant: "control" };
  }

  // Rollout percentage check
  const bucket = getBucket(userId, key);
  if (bucket >= flag.rolloutPercentage) return { enabled: false, variant: "control" };

  return { enabled: true, variant: "treatment" };
}

// Batch lookup for multiple flags (avoids N queries)
export async function getFeatureFlags(
  keys: string[],
  userId: string,
  userPlan?: string
): Promise<Record<string, FeatureFlagResult>> {
  const flags = await prismaReadonly.featureFlag.findMany({
    where: { key: { in: keys }, enabled: true },
  });

  const result: Record<string, FeatureFlagResult> = {};

  for (const key of keys) {
    result[key] = { enabled: false, variant: "control" };
  }

  for (const flag of flags) {
    const segments = flag.userSegment as string[];
    if (!segments.includes("all") && userPlan && !segments.includes(userPlan)) continue;

    const bucket = getBucket(userId, flag.key);
    if (bucket < flag.rolloutPercentage) {
      result[flag.key] = { enabled: true, variant: "treatment" };
    }
  }

  return result;
}
