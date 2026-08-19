import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { normalizeEmail } from "@/lib/security/email";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildPasswordResetEmail } from "@/lib/email/templates/passwordReset";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { logger } from "@/lib/utils/logger";

const FORGOT_LIMIT = { limit: 3, windowMs: 3_600_000 };

// Keyed on the address as well as the caller. The per-IP cap alone stopped one machine
// from spraying, and did nothing about a spread of machines aimed at one inbox — which
// is the shape this endpoint is actually abused in, because the payload is an email
// somebody else receives.
const FORGOT_PER_ADDRESS_LIMIT = { limit: 5, windowMs: 3_600_000 };

const schema = z.object({
  email: z.string().email(),
});

// Always returns 200 regardless of whether the email exists — prevents user enumeration.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getIp(req);
  const rl = await checkRateLimit(`forgot-password:${ip}`, FORGOT_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "If an account exists, a reset email has been sent." });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "If an account exists, a reset email has been sent." });
  }

  const email = normalizeEmail(parsed.data.email);

  const addressRl = await checkRateLimit(`forgot-password-addr:${email}`, FORGOT_PER_ADDRESS_LIMIT);
  // Still the same 200 and the same sentence: saying "too many" here would confirm the
  // address exists, which is the one thing this endpoint is careful not to do.
  if (!addressRl.allowed) {
    return NextResponse.json({ message: "If an account exists, a reset email has been sent." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      const credentialsAccount = await prisma.account.findFirst({
        where: { userId: user.id, provider: "credentials" },
        select: { id: true },
      });

      if (credentialsAccount) {
        // Invalidate any existing reset tokens for this email
        await prisma.verificationToken.deleteMany({ where: { identifier: email } });

        // Raw token sent in the URL; only its SHA-256 hash is stored in the DB
        const rawToken = randomBytes(32).toString("hex");
        const hashedToken = createHash("sha256").update(rawToken).digest("hex");
        const expires = new Date(Date.now() + 3_600_000); // 1 hour

        await prisma.verificationToken.create({
          data: { identifier: email, token: hashedToken, expires },
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
        const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
        const { subject, html } = buildPasswordResetEmail(resetUrl);

        const emailClient = getEmailClient();
        if (emailClient) {
          await emailClient.emails.send({ from: EMAIL_FROM, to: email, subject, html });
        } else {
          logger.warn("[forgot-password] Email client not configured — reset URL not sent", {
            resetUrl,
          });
        }
      }
    }
  } catch (err) {
    logger.error("[forgot-password] Error processing reset request", err);
    // Swallow the error — always return 200 to prevent timing-based enumeration
  }

  return NextResponse.json({ message: "If an account exists, a reset email has been sent." });
}
