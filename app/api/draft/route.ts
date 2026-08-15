import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { createSeries } from "@/domains/draft/server";
import { CREATE_LIMIT, validationError } from "./_shared";

const createBody = z.object({
  team1Name: z.string().trim().min(1).max(40).default("Team 1"),
  team2Name: z.string().trim().min(1).max(40).default("Team 2"),
  mode: z.enum(["NORMAL", "FEARLESS", "TEAM_FEARLESS"]).default("NORMAL"),
  gameCount: z.number().int().min(1).max(5).default(1),
  // 0 is untimed; anything else must leave a usable turn. 15 s is the floor
  // because below it the poll interval starts to matter.
  timerSeconds: z.union([z.literal(0), z.number().int().min(15).max(120)]).default(30),
  disabledChampions: z.array(z.string().trim().min(1).max(40)).max(60).default([]),
});

// Public — no auth required. A signed-in creator is recorded so the series can
// be listed on their profile later, but a session is never demanded.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(`draft-create:${getIp(req)}`, CREATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return validationError("Request body must be JSON");
  }

  const parsed = createBody.safeParse(json);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid request body");
  }

  const session = await getServerSession(authOptions).catch(() => null);
  const created = await createSeries({
    ...parsed.data,
    createdById: session?.user?.id ?? null,
  });

  const res = apiSuccess(created, 201);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
