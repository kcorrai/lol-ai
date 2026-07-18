import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth/session";
import { getOnboardingState } from "@/domains/onboarding/onboardingService";

export const metadata: Metadata = {
  title: {
    default: "LoL AI Coach",
    template: "%s | LoL AI Coach",
  },
};

// SSR the onboarding gate so the forced first-journey overlay is present on first paint (no flash
// of a usable app before it mounts). Unauthenticated requests are redirected by middleware, so a
// missing session here is treated as "nothing to onboard".
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const onboardingComplete = session?.user?.id
    ? (await getOnboardingState(session.user.id)).completed
    : true;

  return (
    <QueryProvider>
      <AppShell onboardingComplete={onboardingComplete}>{children}</AppShell>
    </QueryProvider>
  );
}
