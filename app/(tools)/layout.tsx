import { MarketingHeader } from "../(marketing)/components/MarketingHeader";
import { MarketingFooter } from "../(marketing)/components/MarketingFooter";
import { ToolsAppChrome } from "@/components/layout/ToolsAppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getSession } from "@/lib/auth/session";

// The Free Tools are public (SEO, no login) but also reachable from the in-app sidebar. Render
// the app shell for signed-in users so tools stay in-context, and the marketing chrome for
// everyone else (TASK-237).
export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session?.user) {
    return <ToolsAppChrome>{children}</ToolsAppChrome>;
  }

  // The anonymous branch needs the same provider (TASK-308). Every free tool
  // before the draft room was server-rendered, so nothing signed-out had ever
  // called a React Query hook — and the draft room is login-free by design, so
  // it cannot use `LiveGameButton`'s trick of gating the hook on a session.
  // One provider per branch: nesting a second under ToolsAppChrome's would mean
  // two clients and two caches on the same page.
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
