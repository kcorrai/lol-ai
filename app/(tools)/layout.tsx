import { MarketingHeader } from "../(marketing)/components/MarketingHeader";
import { MarketingFooter } from "../(marketing)/components/MarketingFooter";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
