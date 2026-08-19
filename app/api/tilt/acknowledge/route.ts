import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// POST /api/tilt/acknowledge — marks a tilt alert as acknowledged
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = (await req.json().catch(() => null)) as { alertId?: string } | null;
  if (!body?.alertId) throw Errors.validation("alertId is required");

  const alert = await prisma.tiltAlert.findUnique({ where: { id: body.alertId } });
  if (!alert) throw Errors.notFound("TiltAlert");
  if (alert.userId !== userId) throw Errors.forbidden();

  await prisma.tiltAlert.update({
    where: { id: body.alertId },
    data: { acknowledged: true },
  });

  return apiSuccess({ acknowledged: true });
});
