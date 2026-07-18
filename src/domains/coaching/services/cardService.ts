import { prisma } from "@/lib/db/prisma";
import { toJsonInput, fromJsonValue } from "@/types/json";
import { buildWeeklyData, buildMasteryData } from "./cardDataBuilders";
import type { CardType, CardData } from "./card.types";

export type { CardType, WeeklyCardData, MasteryCardData, CardData } from "./card.types";

interface GenerateCardOptions {
  userId: string;
  cardType: CardType;
  riotAccountId: string;
  championId?: number;
  isPro: boolean;
}

export async function generateShareableCard(
  opts: GenerateCardOptions
): Promise<{ token: string; expiresAt: string }> {
  let data: CardData;

  if (opts.cardType === "mastery") {
    if (!opts.championId) throw new Error("championId required for mastery card");
    data = await buildMasteryData(opts.riotAccountId, opts.championId, opts.isPro);
  } else {
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
