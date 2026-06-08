import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { verifyTotpToken, verifyAndConsumeBackupCode } from "@/lib/auth/totpService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { z } from "zod";

const CHALLENGE_LIMIT = { limit: 10, windowMs: 900_000 };

const challengeSchema = z.union([
  z.object({ type: z.literal("totp"), token: z.string().length(6).regex(/^\d{6}$/) }),
  z.object({ type: z.literal("backup"), code: z.string().min(6) }),
]);

// POST: verify a TOTP code during the login 2FA step.
// The session already exists (user signed in) but is flagged as 2fa_pending.
// On success, NextAuth session update clears the pending flag.
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`totp-challenge:${userId}`, CHALLENGE_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const body = await req.json().catch(() => null);
  const parsed = challengeSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation("Provide type=totp with token, or type=backup with code");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabled: true, totpSecret: true, totpBackupCodes: true },
  });

  if (!user?.totpEnabled || !user.totpSecret) throw Errors.forbidden("2FA not enabled for this account");

  if (parsed.data.type === "totp") {
    const valid = verifyTotpToken(user.totpSecret, parsed.data.token);
    if (!valid) throw Errors.forbidden("Invalid TOTP token");

    await prisma.user.update({
      where: { id: userId },
      data: { profileSettings: { totpVerifiedAt: new Date().toISOString() } },
    });

    return apiSuccess({ verified: true });
  } else {
    const { valid, remaining } = await verifyAndConsumeBackupCode(user.totpBackupCodes, parsed.data.code);
    if (!valid) throw Errors.forbidden("Invalid backup code");

    await prisma.user.update({
      where: { id: userId },
      data: {
        totpBackupCodes: remaining,
        profileSettings: { totpVerifiedAt: new Date().toISOString() },
      },
    });

    return apiSuccess({ verified: true, remainingBackupCodes: remaining.length });
  }
});
