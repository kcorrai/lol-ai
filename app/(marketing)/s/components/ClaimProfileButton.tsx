"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api/fetcher";
import { claimQuery, type ClaimTarget } from "@/lib/riot/claim";

interface Props {
  target: ClaimTarget;
}

const CTA =
  "tag-cut inline-flex h-11 items-center justify-center gap-2 bg-accent px-6 font-display text-xs font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 disabled:bg-line-2 disabled:text-text-faint";

/**
 * "This is me" — the whole distance between reading a public profile and having an account
 * that syncs.
 *
 * Signed in, it connects the account from here. Signed out, the Riot ID rides the sign-up URL so
 * that connecting happens on arrival at the dashboard. Either way `/settings/accounts`, where a
 * player used to have to retype the Riot ID they had just searched for, is out of the path.
 */
export function ClaimProfileButton({ target }: Props): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return <span className={`${CTA} pointer-events-none opacity-60`}>Checking…</span>;
  }

  if (!isAuthenticated) {
    return (
      <Link href={`/register?${claimQuery(target)}`} className={CTA}>
        <UserCheck className="h-4 w-4" strokeWidth={2} />
        This is me — track it
      </Link>
    );
  }

  async function connect(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/riot/connect", { method: "POST", body: JSON.stringify(target) });
      // No cache to invalidate: marketing pages carry no QueryClientProvider, and the dashboard
      // mounts its own on arrival.
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not connect that account.";
      // Already connected is not a failure from here — the player asked to end up tracking this
      // account, and they already are.
      if (/already connected/i.test(message)) router.push("/dashboard");
      else setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={connect} disabled={busy} className={CTA}>
        <UserCheck className="h-4 w-4" strokeWidth={2} />
        {busy ? "Connecting…" : "This is me — track it"}
      </button>
      {error && (
        <p role="alert" className="mt-2 font-mono text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
