import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { applyReferralCode } from "@/domains/identity/services/referralService";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildEmailVerificationEmail } from "@/lib/email/templates/emailVerification";
import { logger } from "@/lib/utils/logger";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  refCode?: string;
}

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; code: "EMAIL_TAKEN" };

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

// Creates a credentials user with its Account (password hash), Profile and
// Subscription, applies an optional referral code, and fires the verification
// email. Returns EMAIL_TAKEN when the address already exists.
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const { email, password, name, refCode } = input;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, code: "EMAIL_TAKEN" };

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, name: name ?? null, emailVerified: null },
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

  return { ok: true, userId: user.id };
}
