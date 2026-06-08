import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { generateTotpSetup, encryptTotpSecret } from "@/lib/auth/totpService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import QRCode from "qrcode";

const SETUP_LIMIT = { limit: 5, windowMs: 3_600_000 };

// GET: generate a new TOTP secret and return QR code + backup codes (not yet saved)
export const GET = withAuth(async (req: NextRequest, { userId, userEmail }) => {
  const rateCheck = await checkRateLimit(`totp-setup:${userId}`, SETUP_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  if (!userEmail) throw Errors.forbidden("Email required for 2FA setup");

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabled: true },
  });
  if (existing?.totpEnabled) throw Errors.conflict("2FA is already enabled");

  const { secret, otpauthUrl, backupCodes } = generateTotpSetup(userEmail);

  // Store pending secret (not enabled yet — enabled after verification)
  const encryptedSecret = encryptTotpSecret(secret);
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: encryptedSecret },
  });

  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return apiSuccess({ qrDataUrl, backupCodes, secret });
});
