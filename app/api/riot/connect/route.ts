import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { connectAccount } from "@/domains/riot/services/accountService";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { completeReferral } from "@/domains/identity/services/referralService";

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
      throw Errors.validation("Riot API şu an meşgul, lütfen 1-2 dakika bekleyip tekrar deneyin.");
    }
    throw err;
  }

  // Award referral trial if this user was referred and this is their first account
  await completeReferral(userId).catch(() => { /* non-critical */ });

  return apiSuccess(account, 201);
});
