import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
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

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "This reset link is invalid or has expired." } },
      { status: 400 }
    );
  }

  const { identifier: email } = record;

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

  // Invalidate the used token
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  logger.info("[reset-password] Password reset successful", { userId: user.id });

  return NextResponse.json({ message: "Password updated successfully." });
}
