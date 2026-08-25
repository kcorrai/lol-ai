import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse, getIp } from "@/lib/api/rateLimit";
import { checkIsPro, getPlanLimits } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getOtpAnalysis } from "@/domains/otp";

const OTP_LIMIT = { limit: 10, windowMs: 60_000 };
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

const querySchema = z.object({
  champion: z.string().min(1),
  role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
});

// GET /api/otp?champion=…&role=… — the OTP assistant's reading of one champion in one lane.
//
// Behind `withAuth` rather than a hand-rolled `getServerSession`. The route always had an
// owner — `/otp` is in the middleware's protected list, so nothing reached it without a
// session — but it read that owner in a way no device token could satisfy, which is why the
// assistant was the one screen on ADR-044's covered list the window could not open.
//
// `deviceAccess` is safe here under ADR-038: the analysis is public champion data and the
// route spends nothing. The two things it does with the caller's identity — the daily cap on
// free plans and the pro gate on hidden mechanics — both *narrow* what comes back, so a
// stolen token gets what the account already had and never more.
export const GET = withAuth(
  async (request: NextRequest, { userId }) => {
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

    if (!(await checkIsPro(userId))) {
      result = { ...result, hiddenMechanics: result.hiddenMechanics.slice(0, 2) };
    }

    return apiSuccess(result);
  },
  { deviceAccess: true }
);
