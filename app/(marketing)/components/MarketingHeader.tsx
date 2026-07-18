"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Zap className="h-5 w-5 text-accent" />
          <span className="font-display text-base font-bold text-text">LoL AI Coach</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/tools" className="text-sm text-text-muted transition-colors hover:text-text">
            Free Tools
          </Link>
          <Link href="/champions" className="text-sm text-text-muted transition-colors hover:text-text">
            Champions
          </Link>
          <Link href="/pricing" className="text-sm text-text-muted transition-colors hover:text-text">
            Pricing
          </Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-text-muted transition-colors hover:text-text">
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            {isAuthenticated ? "Dashboard" : "Get Started Free"}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
            className="rounded-md p-2 text-text-muted hover:text-text"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link href="/tools" className="text-sm text-text-muted hover:text-text" onClick={() => setOpen(false)}>
              Free Tools
            </Link>
            <Link href="/champions" className="text-sm text-text-muted hover:text-text" onClick={() => setOpen(false)}>
              Champions
            </Link>
            <Link href="/pricing" className="text-sm text-text-muted hover:text-text" onClick={() => setOpen(false)}>
              Pricing
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-sm font-semibold text-accent hover:opacity-90" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-text-muted hover:text-text" onClick={() => setOpen(false)}>
                Log In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
