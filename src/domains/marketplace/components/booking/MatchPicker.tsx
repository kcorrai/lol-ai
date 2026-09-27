"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/uiLocale";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useMatchArchive, archiveRows } from "@/hooks/useMatchArchive";

export const MAX_PICKED_MATCHES = 5;
const SHOWN = 10;

interface Props {
  accountId: string | null;
  onAccount: (accountId: string | null) => void;
  picked: string[];
  onPicked: (matchIds: string[]) => void;
  /** Async reviews need at least one game; for a live session the games are only context. */
  required: boolean;
}

/**
 * Choosing which of your own games the coach should look at.
 *
 * The student used to type raw match ids ("TR1_1234567890") into a box, which
 * nobody knows by heart. We already hold their games, so they tick them — and
 * attaching the account is also what lets the coach open "Session prep" and
 * read their history before the session starts.
 */
export function MatchPicker({
  accountId,
  onAccount,
  picked,
  onPicked,
  required,
}: Props): React.ReactElement {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const archive = useMatchArchive(accountId, { playerSide: "either" });
  const rows = archiveRows(archive.data).slice(0, SHOWN);

  // Default to the primary account once the list arrives, so a player with one
  // account never has to choose anything to see their games.
  useEffect(() => {
    if (accountId || !accounts?.length) return;
    onAccount((accounts.find((a) => a.isPrimary) ?? accounts[0]).id);
  }, [accountId, accounts, onAccount]);

  if (accountsLoading) return <Skeleton className="h-24 w-full" />;

  if (!accounts || accounts.length === 0) {
    return (
      <p className="border border-line-2 bg-surface-dark px-4 py-3 text-[13.5px] text-text-body">
        Link your Riot account and your recent games show up here to pick from.{" "}
        <Link href="/settings/accounts" className="text-accent underline-offset-4 hover:underline">
          Link an account
        </Link>
        {required ? " — or paste a video link below." : "."}
      </p>
    );
  }

  function toggle(id: string): void {
    if (picked.includes(id)) onPicked(picked.filter((p) => p !== id));
    else if (picked.length < MAX_PICKED_MATCHES) onPicked([...picked, id]);
  }

  return (
    <div className="grid gap-3">
      {accounts.length > 1 && (
        <label className="grid gap-1.5 text-[12.5px] text-text-muted">
          Account
          <select
            value={accountId ?? ""}
            onChange={(e) => {
              onAccount(e.target.value || null);
              onPicked([]);
            }}
            className="h-10 border border-line-2 bg-surface-dark px-3 text-[13.5px] text-text"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.gameName}#{account.tagLine}
              </option>
            ))}
          </select>
        </label>
      )}

      {archive.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length === 0 ? (
        <p className="text-[13px] text-text-muted">No games stored for this account yet.</p>
      ) : (
        <ul className="grid gap-1.5" aria-label="Your recent games">
          {rows.map((row) => {
            const on = picked.includes(row.riotMatchId);
            const full = !on && picked.length >= MAX_PICKED_MATCHES;
            return (
              <li key={row.participantId}>
                <button
                  type="button"
                  onClick={() => toggle(row.riotMatchId)}
                  disabled={full}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full items-center gap-3 border px-3 py-2 text-left transition-colors",
                    on
                      ? "border-accent/60 bg-accent/10"
                      : "border-line-1 bg-surface-dark hover:border-line-3",
                    full && "cursor-not-allowed opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center border",
                      on ? "border-accent bg-accent text-background" : "border-line-3"
                    )}
                    aria-hidden
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <ChampionIcon name={row.championName} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-text">
                      {row.championName}
                      <span
                        className={cn("ml-2 text-[12px]", row.won ? "text-accent" : "text-danger")}
                      >
                        {row.won ? "Win" : "Loss"}
                      </span>
                    </span>
                    <span className="block text-[11.5px] text-text-muted">
                      {row.kills}/{row.deaths}/{row.assists} ·{" "}
                      {formatDate(row.gameStart, { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[12px] text-text-muted">
        {picked.length}/{MAX_PICKED_MATCHES} picked
        {required ? " · at least one, or a video link below" : " · optional, but it helps"}
      </p>
    </div>
  );
}
