"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Zap className="h-5 w-5 text-accent" />
          <span className="font-display text-base font-bold text-text">LoL AI Coach</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/champions" className="text-sm text-text-muted transition-colors hover:text-text">
            Şampiyonlar
          </Link>
          <Link href="/pricing" className="text-sm text-text-muted transition-colors hover:text-text">
            Fiyatlar
          </Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm text-text-muted transition-colors hover:text-text">
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Ücretsiz Başla
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/register"
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            Ücretsiz Başla
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menüyü aç"
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
            <Link href="/champions" className="text-sm text-text-muted hover:text-text" onClick={() => setOpen(false)}>
              Şampiyonlar
            </Link>
            <Link href="/pricing" className="text-sm text-text-muted hover:text-text" onClick={() => setOpen(false)}>
              Fiyatlar
            </Link>
            <Link href="/login" className="text-sm text-text-muted hover:text-text" onClick={() => setOpen(false)}>
              Giriş Yap
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
