import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Sayfa Bulunamadı",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-display text-8xl font-bold text-accent">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-text md:text-3xl">
        Sayfa bulunamadı
      </h1>
      <p className="mt-3 max-w-sm text-sm text-text-muted">
        Aradığın sayfa mevcut değil ya da taşınmış olabilir.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Dashboard&apos;a Git
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
