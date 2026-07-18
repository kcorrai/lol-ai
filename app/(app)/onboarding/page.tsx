import { redirect } from "next/navigation";

// The standalone onboarding wizard is retired (TASK-217). New users are now guided through the
// real app by the forced first-journey overlay, which lives in the app shell — so this route just
// drops them onto the dashboard where that journey begins.
export default function OnboardingPage() {
  redirect("/dashboard");
}
