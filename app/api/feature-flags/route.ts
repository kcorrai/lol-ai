import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { getFeatureFlags } from "@/lib/features/featureFlagService";
import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { z } from "zod";

const querySchema = z.object({
  keys: z.string().min(1),
});

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ data: {} }, { status: 200 });
  }

  const keys = parsed.data.keys.split(",").filter(Boolean).slice(0, 20);

  const user = await prismaReadonly.user.findUnique({
    where: { id: userId },
    select: { subscription: { select: { plan: true } } },
  });

  const plan = user?.subscription?.plan ?? "free";
  const flags = await getFeatureFlags(keys, userId, plan);

  return NextResponse.json({ data: flags }, { status: 200 });
});
