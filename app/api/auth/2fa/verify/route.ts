import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { verifyTotpToken, hashBackupCodes } from "@/lib/auth/totpService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { z } from "zod";

const VERIFY_LIMIT = { limit: 10, windowMs: 900_000 }; // 10 attempts per 15 min

const verifySchema = z.object({
  token: z.string().length(6).regex(/^\d{6}$/),
  backupCodes: z.array(z.string()).length(8),
});

// POST: confirm TOTP setup with a valid token, save hashed backup codes, enable 2FA
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`totp-verify:${userId}`, VERIFY_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const body = await req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) throw Errors.validation("token must be a 6-digit number, backupCodes required");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  });

  if (!user?.totpSecret) throw Errors.forbidden("Complete 2FA setup first");
  if (user.totpEnabled) throw Errors.conflict("2FA is already enabled");

  const valid = verifyTotpToken(user.totpSecret, parsed.data.token);
  if (!valid) throw Errors.forbidden("Invalid TOTP token");

  const hashedCodes = await hashBackupCodes(parsed.data.backupCodes);

  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: true, totpBackupCodes: hashedCodes },
  });

  return apiSuccess({ enabled: true });
});
