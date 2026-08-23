"use client";

import { useEffect, useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import { formatPairingCode } from "@/domains/desktop/pairingCode";
import { useIssuePairingCode } from "@/hooks/useDesktopDevices";

/** Whole seconds left, floored at zero. */
function secondsLeft(expiresAt: string, now: number): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

function countdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PairingCodePanel(): React.ReactElement {
  const issue = useIssuePairingCode();
  const [now, setNow] = useState(() => Date.now());

  const issued = issue.data ?? null;
  const remaining = issued ? secondsLeft(issued.expiresAt, now) : 0;
  const live = remaining > 0;

  // Only while a code is on screen. A timer left running behind a settings page
  // nobody is looking at is a re-render a second, for ever.
  useEffect(() => {
    if (!issued) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [issued]);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div>
        <p className="text-sm font-semibold text-text">Pair a device</p>
        <p className="mt-0.5 text-xs text-text-muted">
          Open the desktop app, go to Pairing, and type this code. It works once.
        </p>
      </div>

      {issued && (
        <div
          className={`rounded-lg border p-4 text-center transition-colors ${
            live ? "border-accent/40 bg-accent/5" : "border-border bg-surface-2"
          }`}
        >
          <p
            className={`font-mono text-3xl font-bold tracking-[0.2em] ${
              live ? "text-accent" : "text-text-muted line-through"
            }`}
          >
            {formatPairingCode(issued.code)}
          </p>
          <p className="mt-2 text-[11px] text-text-muted">
            {live ? `Expires in ${countdown(remaining)}` : "Expired — generate another"}
          </p>
        </div>
      )}

      {issue.isError && (
        <p className="text-xs text-danger">
          {issue.error instanceof Error ? issue.error.message : "Could not generate a code"}
        </p>
      )}

      <button
        onClick={() => issue.mutate()}
        disabled={issue.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {issued ? <RefreshCw className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
        {issue.isPending ? "Generating…" : issued ? "Generate a new code" : "Generate a code"}
      </button>

      {/* Said out loud because generating again is also the "I lost it" button,
          and a player who does that mid-pairing needs to know why the app just
          started refusing the code they were typing. */}
      <p className="text-[11px] text-text-muted">Generating a new code cancels the previous one.</p>
    </div>
  );
}
