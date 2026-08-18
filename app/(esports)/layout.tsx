import { MarketingHeader } from "../(marketing)/components/MarketingHeader";
import { MarketingFooter } from "../(marketing)/components/MarketingFooter";
import { ToolsAppChrome } from "@/components/layout/ToolsAppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getSession } from "@/lib/auth/session";

/**
 * How far down a sticky day or league heading has to stop.
 *
 * The two branches below scroll differently: the app shell scrolls its own
 * `<main>`, so a heading stuck at its top clears the chrome by itself, while the
 * marketing branch scrolls the window under a 62px header a heading would
 * otherwise vanish behind. Sections read it off this variable rather than
 * guessing which shell they are in.
 */
const APP_STICKY_TOP = { "--esports-sticky-top": "0px" } as React.CSSProperties;
const MARKETING_STICKY_TOP = { "--esports-sticky-top": "62px" } as React.CSSProperties;

// The esports section is public and built for search, but signed-in members
// reach it from the sidebar too. Same split as the Free Tools (TASK-237): the
// app shell keeps members in context, marketing chrome greets everyone else.
export default async function EsportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session?.user) {
    return (
      <ToolsAppChrome>
        <div style={APP_STICKY_TOP}>{children}</div>
      </ToolsAppChrome>
    );
  }

  // The signed-out branch needs its own provider: the live scoreboard polls
  // through React Query and the section is deliberately login-free. One per
  // branch — nesting a second under ToolsAppChrome's would mean two clients and
  // two caches on the same page.
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-background" style={MARKETING_STICKY_TOP}>
        <MarketingHeader />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </QueryProvider>
  );
}
