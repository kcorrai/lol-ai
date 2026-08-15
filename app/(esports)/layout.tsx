import { MarketingHeader } from "../(marketing)/components/MarketingHeader";
import { MarketingFooter } from "../(marketing)/components/MarketingFooter";
import { ToolsAppChrome } from "@/components/layout/ToolsAppChrome";
import { getSession } from "@/lib/auth/session";

// The esports section is public and built for search, but signed-in members
// reach it from the sidebar too. Same split as the Free Tools (TASK-237): the
// app shell keeps members in context, marketing chrome greets everyone else.
export default async function EsportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session?.user) {
    return <ToolsAppChrome>{children}</ToolsAppChrome>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
