"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useThreads } from "@/hooks/useThreads";
import { ThreadView } from "@/domains/marketplace/components/ThreadView";
import { CoachPortrait } from "@/domains/marketplace/components/hud/CoachPortrait";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";
import { StatusChip } from "@/domains/marketplace/components/hud/StatusChip";
import { statusMeta } from "@/domains/marketplace/components/BookingRow";

export default function MessagesPage(): React.ReactElement {
  const { data, isLoading } = useThreads();
  const [open, setOpen] = useState<string | null>(null);

  const threads = data?.threads ?? [];
  const selected = open ?? threads[0]?.id ?? null;
  const unread = threads.reduce((total, thread) => total + thread.unread, 0);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-14 pt-7 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[30px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[36px]">
            Messages
          </h1>
          <p className="mt-3 max-w-[60ch] text-[15px] text-text-body">
            Keep it here. Sessions arranged off LaneIQ are not covered if something goes wrong —
            and contact details get stripped on purpose.
          </p>
        </div>
        <div className="flex gap-6 pb-1">
          <MarketStat
            label="Unread"
            value={String(unread)}
            tone={unread > 0 ? "accent" : "default"}
          />
          <MarketStat label="Threads" value={String(threads.length)} />
        </div>
      </div>

      {isLoading && <Skeleton className="mt-6 h-96 w-full" />}

      {!isLoading && threads.length === 0 && (
        <section className="notch mt-6 border border-border bg-surface px-7 py-14 text-center">
          <span
            className="notch-sm mb-4 inline-flex h-[50px] w-[50px] items-center justify-center border border-line-2 text-text-muted"
            aria-hidden
          >
            <MessagesSquare className="h-[22px] w-[22px]" />
          </span>
          <p className="font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text">
            No conversations
          </p>
          <p className="mx-auto mt-3 max-w-[46ch] text-[14.5px] text-text-body">
            A thread opens once you have booked a coach, or once somebody has booked you. That gate
            is deliberate — it is what stops the section becoming a cold-message inbox.
          </p>
        </section>
      )}

      {threads.length > 0 && (
        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[288px_minmax(0,1fr)]">
          <nav className="notch overflow-hidden border border-border bg-surface">
            <p className="border-b border-line-1 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              {"// Threads"}
            </p>
            {threads.map((thread) => {
              const active = thread.id === selected;
              const state = thread.bookingStatus ? statusMeta(thread.bookingStatus) : null;

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setOpen(thread.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-l-2 border-line-1 px-4 py-3 text-left transition-colors last:border-b-0",
                    active
                      ? "border-l-accent bg-accent/10"
                      : "border-l-transparent hover:bg-surface-2"
                  )}
                >
                  <CoachPortrait name={thread.withName} size="sm" />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2.5">
                      <span
                        className={cn(
                          "truncate font-display text-[13.5px] font-bold uppercase tracking-[0.03em]",
                          active ? "text-accent" : "text-text"
                        )}
                      >
                        {thread.withName}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] tracking-[0.1em] text-text-faint">
                        {ago(thread.lastMessageAt)}
                      </span>
                    </span>

                    <span className="mt-1 block truncate text-[12.5px] text-text-muted">
                      {thread.preview ?? "No messages yet"}
                    </span>

                    <span className="mt-2 flex items-center gap-2">
                      {state && <StatusChip tone={state.tone}>{state.label}</StatusChip>}
                      {thread.unread > 0 && (
                        <span className="grid h-[17px] w-[17px] place-items-center rounded-full bg-accent font-mono text-[9px] font-bold text-background">
                          {thread.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          {selected && <ThreadView conversationId={selected} />}
        </div>
      )}

      <p className="mt-5 max-w-[92ch] font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
        Both sides keep a record of every thread, and a dispute is read against it
      </p>
    </div>
  );
}

/** "2h", "3d" — the list only needs to know how stale a thread is. */
function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
