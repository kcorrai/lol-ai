import Link from "next/link";
import { ArrowRight, RefreshCw, TriangleAlert } from "lucide-react";

/** No Riot account connected — replaces the whole dashboard. */
export function NoAccountState(): React.ReactElement {
  return (
    <div className="grid min-h-[520px] place-items-center">
      <div className="notch-lg bg-hero-fade max-w-[560px] border border-border bg-surface p-8 text-center md:p-11">
        <span className="font-mono text-[11px] uppercase tracking-label text-accent">
          {"// Step 1 of 1"}
        </span>
        <h2 className="mb-2.5 mt-3.5 font-display text-[26px] font-black uppercase text-text md:text-[32px]">
          Connect your Riot account
        </h2>
        <p className="mx-auto mb-6 max-w-[46ch] text-[14.5px] text-text-body">
          Read-only access to your match history. No password, nothing to install. Your first
          review lands about 90 seconds after we finish the pull.
        </p>
        <Link
          href="/settings/accounts"
          className="tag-cut flex h-11 w-full items-center justify-center gap-2 bg-accent font-display text-xs font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600"
        >
          Connect account
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-faint">
          Riot OAuth · revoke any time in settings
        </p>
      </div>
    </div>
  );
}

/** Account linked, backfill still running. Must not read as "wait here". */
export function SyncingState({ gameName }: { gameName?: string }): React.ReactElement {
  return (
    <div className="notch-lg border border-border bg-surface p-7 md:p-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-2 w-2 animate-pulse bg-accent" />
        <span className="font-mono text-[11px] uppercase tracking-label text-accent">
          {"// Pulling match history"}
        </span>
      </div>
      <h2 className="mb-2.5 font-display text-[22px] font-extrabold uppercase text-text md:text-[26px]">
        {gameName ? `${gameName} is linked.` : "Your account is linked."} Matches are coming in.
      </h2>
      <p className="mb-5 max-w-[62ch] text-[14.5px] text-text-body">
        Riot rate-limits history pulls, so the full backfill takes a few minutes. You do not have
        to wait for it — twenty games is already enough for a first report.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/coaching"
          className="tag-cut flex h-10 items-center gap-2 bg-accent px-5 font-display text-xs font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600"
        >
          Get my first report
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <Link
          href="/settings/accounts"
          className="flex h-10 items-center px-4 font-display text-xs font-bold uppercase tracking-[0.1em] text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          Manual sync
        </Link>
      </div>
    </div>
  );
}

/** The pull failed. Everything below it is still the previous sync's data. */
export function SyncErrorState(): React.ReactElement {
  return (
    <div className="notch flex flex-wrap items-start gap-5 border border-l-[3px] border-danger bg-surface p-6">
      <TriangleAlert className="mt-0.5 h-6 w-6 shrink-0 text-danger" strokeWidth={1.75} />
      <div className="min-w-[260px] flex-1">
        <p className="font-mono text-[11px] uppercase tracking-label text-danger">
          {"// Sync failed"}
        </p>
        <h2 className="mb-2 mt-2.5 font-display text-[22px] font-extrabold uppercase text-text">
          Riot&apos;s match API stopped responding
        </h2>
        <p className="max-w-[62ch] text-sm text-text-body">
          Your history is safe. The most recent games could not be pulled, so everything below is
          from your previous sync. Reviews resume automatically when Riot is back.
        </p>
      </div>
      <Link
        href="/settings/accounts"
        className="tag-cut flex h-10 items-center gap-2 bg-accent px-4 font-display text-xs font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
        Re-sync
      </Link>
    </div>
  );
}

export function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <div className="notch-lg grid animate-pulse grid-cols-1 gap-6 border border-border bg-surface p-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid content-start gap-3">
            <div className="h-3 w-[38%] bg-surface-dark" />
            <div className="h-12 w-[70%] bg-surface-dark" />
            <div className="h-2.5 w-[88%] bg-surface-dark" />
            <div className="h-2.5 w-[64%] bg-surface-dark" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="notch h-[104px] animate-pulse border border-border bg-surface" />
        ))}
      </div>
      <div className="notch h-[280px] animate-pulse border border-border bg-surface" />
    </div>
  );
}
