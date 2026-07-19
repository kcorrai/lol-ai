import { MarketingHeader } from "../(marketing)/components/MarketingHeader";
import { MarketingFooter } from "../(marketing)/components/MarketingFooter";
import { ToolsAppChrome } from "@/components/layout/ToolsAppChrome";
import { getSession } from "@/lib/auth/session";

// The Free Tools are public (SEO, no login) but also reachable from the in-app sidebar. Render
// the app shell for signed-in users so tools stay in-context, and the marketing chrome for
// everyone else (TASK-237).
export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
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
