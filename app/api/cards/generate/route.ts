import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount, getPlanLimits } from "@/lib/auth/authorization";
import { generateShareableCard } from "@/domains/coaching/services/cardService";

const bodySchema = z.object({
  cardType: z.enum(["weekly", "mastery", "academy", "career"]),
  // An academy certificate is built from lesson progress, which belongs to the user rather than
  // to a linked account — so it asks for a track instead.
  riotAccountId: z.string().uuid().optional(),
  championId: z.number().int().positive().optional(),
  trackId: z.string().min(1).optional(),
});

// POST /api/cards/generate
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  const { cardType, riotAccountId, championId, trackId } = parsed.data;

  if (cardType === "academy") {
    if (!trackId) throw Errors.validation("trackId is required for an academy card");
  } else {
    if (!riotAccountId) throw Errors.validation("riotAccountId is required for this card");
    await assertOwnsRiotAccount(userId, riotAccountId);
  }

  const limits = await getPlanLimits(userId);
  const isPro = limits.matchupAnalysisPerDay === -1;

  let result: Awaited<ReturnType<typeof generateShareableCard>>;
  try {
    result = await generateShareableCard({
      userId,
      cardType,
      riotAccountId,
      championId,
      trackId,
      isPro,
    });
  } catch (err) {
    // The academy domain refuses a certificate for a track that is not finished; that is a
    // request problem, not a server one.
    if (err instanceof Error && err.message === "TRACK_NOT_FINISHED") {
      throw Errors.validation("That track is not finished yet");
    }
    // A career with no games in it is a request problem too — there is nothing to draw.
    if (err instanceof Error && err.message === "NO_CAREER_YET") {
      throw Errors.validation("There are no tracked games to build a career card from yet");
    }
    throw err;
  }

  const cardUrl = `/api/cards/${result.token}`;

  return apiSuccess({ token: result.token, cardUrl, expiresAt: result.expiresAt }, 201);
});
