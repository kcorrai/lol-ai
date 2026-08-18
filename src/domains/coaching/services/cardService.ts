import { prisma } from "@/lib/db/prisma";
import { toJsonInput, fromJsonValue } from "@/types/json";
import { buildWeeklyData, buildMasteryData, buildAcademyData } from "./cardDataBuilders";
import type { CardType, CardData } from "./card.types";

export type { CardType, WeeklyCardData, MasteryCardData, AcademyCardData, CardData } from "./card.types";

interface GenerateCardOptions {
  userId: string;
  cardType: CardType;
  /** Not needed for an academy card — lesson progress belongs to the user, not an account. */
  riotAccountId?: string;
  championId?: number;
  trackId?: string;
  isPro: boolean;
}

export async function generateShareableCard(
  opts: GenerateCardOptions
): Promise<{ token: string; expiresAt: string }> {
  let data: CardData;

  if (opts.cardType === "academy") {
    if (!opts.trackId) throw new Error("trackId required for academy card");
    data = await buildAcademyData(opts.userId, opts.trackId);
  } else if (opts.cardType === "mastery") {
    if (!opts.championId) throw new Error("championId required for mastery card");
    if (!opts.riotAccountId) throw new Error("riotAccountId required for mastery card");
    data = await buildMasteryData(opts.riotAccountId, opts.championId, opts.isPro);
  } else {
    if (!opts.riotAccountId) throw new Error("riotAccountId required for weekly card");
    data = await buildWeeklyData(opts.riotAccountId, opts.userId, opts.isPro);
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const card = await prisma.shareableCard.create({
    data: {
      userId: opts.userId,
      cardType: opts.cardType,
      data: toJsonInput(data),
      expiresAt,
    },
  });

  return { token: card.token, expiresAt: expiresAt.toISOString() };
}

export async function getCardByToken(
  token: string
): Promise<{ data: CardData; expired: boolean }> {
  const card = await prisma.shareableCard.findUnique({ where: { token } });
  if (!card) throw new Error("NOT_FOUND");

  const expired = card.expiresAt < new Date();

  // Fire-and-forget view count
  if (!expired) {
    prisma.shareableCard
      .update({ where: { id: card.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);
  }

  return { data: fromJsonValue<CardData>(card.data), expired };
}
