import Link from "next/link";
import { Zap } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          <span className="font-display text-base font-bold text-text">LoL AI Coach</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/champions"
            className="text-sm text-text-muted transition-colors hover:text-text"
          >
            Şampiyonlar
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-text-muted transition-colors hover:text-text"
          >
            Fiyatlar
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-text-muted transition-colors hover:text-text"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  );
}
