import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { audit } from "@/lib/audit/auditService";

interface DeletionPayload {
  userId: string;
  deletionScheduledAt: string;
}

export const gdprErasure = inngest.createFunction(
  {
    id: "gdpr-erasure",
    triggers: [{ event: "account/deletion.scheduled" }],
    retries: 3,
  },
  async ({ event }) => {
    const { userId } = event.data as DeletionPayload;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileSettings: true },
    });

    if (!user) {
      logger.warn("[gdprErasure] User not found", { userId });
      return { skipped: "user_not_found" };
    }

    // Check if deletion was cancelled (user reactivated their account)
    const settings = user.profileSettings as Record<string, unknown> | null;
    if (!settings?.deletionScheduledAt) {
      logger.info("[gdprErasure] Deletion cancelled", { userId });
      return { skipped: "deletion_cancelled" };
    }

    // Record completion audit before nulling userId
    await audit({
      userId,
      action: "data.deletion.completed",
      metadata: { reason: "gdpr_erasure" },
    }).catch(() => { /* best effort */ });

    // Hard delete — cascade constraints handle related records
    await prisma.user.delete({ where: { id: userId } });

    logger.info("[gdprErasure] User deleted", { userId });
    return { deleted: true, userId };
  }
);
