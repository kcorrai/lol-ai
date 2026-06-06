import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount, getPlanLimits } from "@/lib/auth/authorization";
import { generateShareableCard } from "@/domains/coaching/services/cardService";

const bodySchema = z.object({
  cardType: z.enum(["weekly", "mastery"]),
  riotAccountId: z.string().uuid(),
  championId: z.number().int().positive().optional(),
});

// POST /api/cards/generate
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  const { cardType, riotAccountId, championId } = parsed.data;

  await assertOwnsRiotAccount(userId, riotAccountId);

  const limits = await getPlanLimits(userId);
  const isPro = limits.matchupAnalysisPerDay === -1;

  const result = await generateShareableCard({
    userId,
    cardType,
    riotAccountId,
    championId,
    isPro,
  });

  const cardUrl = `/api/cards/${result.token}`;

  return apiSuccess({ token: result.token, cardUrl, expiresAt: result.expiresAt }, 201);
});
