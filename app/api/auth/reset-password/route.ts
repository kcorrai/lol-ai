import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { rememberSessionVersion } from "@/lib/auth/sessionVersion";
import { normalizeEmail } from "@/lib/security/email";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { logger } from "@/lib/utils/logger";

const RESET_LIMIT = { limit: 5, windowMs: 3_600_000 };

const schema = z.object({
  token: z.string().min(64).max(64),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getIp(req);
  const rl = await checkRateLimit(`reset-password:${ip}`, RESET_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } },
      { status: 422 }
    );
  }

  const { token: rawToken, password } = parsed.data;
  const hashedToken = createHash("sha256").update(rawToken).digest("hex");

  // `VerificationToken` is shared with the email-verification flow, which stores its
  // token as issued while this one stores a hash. That difference is the only thing
  // keeping the two apart today, and it is not a property anyone would think to
  // preserve — so the identifier is checked to be a plain address as well, and a
  // future change to how verification tokens are stored cannot turn a "confirm your
  // email" link into a password reset.
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!record || record.identifier.includes(":") || record.expires < new Date()) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "This reset link is invalid or has expired." } },
      { status: 400 }
    );
  }

  const email = normalizeEmail(record.identifier);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "This reset link is invalid or has expired." } },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Update the password hash stored in Account.access_token (credentials provider — see ADR-003)
  await prisma.account.updateMany({
    where: { userId: user.id, provider: "credentials" },
    data: { access_token: passwordHash },
  });

  // Every session signed in with the old password is cut here. A reset is what
  // somebody does *because* their account is not theirs any more; leaving the
  // intruder's 30-day JWT valid meant the reset changed nothing for them. The JWT
  // callback refuses any token whose `sessionVersion` is behind the row's.
  const revoked = await prisma.user.update({
    where: { id: user.id },
    data: { sessionVersion: { increment: 1 } },
  });
  // Published straight away, so the cut lands on the intruder's next request rather than
  // waiting out the cached copy's TTL.
  await rememberSessionVersion(user.id, revoked.sessionVersion);

  // Invalidate the used token
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  logger.info("[reset-password] Password reset successful", { userId: user.id });

  return NextResponse.json({ message: "Password updated successfully." });
}
