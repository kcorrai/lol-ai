import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation("Invalid push subscription payload");

  const { endpoint, keys } = parsed.data;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Scoped to the caller. The upsert reassigned `userId`, so posting somebody else's
  // endpoint moved their device onto your account: their browser then received your
  // notifications, and they stopped receiving their own. Re-registering your own
  // endpoint still works, which is the case this route actually exists for.
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint },
    select: { userId: true },
  });

  if (existing && existing.userId !== userId) {
    throw Errors.forbidden("That push endpoint belongs to another account");
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    update: { p256dh: keys.p256dh, auth: keys.auth, userAgent },
  });

  return apiSuccess({ subscribed: true });
});
