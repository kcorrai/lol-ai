import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { applyReferralCode } from "@/domains/identity/services/referralService";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildEmailVerificationEmail } from "@/lib/email/templates/emailVerification";
import { logger } from "@/lib/utils/logger";

const REGISTER_LIMIT = { limit: 5, windowMs: 3_600_000 };
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

async function sendVerificationEmail(email: string, userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  const emailClient = getEmailClient();
  if (!emailClient) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
  const { subject, html } = buildEmailVerificationEmail(verifyUrl);

  const { error } = await emailClient.emails.send({ from: EMAIL_FROM, to: email, subject, html });
  if (error) logger.error("[register] Resend error", { userId, error });
}

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  refCode: z.string().min(1).max(16).toUpperCase().nullish().transform((v) => v ?? undefined),
});

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rateCheck = await checkRateLimit(`register:${ip}`, REGISTER_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid request body" } }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } },
      { status: 422 }
    );
  }

  const { email, password, name, refCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" } },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: name ?? null,
      emailVerified: null,
    },
  });

  // Store password hash in Account.access_token — see ADR-003
  await prisma.account.create({
    data: {
      userId: user.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: email,
      access_token: passwordHash,
    },
  });

  // Auto-create Profile and Subscription for credentials users
  await prisma.profile.create({ data: { userId: user.id } });
  await prisma.subscription.create({ data: { userId: user.id } });

  if (refCode) {
    await applyReferralCode(refCode, user.id).catch(() => { /* ignore invalid codes */ });
  }

  // Send email verification — non-blocking, failure does not abort registration
  await sendVerificationEmail(email, user.id).catch((err) => {
    logger.error("[register] Failed to send verification email", { userId: user.id, err });
  });

  return NextResponse.json({ data: { userId: user.id } }, { status: 201 });
}
