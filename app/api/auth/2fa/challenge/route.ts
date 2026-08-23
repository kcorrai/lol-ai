import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { mergeProfileSettings } from "@/lib/db/profileSettingsStore";
import { verifyTotpToken, verifyAndConsumeBackupCode } from "@/lib/auth/totpService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { z } from "zod";

const CHALLENGE_LIMIT = { limit: 10, windowMs: 900_000 };

const challengeSchema = z.union([
  z.object({
    type: z.literal("totp"),
    token: z
      .string()
      .length(6)
      .regex(/^\d{6}$/),
  }),
  z.object({ type: z.literal("backup"), code: z.string().min(6).max(64) }),
]);

// POST: answer the second factor for a session that has already passed the password.
//
// This is the one endpoint `withAuth` lets a two-factor-pending session reach — every
// other route refuses it — and stamping the user row is what clears that state. The
// stamp is compared against the session's own start time in the JWT callback, so it
// only ever vouches for the login that produced it.
export const POST = withAuth(
  async (req: NextRequest, { userId }) => {
    const rateCheck = await checkRateLimit(`totp-challenge:${userId}`, CHALLENGE_LIMIT);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

    const body = await req.json().catch(() => null);
    const parsed = challengeSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation("Provide type=totp with token, or type=backup with code");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true, totpSecret: true, totpBackupCodes: true },
    });

    if (!user?.totpEnabled || !user.totpSecret) {
      throw Errors.forbidden("2FA not enabled for this account");
    }

    if (parsed.data.type === "totp") {
      const valid = verifyTotpToken(user.totpSecret, parsed.data.token);
      if (!valid) throw Errors.forbidden("Invalid TOTP token");

      await mergeProfileSettings(userId, { totpVerifiedAt: new Date().toISOString() });
      return apiSuccess({ verified: true });
    }

    const { valid, remaining } = await verifyAndConsumeBackupCode(
      user.totpBackupCodes,
      parsed.data.code
    );
    if (!valid) throw Errors.forbidden("Invalid backup code");

    await prisma.user.update({
      where: { id: userId },
      data: { totpBackupCodes: remaining },
    });
    await mergeProfileSettings(userId, { totpVerifiedAt: new Date().toISOString() });

    return apiSuccess({ verified: true, remainingBackupCodes: remaining.length });
  },
  { allowTwoFactorPending: true }
);
