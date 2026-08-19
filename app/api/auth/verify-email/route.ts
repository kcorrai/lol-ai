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
    await prisma.verificationToken.deleteMany({ where: { token } });
    return NextResponse.redirect(`${APP_URL}/dashboard?email_error=expired_token`);
  }

  // The token is consumed first, and its deletion is what wins the race: two clicks on
  // the same link (a mail client that pre-fetches, then the reader) both used to reach
  // the update. `deleteMany` reports how many rows it removed, so the second caller
  // sees zero and stops. Previously the second one 500'd on a row that was already gone.
  const consumed = await prisma.verificationToken.deleteMany({ where: { token } });
  if (consumed.count === 0) {
    return NextResponse.redirect(`${APP_URL}/dashboard?email_error=invalid_token`);
  }

  // `updateMany`, not `update`: the address may no longer exist — the account can have
  // been deleted between the mail going out and the link being followed — and `update`
  // throws on a missing row, which reached the reader as a 500.
  const verified = await prisma.user.updateMany({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });
  if (verified.count === 0) {
    return NextResponse.redirect(`${APP_URL}/dashboard?email_error=invalid_token`);
  }

  return NextResponse.redirect(`${APP_URL}/dashboard?email_verified=1`);
}
