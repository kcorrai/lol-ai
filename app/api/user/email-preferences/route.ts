import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailOptOut: true },
  });
  return apiSuccess({ emailOptOut: user?.emailOptOut ?? false });
});

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  const body = (await req.json()) as { emailOptOut: boolean };
  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailOptOut: Boolean(body.emailOptOut) },
    select: { emailOptOut: true },
  });
  return apiSuccess({ emailOptOut: user.emailOptOut });
});
