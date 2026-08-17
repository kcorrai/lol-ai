"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { regionLabel } from "@/lib/riot/regions";
import { useCoachRank, useCheckRank } from "@/hooks/useCoachRank";
import { RankBadgeChip } from "@/domains/marketplace/components/RankBadgeChip";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your rank</CardTitle>
        <CardDescription>
          Read from a Riot account you have linked, and refreshed for you. Students see the date it
          was last checked — you never type a rank in.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="h-10 w-64" />}

        {data?.badge && <RankBadgeChip badge={data.badge} detailed />}

        {data !== undefined && !data.badge && (
          <p className="text-sm text-text-muted">
            No rank checked yet. Pick an account below and we will read it.
          </p>
        )}

        {data !== undefined && data.accounts.length === 0 && (
          <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            You have no Riot account linked yet, so there is nothing to read a rank from.{" "}
            <Link href="/settings/accounts" className="underline">
              Link one first
            </Link>
            .
          </p>
        )}

        {error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <ul className="space-y-2">
          {data?.accounts.map((account) => (
            <li
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
            >
              <span className="font-mono text-sm text-text">
                {account.gameName}
                <span className="text-text-muted">#{account.tagLine}</span>
                <span className="ml-2 text-xs text-text-faint">{regionLabel(account.region)}</span>
              </span>

              <Button
                size="sm"
                variant={account.isBadgeSource ? "secondary" : "default"}
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
      </CardContent>
    </Card>
  );
}
