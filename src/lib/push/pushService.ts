import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

function getVapidConfig(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:noreply@lolaicoach.gg";

  if (!publicKey || !privateKey) return null;

  return { publicKey, privateKey, subject };
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const vapid = getVapidConfig();
  if (!vapid) {
    logger.warn("[pushService] VAPID keys not configured, skipping push", { userId });
    return;
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) return;

  const body = JSON.stringify(payload);
  const staleIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription expired or unsubscribed — clean up
          staleIds.push(sub.id);
        } else {
          logger.error("[pushService] Push send error", { userId, endpoint: sub.endpoint, err });
        }
      }
    })
  );

  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } });
    logger.info("[pushService] Removed stale push subscriptions", {
      userId,
      count: staleIds.length,
    });
  }
}
