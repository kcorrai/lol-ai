"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TriangleAlert } from "lucide-react";

interface AuthPanelProps {
  /** The `// MARKER` above the panel. Uppercased by the type scale, not by hand. */
  kicker: string;
  heading: string;
  subheading: React.ReactNode;
  /** Rendered opposite the kicker. Only sign-up carries one. */
  badge?: string;
  /** `AuthTabs`, above the heading. Only the two routes that have a sibling pass one. */
  tabs?: React.ReactNode;
  children: React.ReactNode;
}

/** The chamfered HUD frame every auth form sits in (ADR-015). */
export function AuthPanel({
  kicker,
  heading,
  subheading,
  badge,
  tabs,
  children,
}: AuthPanelProps): React.ReactElement {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          {"// "}
          {kicker}
        </span>
        {badge && (
          <span className="tag-cut flex items-center gap-2 bg-accent/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-label text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {badge}
          </span>
        )}
      </div>

      <div className="notch-lg border border-border bg-surface p-7">
        {tabs}
        <h1 className="font-display text-2xl font-extrabold uppercase text-text">{heading}</h1>
        <p className="mb-5 mt-1.5 text-[13.5px] text-text-muted">{subheading}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * Log in and sign up are one panel in the design and two routes here, so the tabs are links.
 * They carry the query string across — a referral code or a pending profile claim has to survive
 * someone switching tab and switching back.
 */
export function AuthTabs({ active }: { active: "login" | "signup" }): React.ReactElement {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";

  const tabs = [
    { key: "login", label: "Log in", href: `/login${suffix}` },
    { key: "signup", label: "Sign up", href: `/register${suffix}` },
  ] as const;

  return (
    <div className="mb-6 grid grid-cols-2 border border-border bg-surface-dark p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={`flex h-8 items-center justify-center font-mono text-[11px] uppercase tracking-label transition-colors duration-150 ${
            tab.key === active
              ? "bg-accent text-background"
              : "text-text-muted hover:bg-surface-2 hover:text-text"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

/** The failed-submit block: a danger rail on the left, never a filled card. */
export function AuthError({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 border-l-2 border-danger bg-danger/10 px-3 py-2.5 text-[13px] text-text-body"
    >
      <TriangleAlert className="mt-px h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
      {children}
    </p>
  );
}

/** Its accent twin — "account created", "password updated". */
export function AuthNotice({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="border-l-2 border-accent bg-accent/10 px-3 py-2.5 text-[13px] text-text-body">
      {children}
    </p>
  );
}
