-- TASK-217: forced first-journey onboarding completion gate
ALTER TABLE "profiles" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
