import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { rememberSessionVersion } from "@/lib/auth/sessionVersion";
import { z } from "zod";

// GET /api/sessions — list active sessions for the current user
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  // Upsert the current session's user-agent/ip on every list call
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  const sessions = await prisma.userSession.findMany({
    where: { userId },
    orderBy: { lastActiveAt: "desc" },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });

  // Update the most-recent session's metadata if it matches this UA
  const latest = sessions[0];
  if (latest) {
    await prisma.userSession
      .update({
        where: { id: latest.id },
        data: {
          userAgent: userAgent ?? latest.userAgent,
          ipAddress: ip ?? latest.ipAddress,
          lastActiveAt: new Date(),
        },
      })
      .catch(() => {
        /* non-critical */
      });
  }

  return apiSuccess(sessions);
});

const deleteSchema = z.object({ sessionId: z.string().uuid().optional() });

// DELETE /api/sessions — sign out a specific session or all sessions
// Body: { sessionId } for a single session, empty body for all sessions
export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  const { sessionId } = parsed.data;

  if (sessionId) {
    // Verify ownership before deleting
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });
    if (!session || session.userId !== userId) throw Errors.notFound("Session");

    await prisma.userSession.delete({ where: { id: sessionId } });
    return apiSuccess({ revoked: 1 });
  }

  // Sign out all devices: delete all sessions and bump sessionVersion
  const [deleted, revoked] = await prisma.$transaction([
    prisma.userSession.deleteMany({ where: { userId } }),
    prisma.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } }),
  ]);

  // After the transaction commits, never inside it: publishing a version the transaction then
  // rolled back would sign the user out of devices they still hold.
  await rememberSessionVersion(userId, revoked.sessionVersion);

  return apiSuccess({ revoked: deleted.count });
});
