import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailOptOut: true },
  });
  return apiSuccess({ emailOptOut: user?.emailOptOut ?? false });
});

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  // Guarded and type-checked: an unparseable body threw a 500, and a non-boolean was
  // coerced — `"false"` is truthy, so opting out could silently opt you in.
  const body = (await req.json().catch(() => null)) as { emailOptOut?: unknown } | null;
  if (typeof body?.emailOptOut !== "boolean") {
    throw Errors.validation("emailOptOut must be a boolean");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailOptOut: body.emailOptOut },
    select: { emailOptOut: true },
  });
  return apiSuccess({ emailOptOut: user.emailOptOut });
});
