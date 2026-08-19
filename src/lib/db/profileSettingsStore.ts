import type { Prisma } from "@prisma/client";
import { withUserLock } from "@/lib/db/userLock";
import { prisma } from "@/lib/db/prisma";

/**
 * `User.profileSettings` is one JSON column shared by three unrelated features:
 * the public-profile visibility toggles (`showRank`, `showWR`, `showBadges`,
 * `showChampions`), the pending GDPR erasure (`deletionScheduledAt`,
 * `deletionRequestedAt`) and the 2FA challenge stamp (`totpVerifiedAt`).
 *
 * Every writer used to assign the column outright, so each one silently deleted
 * the other two features' keys. The consequences were real in both directions:
 * requesting account deletion reset a user's privacy toggles back to their
 * defaults — which are *public* — and any later settings change or 2FA challenge
 * wiped `deletionScheduledAt`, which is the only thing `gdprErasure` looks at
 * before deciding the erasure was cancelled. A user could ask to be deleted, tick
 * one checkbox, and never be deleted.
 *
 * Reading and writing the column only through here makes every write a merge.
 */
export type ProfileSettingsPatch = Record<string, string | number | boolean | null>;

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

export async function readProfileSettings(
  userId: string
): Promise<Record<string, unknown>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileSettings: true },
  });
  return asRecord(user?.profileSettings ?? null);
}

/**
 * Merges `patch` into the stored object. A `null` value deletes its key, so a
 * caller can cancel a pending deletion without having to know what else is in
 * there.
 *
 * The read and the write run under the user's advisory lock: this is a
 * read-modify-write on a single row, and two concurrent settings changes would
 * otherwise lose one of them.
 */
export async function mergeProfileSettings(
  userId: string,
  patch: ProfileSettingsPatch
): Promise<void> {
  await withUserLock(userId, async (tx) => {
    const current = await tx.user.findUnique({
      where: { id: userId },
      select: { profileSettings: true },
    });

    const next = asRecord(current?.profileSettings ?? null);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) delete next[key];
      else next[key] = value;
    }

    await tx.user.update({
      where: { id: userId },
      data: { profileSettings: next as Prisma.InputJsonValue },
    });
  });
}
