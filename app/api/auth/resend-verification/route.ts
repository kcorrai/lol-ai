import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildEmailVerificationEmail } from "@/lib/email/templates/emailVerification";
import { logger } from "@/lib/utils/logger";

const RESEND_LIMIT = { limit: 1, windowMs: 60_000 };
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const POST = withAuth(async (_req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`resend-verification:${userId}`, RESEND_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, RESEND_LIMIT.limit);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true },
  });

  if (!user?.email) throw Errors.notFound("User");
  if (user.emailVerified) return apiSuccess({ alreadyVerified: true });

  // Replace any existing token for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires },
  });

  const emailClient = getEmailClient();
  if (emailClient) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
    const { subject, html } = buildEmailVerificationEmail(verifyUrl);

    const { error } = await emailClient.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject,
      html,
    });

    if (error) {
      logger.error("[resend-verification] Email send failed", { userId, error });
    }
  }

  return apiSuccess({ sent: true });
});
