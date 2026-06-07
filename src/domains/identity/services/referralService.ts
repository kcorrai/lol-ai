import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

const TRIAL_DAYS = 7;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export interface ReferralStats {
  code: string;
  totalInvited: number;
  totalCompleted: number;
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await prisma.referral.findFirst({
    where: { referrerId: userId },
    select: { code: true },
  });
  if (existing) return existing.code;

  // Retry up to 5 times to handle the rare code collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      const created = await prisma.referral.create({
        data: { referrerId: userId, code },
        select: { code: true },
      });
      return created.code;
    } catch {
      // Unique constraint violation — try next code
    }
  }

  throw new Error("Failed to generate unique referral code after 5 attempts");
}

export async function applyReferralCode(code: string, newUserId: string): Promise<boolean> {
  const referral = await prisma.referral.findUnique({ where: { code } });
  if (!referral) return false;
  if (referral.refereeId) return false;
  if (referral.referrerId === newUserId) return false;

  await prisma.referral.update({
    where: { code },
    data: { refereeId: newUserId },
  });

  return true;
}

// Called when a referred user connects their first Riot account.
// Awards 7-day Pro trial to both parties if not already rewarded.
export async function completeReferral(refereeId: string): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { refereeId },
    select: { id: true, referrerId: true, status: true },
  });

  if (!referral || referral.status !== "pending") return;

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: { status: "rewarded", completedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: referral.referrerId },
      data: { proTrialEndsAt: trialEndsAt },
    }),
    prisma.user.update({
      where: { id: refereeId },
      data: { proTrialEndsAt: trialEndsAt },
    }),
  ]);

  logger.info("[referral] completed", { refereeId, referrerId: referral.referrerId, trialEndsAt });
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    select: { code: true, status: true, refereeId: true },
  });

  const code = referrals[0]?.code ?? await getOrCreateReferralCode(userId);
  const totalInvited = referrals.filter((r) => r.refereeId !== null).length;
  const totalCompleted = referrals.filter((r) => r.status === "rewarded").length;

  return { code, totalInvited, totalCompleted };
}
