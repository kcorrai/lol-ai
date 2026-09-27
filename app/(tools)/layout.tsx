import { MarketingHeader } from "../(marketing)/components/MarketingHeader";
import { MarketingFooter } from "../(marketing)/components/MarketingFooter";
import { PublicChrome } from "@/components/layout/PublicChrome";

// The Free Tools are public (SEO, no login) but also reachable from the in-app sidebar, so a
// signed-in visitor gets the app shell (TASK-237). That choice is made in the browser by
// ToolsChrome: reading the session here made every tool page dynamic and switched ISR off (LA-112).
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicChrome header={<MarketingHeader />} footer={<MarketingFooter />}>
      {children}
    </PublicChrome>
  );
}
