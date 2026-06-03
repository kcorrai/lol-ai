import Link from "next/link";
import { Zap } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <span className="font-display text-sm font-bold text-text">LoL AI Coach</span>
        </div>

        <nav className="flex items-center gap-6 text-sm text-text-muted">
          <Link href="/pricing" className="transition-colors hover:text-text">
            Pricing
          </Link>
          <Link href="/login" className="transition-colors hover:text-text">
            Login
          </Link>
          <Link href="/register" className="transition-colors hover:text-text">
            Sign up
          </Link>
        </nav>

        <p className="text-xs text-text-muted">
          © {new Date().getFullYear()} LoL AI Coach. Not affiliated with Riot Games.
        </p>
      </div>
    </footer>
  );
}
