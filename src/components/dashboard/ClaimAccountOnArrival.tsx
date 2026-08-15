"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { apiFetch } from "@/lib/api/fetcher";
import { isAlreadyConnected, parseClaim } from "@/lib/riot/claim";

/**
 * Finishes a claim started on a public profile.
 *
 * A player who pressed "this is me" while signed out has already told us their Riot ID; making
 * them retype it on `/settings/accounts` after sign-up was the largest remaining piece of setup
 * friction. The claim rides the URL through registration and sign-in, and lands here.
 *
 * Renders a line while it works and nothing afterwards — the dashboard's own syncing state takes
 * over as soon as the account exists.
 */
export function ClaimAccountOnArrival(): React.ReactElement | null {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: accounts, isLoading } = useRiotAccounts();

  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  // One attempt per mount. Without it, the accounts query refetching mid-connect would fire a
  // second POST for the same account.
  const attempted = useRef(false);

  const claim = parseClaim(searchParams);

  useEffect(() => {
    if (!claim || isLoading || !accounts || attempted.current) return;

    attempted.current = true;

    // Strip the claim from the URL before the request, not after: a refresh mid-connect would
    // otherwise start it again.
    router.replace("/dashboard");

    if (isAlreadyConnected(claim, accounts)) return;

    setConnecting(true);
    apiFetch("/api/riot/connect", { method: "POST", body: JSON.stringify(claim) })
      .then(() => queryClient.invalidateQueries({ queryKey: ["riot-accounts"] }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "";
        // "Already connected" means the goal is met — only a real failure is worth showing, and
        // only because the alternative is a dashboard that silently has no account on it.
        if (!/already connected/i.test(message)) {
          setError(message || "We could not connect that account automatically.");
        }
      })
      .finally(() => setConnecting(false));
  }, [claim, accounts, isLoading, queryClient, router]);

  if (error) {
    return (
      <p
        role="alert"
        className="notch border border-l-[3px] border-border border-l-danger bg-surface px-4 py-3 text-[13px] text-text-body"
      >
        {error} You can add it by hand in{" "}
        <a href="/settings/accounts" className="text-accent hover:underline">
          account settings
        </a>
        .
      </p>
    );
  }

  if (!connecting) return null;

  return (
    <p className="notch border border-border bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-label text-text-muted">
      <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse bg-accent align-middle" />
      Connecting your account…
    </p>
  );
}
