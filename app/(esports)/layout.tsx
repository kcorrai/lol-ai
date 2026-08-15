import { MarketingHeader } from "../(marketing)/components/MarketingHeader";
import { MarketingFooter } from "../(marketing)/components/MarketingFooter";
import { ToolsAppChrome } from "@/components/layout/ToolsAppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getSession } from "@/lib/auth/session";

// The esports section is public and built for search, but signed-in members
// reach it from the sidebar too. Same split as the Free Tools (TASK-237): the
// app shell keeps members in context, marketing chrome greets everyone else.
export default async function EsportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session?.user) {
    return <ToolsAppChrome>{children}</ToolsAppChrome>;
  }

  // The signed-out branch needs its own provider: the live scoreboard polls
  // through React Query and the section is deliberately login-free. One per
  // branch — nesting a second under ToolsAppChrome's would mean two clients and
  // two caches on the same page.
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <MarketingHeader />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </QueryProvider>
  );
}
