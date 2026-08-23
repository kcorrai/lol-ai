"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePersonalMatchups } from "@/hooks/usePersonalMatchups";
// Leaf import: the counter barrel re-exports server-only services.
import type { MatchupEntry } from "@/domains/counter/types/counter.types";

interface Props {
  championId: number;
  championName: string;
}

// Signed-in users see how THEY perform on this champion (from their own ranked
// history), not just the meta-wide counters. The public tools layout has no
// QueryClientProvider, so this island supplies its own.
export function PersonalMatchupPanel(props: Props) {
  return (
    <QueryProvider>
      <PersonalMatchupInner {...props} />
    </QueryProvider>
  );
}

const TREND_LABEL: Record<MatchupEntry["trend"], string> = {
  improving: "▲ improving",
  declining: "▼ declining",
  stable: "– stable",
  insufficient_data: "",
};

function PersonalMatchupInner({ championId, championName }: Props) {
  const { status } = useSession();
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const accountId = accounts?.[0]?.id ?? null;
  const { data, isLoading, error } = usePersonalMatchups(accountId, championId);

  // Anonymous visitors already see the register CTA on the page — stay hidden.
  if (status !== "authenticated") return null;

  if (accountsLoading || (accountId && isLoading)) {
    return <Shell>Loading your {championName} matchups…</Shell>;
  }

  if (!accountId) {
    return (
      <Shell>
        Connect your Riot account to see your personal {championName} matchups.{" "}
        <Link href="/settings/accounts" className="font-semibold text-accent hover:underline">
          Connect account →
        </Link>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        Not enough ranked games on {championName} yet — play a few and check back for your best and
        worst matchups.
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-4 md:grid-cols-2">
        <MatchupColumn title="You beat" tone="up" entries={data.best} />
        <MatchupColumn title="You struggle vs" tone="down" entries={data.worst} />
      </div>
      {data.banSuggestion && (
        <p className="mt-3 text-xs text-text-muted">
          Suggested ban:{" "}
          <span className="font-semibold text-danger">
            {data.banSuggestion.opponentChampionName}
          </span>{" "}
          — you win only {data.banSuggestion.winRate.toFixed(0)}% across {data.banSuggestion.games}{" "}
          games.
        </p>
      )}
    </Shell>
  );
}

function MatchupColumn({
  title,
  tone,
  entries,
}: {
  title: string;
  tone: "up" | "down";
  entries: MatchupEntry[];
}) {
  const up = tone === "up";
  return (
    <div>
      <p
        className={`mb-2 text-xs font-semibold uppercase tracking-wide ${up ? "text-success" : "text-danger"}`}
      >
        {title}
      </p>
      {entries.length === 0 ? (
        <p className="text-xs text-text-muted">No data yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((e) => (
            <li
              key={e.opponentChampionId}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface px-2.5 py-1.5"
            >
              <ChampionIcon name={e.opponentChampionName} size={24} />
              <span className="truncate text-sm text-text">{e.opponentChampionName}</span>
              <span className="ml-auto text-xs text-text-muted">
                <span className={`font-semibold ${up ? "text-success" : "text-danger"}`}>
                  {e.winRate.toFixed(0)}%
                </span>{" "}
                · {e.games}g
                {TREND_LABEL[e.trend] && <span className="ml-1">{TREND_LABEL[e.trend]}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-2xl border border-accent/25 bg-accent/[0.04] p-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-accent">
        Your personal matchups
      </p>
      <div className="text-sm text-text-muted">{children}</div>
    </div>
  );
}
