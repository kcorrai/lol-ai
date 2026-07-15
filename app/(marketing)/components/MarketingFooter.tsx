import Link from "next/link";
import { Zap } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <span className="font-display text-sm font-bold text-text">LoL AI Coach</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-muted">
            <Link href="/tools" className="transition-colors hover:text-text">
              Free Tools
            </Link>
            <Link href="/meta" className="transition-colors hover:text-text">
              Patch Meta
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-text">
              Pricing
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-text">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-text">
              Terms
            </Link>
            <Link href="/login" className="transition-colors hover:text-text">
              Login
            </Link>
            <Link href="/register" className="transition-colors hover:text-text">
              Sign up
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-xs text-text-muted">
            LoL AI Coach isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
            opinions of Riot Games or anyone officially involved in producing or managing Riot Games
            properties. League of Legends &copy; Riot Games, Inc.
          </p>
          <p className="mt-2 text-xs text-text-muted">
            © {new Date().getFullYear()} LoL AI Coach
          </p>
        </div>
      </div>
    </footer>
  );
}
