import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ApiError, Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse, getIp } from "@/lib/api/rateLimit";
import { checkIsPro, getPlanLimits } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getOtpAnalysis } from "@/domains/otp";
import { logger } from "@/lib/utils/logger";

const OTP_LIMIT = { limit: 10, windowMs: 60_000 };
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

const querySchema = z.object({
  champion: z.string().min(1),
  role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
});

export async function GET(request: NextRequest) {
  try {
    const ip = getIp(request);
    const rateCheck = await checkRateLimit(`otp-api:${ip}`, OTP_LIMIT);
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
    if (!dbChampion) throw Errors.notFound("Champion");

    let result = await getOtpAnalysis(dbChampion.name, role);

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (userId) {
      const limits = await getPlanLimits(userId);
      if (limits.otpAnalysisPerDay !== -1) {
        const dailyCheck = await checkRateLimit(`otp-daily:${userId}`, {
          limit: limits.otpAnalysisPerDay,
          windowMs: DAILY_WINDOW_MS,
        });
        if (!dailyCheck.allowed) {
          return rateLimitResponse(dailyCheck.retryAfterMs, dailyCheck.limit);
        }
      }
    }

    const isPro = userId ? await checkIsPro(userId) : false;

    if (!isPro) {
      result = { ...result, hiddenMechanics: result.hiddenMechanics.slice(0, 2) };
    }

    return apiSuccess(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return apiError(err.code, err.message, err.statusCode);
    }
    logger.error("[otp] Unhandled error", err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
