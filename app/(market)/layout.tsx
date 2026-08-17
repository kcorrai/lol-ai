import { QueryProvider } from "@/components/providers/QueryProvider";
import { getSession } from "@/lib/auth/session";
import { hasCoachProfile } from "@/domains/marketplace";
import { MarketChrome } from "@/domains/marketplace/components/MarketChrome";
import type { MarketNavItem } from "@/domains/marketplace/components/MarketChrome";

// The coaching section, and its own shell.
//
// Kaan's call, and the right one: this is a different job from the dashboard.
// A coach here is running a business and a student is dealing with a person —
// neither is "look at my last twenty games", and hanging both off the player
// sidebar would make them read as a sub-tab of something else.
//
// The storefront stays reachable signed out, because that is the acquisition
// surface. Everything else is gated by `middleware.ts`, so this layout only
// decides what the nav should say, never who may be here.
export default async function MarketLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const signedIn = Boolean(session?.user?.id);

  // The coach links appear once there is a profile at all, not once it is
  // approved: an application in review is exactly when someone needs to find
  // their way back to it.
  const isCoach = signedIn ? await hasCoachProfile(session!.user.id) : false;

  const nav: MarketNavItem[] = [
    { href: "/coaches", label: "Find a coach" },
    ...(signedIn
      ? [
          { href: "/sessions", label: "My sessions" },
          { href: "/messages", label: "Messages" },
        ]
      : []),
    ...(isCoach
      ? [
          { href: "/coach", label: "Coach console" },
          { href: "/coach/listings", label: "Listings" },
          { href: "/coach/availability", label: "Availability" },
        ]
      : signedIn
        ? [{ href: "/coach/apply", label: "Become a coach" }]
        : []),
  ];

  return (
    <QueryProvider>
      <MarketChrome nav={nav}>{children}</MarketChrome>
    </QueryProvider>
  );
}
