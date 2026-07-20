import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

// Unauthenticated, and it writes: it verifies the user and consumes the token. A human follows this
// link once, so anything above a handful a minute is not a person.
const VERIFY_LIMIT = { limit: 10, windowMs: 60_000 };

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(`verify-email:${getIp(req)}`, VERIFY_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/dashboard?email_error=invalid_token`);
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.redirect(`${APP_URL}/dashboard?email_error=invalid_token`);
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(`${APP_URL}/dashboard?email_error=expired_token`);
  }

  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.redirect(`${APP_URL}/dashboard?email_verified=1`);
}
