import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { connectAccount } from "@/domains/riot/services/accountService";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { completeReferral } from "@/domains/identity/services/referralService";
import { inngest } from "@/inngest/client";
import { audit } from "@/lib/audit/auditService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

// This is the one authenticated route that sends a caller-chosen Riot ID to Riot. Left open it
// answers "does this name exist in this region?" as fast as it can be asked, and every one of
// those questions is spent from the application key's quota — the quota every other Riot-backed
// feature shares. `/api/esports/you-vs-pros` caps the signed-out version of the same lookup for
// the same reason; connecting an account is a handful-of-times-ever action, so this can be tight.
const CONNECT_LIMIT = { limit: 10, windowMs: 600_000 };

const connectSchema = z.object({
  gameName: z.string().min(1).max(16),
  tagLine: z.string().min(2).max(5),
  region: z.enum(VALID_REGIONS as [string, ...string[]]),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  const rate = await checkRateLimit(`riot-connect:${userId}`, CONNECT_LIMIT);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

  let account;
  try {
    account = await connectAccount(
      userId,
      parsed.data.gameName,
      parsed.data.tagLine,
      parsed.data.region
    );
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "RIOT_RATE_LIMITED") {
      throw Errors.validation("Riot API is currently busy, please wait 1-2 minutes and try again.");
    }
    throw err;
  }

  // Award referral trial if this user was referred and this is their first account
  await completeReferral(userId).catch(() => {
    /* non-critical */
  });

  // Fire activation email — non-blocking, first account only
  if (account.isPrimary) {
    await inngest
      .send({
        name: "riot/account.connected",
        data: { userId, gameName: account.gameName },
      })
      .catch(() => {
        /* non-critical */
      });
  }

  await audit({
    userId,
    action: "riot.account.connected",
    resourceId: account.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  }).catch(() => {
    /* non-critical */
  });

  return apiSuccess(account, 201);
});
