"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { regionLabel } from "@/lib/riot/regions";
import { tierColorClass } from "@/lib/riot/rankDisplay";
import { formatRank } from "@/domains/marketplace/rank";
import { useCoachRank, useCheckRank } from "@/hooks/useCoachRank";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { StatusChip } from "@/domains/marketplace/components/hud/StatusChip";

/**
 * Where a coach turns a linked account into a rank badge.
 *
 * The coach chooses the account and nothing else — there is no field to type a
 * rank into, which is the entire difference between this and every competitor's
 * bio box. If we hold no ranked snapshot for the account yet, the answer is to
 * sync it, not to let them assert one.
 */
export function RankProofPanel(): React.ReactElement {
  const { data, isLoading } = useCoachRank();
  const check = useCheckRank();
  const [error, setError] = useState<string | null>(null);

  function handleCheck(riotAccountId: string): void {
    setError(null);
    check.mutate(riotAccountId, {
      onError: (err) =>
        setError(err instanceof Error ? err.message : "Could not read that account's rank."),
    });
  }

  const badge = data?.badge ?? null;

  return (
    <HudPanel
      label="Step 1 · Your rank"
      tone={badge ? "accent" : "warn"}
      action={
        <StatusChip tone={badge ? "good" : "warn"}>
          {badge ? "Checked" : check.isPending ? "Reading…" : "Required"}
        </StatusChip>
      }
    >
      {isLoading && <Skeleton className="h-10 w-64" />}

      {badge && (
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2.5 text-accent">
            <ShieldCheck className="h-5 w-5" aria-hidden />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em]">
              Checked by LaneIQ
            </span>
          </span>
          <span className="h-6 w-px bg-line-1" aria-hidden />
          <span
            className={`font-mono text-xl font-bold tracking-[0.05em] ${tierColorClass(badge.tier)}`}
          >
            {formatRank({
              tier: badge.tier,
              division: badge.division,
              leaguePoints: badge.leaguePoints,
            })}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
            {badge.peakTier &&
              `peak ${formatRank({ tier: badge.peakTier, division: badge.peakDivision ?? "I" })} · `}
            {badge.stale ? "needs a refresh" : `checked ${day(badge.checkedAt)}`}
          </span>
        </div>
      )}

      {data !== undefined && !badge && (
        <>
          <p className="font-display text-[18px] font-extrabold uppercase tracking-[0.03em] text-text">
            Link the account you actually play on
          </p>
          <p className="mt-2.5 max-w-[62ch] text-[14.5px] text-text-body">
            We read the rank from it and re-check it for you. Students see the rank and the date —
            never a number you typed. There is no field here to type one into.
          </p>
        </>
      )}

      {badge && (
        <p className="mt-3.5 max-w-[62ch] text-[13.5px] text-text-body">
          This is what students see, alongside the date. It refreshes on its own — if you drop, the
          profile drops with you.
        </p>
      )}

      {data !== undefined && data.accounts.length === 0 && (
        <p className="mt-3.5 border-l-2 border-warning bg-warning/10 px-4 py-3 text-sm text-warning">
          {/* A badge with no account behind it is a rank nobody can refresh —
              it will go stale on the profile and there is no way back from
              here, so say which of the two problems this is. */}
          {badge
            ? "There is no linked Riot account to refresh this badge from any more, so it will go stale on your profile."
            : "You have no Riot account linked yet, so there is nothing to read a rank from."}{" "}
          <Link href="/settings/accounts" className="underline">
            {badge ? "Link one again" : "Link one first"}
          </Link>
          .
        </p>
      )}

      {error && (
        <p className="mt-3.5 border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {data !== undefined && data.accounts.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {data.accounts.map((account) => (
            <li
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-line-2 bg-surface-dark px-4 py-2.5"
            >
              <span className="font-mono text-sm text-text">
                {account.gameName}
                <span className="text-text-muted">#{account.tagLine}</span>
                <span className="ml-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
                  {regionLabel(account.region)}
                </span>
              </span>

              <Button
                size="sm"
                variant={account.isBadgeSource ? "ghost" : "default"}
                disabled={check.isPending}
                onClick={() => handleCheck(account.id)}
              >
                {check.isPending
                  ? "Checking…"
                  : account.isBadgeSource
                    ? "Check again"
                    : "Use this account"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
        Read-only &middot; we never ask for your Riot password
      </p>
    </HudPanel>
  );
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
