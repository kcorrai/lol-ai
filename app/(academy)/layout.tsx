import type { Metadata } from "next";
import { MarketingHeader } from "../(marketing)/components/MarketingHeader";
import { MarketingFooter } from "../(marketing)/components/MarketingFooter";
import { ToolsAppChrome } from "@/components/layout/ToolsAppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getSession } from "@/lib/auth/session";
import { AcademyRail } from "@/domains/academy/components/AcademyRail";

export const metadata: Metadata = {
  title: {
    default: "LoL Academy | LoL AI Coach",
    template: "%s | LoL Academy",
  },
};

// The Academy is its own section, not a dashboard page (LA-21): lessons are public so
// they can be indexed, and the reading experience is deliberately separate from the
// instrument panel. Same split as the Free Tools and Esports — the app shell keeps
// members in context, marketing chrome greets everyone else.
export default async function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getSession();

  const body = (
    <>
      <AcademyRail />
      {children}
    </>
  );

  if (session?.user) {
    return <ToolsAppChrome>{body}</ToolsAppChrome>;
  }

  // The signed-out branch needs its own provider: drills post through React Query and
  // the section is deliberately login-free. One per branch — nesting a second under
  // ToolsAppChrome's would mean two clients and two caches on the same page.
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <MarketingHeader />
        <main className="flex-1">{body}</main>
        <MarketingFooter />
      </div>
    </QueryProvider>
  );
}
