import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ApiError, Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse, getIp } from "@/lib/api/rateLimit";
import { prisma } from "@/lib/db/prisma";
import { getGeneralCounters } from "@/domains/counter";
import { logger } from "@/lib/utils/logger";

const COUNTER_LIMIT = { limit: 20, windowMs: 60_000 };

const querySchema = z.object({
  champion: z.string().min(1),
  role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
});

export async function GET(request: NextRequest) {
  try {
    const ip = getIp(request);
    const rateCheck = await checkRateLimit(`counter-api:${ip}`, COUNTER_LIMIT);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);
    }

    const { searchParams } = request.nextUrl;
    const raw = {
      champion: searchParams.get("champion") ?? "",
      role: searchParams.get("role") ?? "",
    };

    const parsed = querySchema.safeParse(raw);
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

    const { champion, role } = parsed.data;

    const dbChampion = await prisma.champion.findFirst({
      where: { name: { equals: champion, mode: "insensitive" } },
      select: { name: true },
    });
    if (!dbChampion) throw Errors.notFound("Şampiyon");

    const result = await getGeneralCounters(dbChampion.name, role);
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return apiError(err.code, err.message, err.statusCode);
    }
    logger.error("[counter] Unhandled error", err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
