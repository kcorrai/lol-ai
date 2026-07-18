import { prisma } from "@/lib/db/prisma";

export interface OnboardingState {
  completed: boolean;
  completedAt: Date | null;
}

// Reads the forced-onboarding completion state for a user (TASK-217).
// The `profiles` row is created at sign-up (see auth events / seed), but we tolerate its
// absence by treating a missing profile as "not yet completed".
export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { onboardingCompletedAt: true },
  });
  const completedAt = profile?.onboardingCompletedAt ?? null;
  return { completed: completedAt !== null, completedAt };
}

// Marks the forced onboarding complete. Idempotent: a second call keeps the original
// timestamp so re-submits (double-clicks, retries) never move the goalpost.
export async function completeOnboarding(userId: string): Promise<OnboardingState> {
  const existing = await prisma.profile.findUnique({
    where: { userId },
    select: { onboardingCompletedAt: true },
  });

  if (existing?.onboardingCompletedAt) {
    return { completed: true, completedAt: existing.onboardingCompletedAt };
  }

  const completedAt = new Date();
  await prisma.profile.upsert({
    where: { userId },
    update: { onboardingCompletedAt: completedAt },
    create: { userId, onboardingCompletedAt: completedAt },
  });
  return { completed: true, completedAt };
}
