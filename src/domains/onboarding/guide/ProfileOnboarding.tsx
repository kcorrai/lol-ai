"use client";

import { useSession } from "next-auth/react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { GuidedOnboarding } from "./GuidedOnboarding";

// Mounts the forced first-journey overlay on the PUBLIC profile page (`/u/[slug]`), which lives
// outside the (app) shell where the guide normally runs. Without this the tour would vanish the
// moment it sends the user to view their own profile (TASK-225).
//
// The profile page is public and ISR-cached, so gating happens entirely client-side: only an
// authenticated viewer whose onboarding is NOT complete gets the overlay; logged-out visitors
// (the common case for a shared profile) get nothing.
function ProfileOnboardingInner(): React.JSX.Element | null {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;
  const authed = status === "authenticated" && Boolean(userId);
  const { data } = useOnboardingState(authed);

  if (!authed || !userId) return null;
  if (!data || data.completed) return null;

  return <GuidedOnboarding userId={userId} />;
}

export function ProfileOnboarding(): React.JSX.Element {
  // The profile page has no QueryProvider of its own — supply one for the guide's data hooks.
  return (
    <QueryProvider>
      <ProfileOnboardingInner />
    </QueryProvider>
  );
}
