import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { verifyTotpToken, verifyAndConsumeBackupCode } from "@/lib/auth/totpService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { z } from "zod";
import bcrypt from "bcryptjs";

const DISABLE_LIMIT = { limit: 5, windowMs: 3_600_000 };

const disableSchema = z.object({
  password: z.string().min(1).optional(),
  totpToken: z.string().optional(),
  backupCode: z.string().optional(),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`totp-disable:${userId}`, DISABLE_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const body = await req.json().catch(() => null);
  const parsed = disableSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation("Provide totpToken or backupCode");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totpEnabled: true,
      totpSecret: true,
      totpBackupCodes: true,
      accounts: { where: { provider: "credentials" }, select: { access_token: true } },
    },
  });

  if (!user?.totpEnabled) throw Errors.conflict("2FA is not enabled");

  const { totpToken, backupCode, password } = parsed.data;

  if (totpToken && user.totpSecret) {
    const valid = verifyTotpToken(user.totpSecret, totpToken);
    if (!valid) throw Errors.forbidden("Invalid TOTP token");
  } else if (backupCode && user.totpBackupCodes.length > 0) {
    const { valid } = await verifyAndConsumeBackupCode(user.totpBackupCodes, backupCode);
    if (!valid) throw Errors.forbidden("Invalid backup code");
  } else if (password) {
    // For credentials users — verify password via stored hash
    const credAccount = user.accounts[0];
    if (!credAccount?.access_token) throw Errors.forbidden("No credentials account found");
    const passwordMatch = await bcrypt.compare(password, credAccount.access_token);
    if (!passwordMatch) throw Errors.forbidden("Invalid password");
  } else {
    throw Errors.validation("Provide totpToken, backupCode, or password to disable 2FA");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: false, totpSecret: null, totpBackupCodes: [] },
  });

  return apiSuccess({ disabled: true });
});
