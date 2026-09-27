"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api/fetcher";
import type { SubscriptionInfo } from "@/lib/subscription/subscriptionService";

// Contextual upgrade prompt shown ONLY to logged-in free-plan users on the public
// tools. Logged-out visitors already get the register CTA; Pro users see nothing.
// Self-contained: uses the root SessionProvider + a plain fetch (the tools route
// group has no React Query provider).
export function ToolUpgradeNudge({ message }: { message: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [state, setState] = useState<"pending" | "hide" | "show">("pending");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setState("hide");
      return;
    }
    let active = true;
    apiFetch<SubscriptionInfo>("/api/subscription")
      .then((sub) => {
        if (!active) return;
        const isPro = sub.plan === "pro" || sub.plan === "elite" || sub.plan === "team";
        setState(isPro ? "hide" : "show");
      })
      .catch(() => {
        if (active) setState("hide");
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading]);

  if (state !== "show") return null;

  return (
    <div className="notch mt-8 flex flex-col items-start gap-4 border border-accent/40 bg-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="tag-cut mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-accent/15 text-accent">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-base font-bold uppercase tracking-[0.04em] text-text">
            You&apos;re on the Free plan
          </p>
          <p className="mt-0.5 max-w-xl text-sm text-text-muted">{message}</p>
        </div>
      </div>
      <Link
        href="/settings/billing"
        className="notch-sm btn-glow shrink-0 bg-accent px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-background transition-colors hover:bg-acid-400"
      >
        Upgrade to Pro →
      </Link>
    </div>
  );
}
