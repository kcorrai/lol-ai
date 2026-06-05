import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ApiError, Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse, getIp } from "@/lib/api/rateLimit";
import { getPlanLimits } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { analyzeDraft } from "@/domains/draft";
import { logger } from "@/lib/utils/logger";

const DRAFT_IP_LIMIT = { limit: 10, windowMs: 60_000 };
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

const teamSchema = z.object({
  TOP: z.string().min(1),
  JUNGLE: z.string().min(1),
  MIDDLE: z.string().min(1),
  BOTTOM: z.string().min(1),
  UTILITY: z.string().min(1),
});

const bodySchema = z.object({
  blueTeam: teamSchema,
  redTeam: teamSchema,
});

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);
    const rateCheck = await checkRateLimit(`draft-api:${ip}`, DRAFT_IP_LIMIT);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw Errors.validation("Invalid JSON body");
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

    const { blueTeam, redTeam } = parsed.data;

    const allNames = Object.values({ ...blueTeam, ...redTeam });
    const dbChampions = await prisma.champion.findMany({
      where: { name: { in: allNames, mode: "insensitive" } },
      select: { name: true },
    });

    const found = new Set(dbChampions.map((c) => c.name.toLowerCase()));
    const missing = allNames.find((n) => !found.has(n.toLowerCase()));
    if (missing) throw Errors.notFound(`Şampiyon: ${missing}`);

    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const limits = await getPlanLimits(session.user.id);
      if (limits.draftAnalysisPerDay !== -1) {
        const dailyCheck = await checkRateLimit(
          `draft-daily:${session.user.id}`,
          { limit: limits.draftAnalysisPerDay, windowMs: DAILY_WINDOW_MS }
        );
        if (!dailyCheck.allowed) {
          return rateLimitResponse(dailyCheck.retryAfterMs, dailyCheck.limit);
        }
      }
    }

    const result = await analyzeDraft({ blueTeam, redTeam });
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return apiError(err.code, err.message, err.statusCode);
    }
    logger.error("[draft] Unhandled error", err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
