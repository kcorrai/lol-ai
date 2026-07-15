import type { ReactNode } from "react";
import Link from "next/link";

// Small presentational primitives shared by BuildView, extracted to keep the
// main component within the file-size budget.

export function BuildLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text"
    >
      {children}
    </Link>
  );
}

export function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-2">
      <span
        className={`block text-base font-bold ${
          good === undefined ? "text-text" : good ? "text-success" : "text-danger"
        }`}
      >
        {value}
      </span>
      <span className="block text-[11px] text-text-muted">{label}</span>
    </div>
  );
}
