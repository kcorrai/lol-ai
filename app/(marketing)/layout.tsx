import { MarketingHeader } from "./components/MarketingHeader";
import { MarketingFooter } from "./components/MarketingFooter";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
