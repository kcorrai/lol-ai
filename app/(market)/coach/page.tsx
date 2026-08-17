import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getRequiredSession } from "@/lib/auth/session";
import { getOwnProfile } from "@/domains/marketplace";
import { CoachConsoleHome } from "@/domains/marketplace/components/CoachConsoleHome";

export const metadata: Metadata = { title: "Coach Console" };

export const dynamic = "force-dynamic";

// The coach's home inside the section.
//
// Anyone without a profile is sent to the application rather than shown an
// empty console — "you are not a coach yet" is a different page, and it already
// exists.
export default async function CoachConsolePage() {
  const session = await getRequiredSession();
  const profile = await getOwnProfile(session.user.id);

  if (!profile) redirect("/coach/apply");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">
          {profile.displayName || "Your coaching"}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Everything you sell, and everyone you sell it to.
        </p>
      </div>

      <CoachConsoleHome profile={profile} />

      <p className="text-xs text-text-faint">
        Looking for your own games and reports?{" "}
        <Link href="/dashboard" className="text-text-muted underline hover:text-text">
          They are still on LaneIQ
        </Link>
        .
      </p>
    </div>
  );
}
